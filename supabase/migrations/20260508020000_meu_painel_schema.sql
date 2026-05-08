-- ============================================================
-- Modulo Meu Painel: agenda/controle pessoal por servidor
-- ============================================================
--
-- Painel individual vinculado ao login. Cada servidor mantem
-- sua propria lista de PROCESSOS, TAREFAS e LEMBRETES, com
-- historico cronologico imutavel (append-only).
--
-- Decisoes-chave:
--   - meus_itens: 1 linha por item, owner = servidor responsavel.
--   - meus_itens_acoes: append-only. NAO ha policy de UPDATE/DELETE.
--     Soft-delete do item esconde o historico via JOIN.
--   - Eventos do sistema (conclusao, reabertura, prazo, prioridade,
--     exclusao por gestor) sao registrados automaticamente via
--     trigger AFTER UPDATE. Criacao NAO usa trigger — a RPC
--     meu_item_criar registra a acao inicial explicitamente.
--   - Acoes tem tipo MANUAL ou SISTEMA. UI distingue visualmente.
--   - Permissoes: owner sempre; manager_team da mesma equipe;
--     manager_cgris (todas equipes). admin_global NAO tem poder
--     automatico aqui — decisao da gestao.
--   - Arquitetura para fase futura: campos origem/processo_ref_id/
--     atribuido_por/atribuido_em ja existem mas hoje so aceitam
--     PESSOAL. Quando o modulo "Processos da Coordenacao" existir,
--     basta criar a tabela alvo, adicionar FK em processo_ref_id
--     e habilitar origem='COORDENACAO' nas RPCs.

-- ------------------------------------------------------------
-- 1) Enums
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.meu_item_tipo AS ENUM (
    'PROCESSO','TAREFA','LEMBRETE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.meu_item_prioridade AS ENUM (
    'BAIXA','NORMAL','ALTA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.meu_item_origem AS ENUM (
    'PESSOAL','COORDENACAO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.meu_item_acao_tipo AS ENUM (
    'MANUAL','SISTEMA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2) Tabela meus_itens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meus_itens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo            public.meu_item_tipo NOT NULL,
  referencia      TEXT,
  assunto         TEXT NOT NULL,
  prioridade      public.meu_item_prioridade NOT NULL DEFAULT 'NORMAL',
  prazo           DATE,
  notify_email    BOOLEAN NOT NULL DEFAULT TRUE,
  pinned          BOOLEAN NOT NULL DEFAULT FALSE,
  concluido_em    TIMESTAMPTZ,
  ultimo_aviso_em DATE,
  -- Reservados para o modulo futuro de Processos da Coordenacao
  origem          public.meu_item_origem NOT NULL DEFAULT 'PESSOAL',
  processo_ref_id UUID,
  atribuido_por   UUID REFERENCES public.profiles(id),
  atribuido_em    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT meus_itens_assunto_nao_vazio CHECK (length(trim(assunto)) > 0),
  CONSTRAINT meus_itens_origem_coerencia CHECK (
    (origem = 'PESSOAL'
       AND processo_ref_id IS NULL
       AND atribuido_por IS NULL
       AND atribuido_em IS NULL)
    OR
    (origem = 'COORDENACAO'
       AND processo_ref_id IS NOT NULL
       AND atribuido_por IS NOT NULL
       AND atribuido_em IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_meus_itens_owner_prazo
  ON public.meus_itens(owner_id, prazo NULLS LAST)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_meus_itens_owner_concluido
  ON public.meus_itens(owner_id, concluido_em)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_meus_itens_owner_pinned
  ON public.meus_itens(owner_id, pinned)
  WHERE deleted_at IS NULL AND pinned = TRUE;

DROP TRIGGER IF EXISTS trg_meus_itens_touch ON public.meus_itens;
CREATE TRIGGER trg_meus_itens_touch
  BEFORE UPDATE ON public.meus_itens
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 3) Tabela meus_itens_acoes (append-only / diario operacional)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meus_itens_acoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES public.meus_itens(id) ON DELETE CASCADE,
  tipo        public.meu_item_acao_tipo NOT NULL DEFAULT 'MANUAL',
  descricao   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES public.profiles(id),
  CONSTRAINT meus_itens_acoes_descricao_nao_vazia CHECK (length(trim(descricao)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_meus_itens_acoes_item
  ON public.meus_itens_acoes(item_id, created_at DESC);

-- ------------------------------------------------------------
-- 4) Helper: caller pode gerir o painel deste owner?
--    - owner_id = auth.uid()  -> sempre
--    - manager_team mesma equipe -> sim
--    - manager_cgris            -> sim
--    - admin_global / outros    -> nao (decisao da gestao)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._meu_painel_pode_gerir(p_owner UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles caller
    LEFT JOIN public.profiles target ON target.id = p_owner
    WHERE caller.id = auth.uid()
      AND (
        caller.id = p_owner
        OR caller.role = 'manager_cgris'
        OR (
          caller.role = 'manager_team'
          AND caller.team_id IS NOT NULL
          AND caller.team_id = target.team_id
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION public._meu_painel_pode_gerir(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._meu_painel_pode_gerir(UUID) TO authenticated;

-- ------------------------------------------------------------
-- 5) Trigger de eventos do sistema (AFTER UPDATE)
--    Compara OLD/NEW e registra acoes SISTEMA no historico.
--    Eventos cobertos:
--      - Conclusao  (concluido_em vira NOT NULL)
--      - Reabertura (concluido_em vira NULL)
--      - Prazo alterado / definido / removido
--      - Prioridade alterada
--      - Soft-delete (deleted_at vira NOT NULL) — registra antes
--        de o item sumir da view, e identifica autor (owner ou gestor).
--    NAO cobre INSERT — a RPC meu_item_criar registra a acao
--    inicial explicitamente (e a 'criado por gestor', se for o caso).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._meu_painel_registrar_evento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller     UUID := auth.uid();
  v_caller_eh_gestor BOOLEAN;
  v_caller_nome TEXT;
  v_sufixo_gestor TEXT := '';
  v_descricao TEXT;
BEGIN
  -- Caller diferente do dono => identifica como gestor
  IF v_caller IS NOT NULL AND v_caller <> NEW.owner_id THEN
    SELECT display_name INTO v_caller_nome
    FROM public.profiles WHERE id = v_caller;
    v_sufixo_gestor := ' por ' || COALESCE(v_caller_nome, 'gestor');
  END IF;

  -- Conclusao
  IF OLD.concluido_em IS NULL AND NEW.concluido_em IS NOT NULL THEN
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (NEW.id, 'SISTEMA', '[Concluido]' || v_sufixo_gestor, v_caller);
  END IF;

  -- Reabertura
  IF OLD.concluido_em IS NOT NULL AND NEW.concluido_em IS NULL THEN
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (NEW.id, 'SISTEMA', '[Reaberto]' || v_sufixo_gestor, v_caller);
  END IF;

  -- Prazo alterado
  IF OLD.prazo IS DISTINCT FROM NEW.prazo THEN
    IF OLD.prazo IS NULL AND NEW.prazo IS NOT NULL THEN
      v_descricao := '[Prazo definido para ' || to_char(NEW.prazo, 'DD/MM/YYYY') || ']';
    ELSIF OLD.prazo IS NOT NULL AND NEW.prazo IS NULL THEN
      v_descricao := '[Prazo removido]';
    ELSE
      v_descricao := '[Prazo alterado de ' || to_char(OLD.prazo, 'DD/MM/YYYY')
                  || ' para ' || to_char(NEW.prazo, 'DD/MM/YYYY') || ']';
    END IF;
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (NEW.id, 'SISTEMA', v_descricao || v_sufixo_gestor, v_caller);
  END IF;

  -- Prioridade alterada
  IF OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (
      NEW.id, 'SISTEMA',
      '[Prioridade: ' || OLD.prioridade::text || ' -> ' || NEW.prioridade::text || ']' || v_sufixo_gestor,
      v_caller
    );
  END IF;

  -- Soft-delete (registra antes do item desaparecer da view)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (NEW.id, 'SISTEMA', '[Item excluido]' || v_sufixo_gestor, v_caller);
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public._meu_painel_registrar_evento() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_meus_itens_eventos ON public.meus_itens;
CREATE TRIGGER trg_meus_itens_eventos
  AFTER UPDATE ON public.meus_itens
  FOR EACH ROW
  EXECUTE FUNCTION public._meu_painel_registrar_evento();

-- ------------------------------------------------------------
-- 6) RLS — meus_itens (SELECT). Escrita exclusiva via RPCs.
-- ------------------------------------------------------------
ALTER TABLE public.meus_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meus_itens_select ON public.meus_itens;
CREATE POLICY meus_itens_select ON public.meus_itens
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND public._meu_painel_pode_gerir(owner_id)
  );

-- ------------------------------------------------------------
-- 7) RLS — meus_itens_acoes (SELECT). Append-only: SEM policy
--    de INSERT/UPDATE/DELETE. Toda escrita passa pelas RPCs e
--    pelo trigger (que rodam SECURITY DEFINER e bypassam RLS).
-- ------------------------------------------------------------
ALTER TABLE public.meus_itens_acoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meus_itens_acoes_select ON public.meus_itens_acoes;
CREATE POLICY meus_itens_acoes_select ON public.meus_itens_acoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meus_itens i
      WHERE i.id = meus_itens_acoes.item_id
        AND i.deleted_at IS NULL
        AND public._meu_painel_pode_gerir(i.owner_id)
    )
  );

NOTIFY pgrst, 'reload schema';
