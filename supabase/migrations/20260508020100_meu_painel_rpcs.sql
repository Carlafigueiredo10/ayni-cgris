-- ============================================================
-- RPCs do modulo Meu Painel
-- ============================================================
--
-- Toda escrita passa por RPC SECURITY DEFINER. As RPCs validam:
--   - autenticacao (auth.uid() NOT NULL)
--   - permissao via _meu_painel_pode_gerir(owner)
--   - regras de origem (so PESSOAL e aceita por enquanto)
--   - regras de COORDENACAO no futuro: itens com origem=COORDENACAO
--     nao permitem editar referencia/assunto/prazo/prioridade/tipo
--     pelo servidor — somente registrar acoes e concluir/reabrir.
--
-- Convencao: parametro p_owner_id = NULL significa self.

-- ------------------------------------------------------------
-- meu_item_criar: cria item PESSOAL (origem=COORDENACAO bloqueada).
-- Se houver primeira_acao, registra MANUAL imediatamente.
-- Se caller != owner (gestor criando para subordinado), registra
-- acao SISTEMA "[Item criado por <gestor>]".
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_criar(
  p_owner_id     UUID DEFAULT NULL,
  p_tipo         public.meu_item_tipo DEFAULT 'TAREFA',
  p_referencia   TEXT DEFAULT NULL,
  p_assunto      TEXT DEFAULT NULL,
  p_prioridade   public.meu_item_prioridade DEFAULT 'NORMAL',
  p_prazo        DATE DEFAULT NULL,
  p_notify_email BOOLEAN DEFAULT TRUE,
  p_primeira_acao TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller    UUID := auth.uid();
  v_owner     UUID;
  v_id        UUID;
  v_caller_nome TEXT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF p_assunto IS NULL OR length(trim(p_assunto)) = 0 THEN
    RAISE EXCEPTION 'Assunto e obrigatorio';
  END IF;

  v_owner := COALESCE(p_owner_id, v_caller);

  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para criar item neste painel';
  END IF;

  INSERT INTO public.meus_itens (
    owner_id, tipo, referencia, assunto, prioridade,
    prazo, notify_email, origem
  ) VALUES (
    v_owner, p_tipo, NULLIF(trim(p_referencia), ''), trim(p_assunto), p_prioridade,
    p_prazo, p_notify_email, 'PESSOAL'
  )
  RETURNING id INTO v_id;

  -- Acao SISTEMA: criado por gestor (se aplicavel)
  IF v_caller <> v_owner THEN
    SELECT display_name INTO v_caller_nome
    FROM public.profiles WHERE id = v_caller;
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (v_id, 'SISTEMA',
            '[Item criado por ' || COALESCE(v_caller_nome, 'gestor') || ']',
            v_caller);
  END IF;

  -- Primeira acao MANUAL (opcional)
  IF p_primeira_acao IS NOT NULL AND length(trim(p_primeira_acao)) > 0 THEN
    INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
    VALUES (v_id, 'MANUAL', trim(p_primeira_acao), v_caller);
  END IF;

  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_criar(UUID, public.meu_item_tipo, TEXT, TEXT, public.meu_item_prioridade, DATE, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_criar(UUID, public.meu_item_tipo, TEXT, TEXT, public.meu_item_prioridade, DATE, BOOLEAN, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- meu_item_registrar_acao: append-only no historico (MANUAL).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_registrar_acao(
  p_item_id   UUID,
  p_descricao TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
  v_id     UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF p_descricao IS NULL OR length(trim(p_descricao)) = 0 THEN
    RAISE EXCEPTION 'Descricao da acao e obrigatoria';
  END IF;

  SELECT owner_id INTO v_owner
  FROM public.meus_itens
  WHERE id = p_item_id AND deleted_at IS NULL;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item nao encontrado';
  END IF;

  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para registrar acao neste item';
  END IF;

  INSERT INTO public.meus_itens_acoes (item_id, tipo, descricao, created_by)
  VALUES (p_item_id, 'MANUAL', trim(p_descricao), v_caller)
  RETURNING id INTO v_id;

  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_registrar_acao(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_registrar_acao(UUID, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- meu_item_atualizar: edita campos editaveis. Itens com origem=
-- COORDENACAO bloqueiam mudanca de referencia/assunto/prazo
-- (servidor so registra acao ou conclui).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_atualizar(
  p_id           UUID,
  p_referencia   TEXT DEFAULT NULL,
  p_assunto      TEXT DEFAULT NULL,
  p_prazo        DATE DEFAULT NULL,
  p_prioridade   public.meu_item_prioridade DEFAULT NULL,
  p_notify_email BOOLEAN DEFAULT NULL,
  p_pinned       BOOLEAN DEFAULT NULL,
  p_limpar_prazo BOOLEAN DEFAULT FALSE   -- forca prazo=NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
  v_origem public.meu_item_origem;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT owner_id, origem INTO v_owner, v_origem
  FROM public.meus_itens
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item nao encontrado';
  END IF;

  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para editar este item';
  END IF;

  -- Itens atribuidos pela coordenacao: servidor nao edita campos institucionais
  IF v_origem = 'COORDENACAO' AND v_caller = v_owner THEN
    IF p_referencia IS NOT NULL OR p_assunto IS NOT NULL
       OR p_prazo IS NOT NULL OR p_limpar_prazo
       OR p_prioridade IS NOT NULL THEN
      RAISE EXCEPTION 'Item atribuido pela Coordenacao nao pode ser editado pelo servidor (registre acao ou conclua)';
    END IF;
  END IF;

  UPDATE public.meus_itens SET
    referencia   = COALESCE(NULLIF(trim(p_referencia), ''), referencia),
    assunto      = COALESCE(NULLIF(trim(p_assunto), ''), assunto),
    prazo        = CASE WHEN p_limpar_prazo THEN NULL
                        WHEN p_prazo IS NOT NULL THEN p_prazo
                        ELSE prazo END,
    prioridade   = COALESCE(p_prioridade, prioridade),
    notify_email = COALESCE(p_notify_email, notify_email),
    pinned       = COALESCE(p_pinned, pinned)
  WHERE id = p_id;

  -- Mexer no prazo zera o controle de avisos para nao spammar
  IF p_limpar_prazo OR p_prazo IS NOT NULL THEN
    UPDATE public.meus_itens
    SET ultimo_aviso_em = NULL
    WHERE id = p_id;
  END IF;

  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_atualizar(UUID, TEXT, TEXT, DATE, public.meu_item_prioridade, BOOLEAN, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_atualizar(UUID, TEXT, TEXT, DATE, public.meu_item_prioridade, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;

-- ------------------------------------------------------------
-- meu_item_concluir / meu_item_reabrir
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_concluir(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT owner_id INTO v_owner
  FROM public.meus_itens
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item nao encontrado'; END IF;
  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para concluir este item';
  END IF;

  UPDATE public.meus_itens
  SET concluido_em = COALESCE(concluido_em, now())
  WHERE id = p_id;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_concluir(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_concluir(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.meu_item_reabrir(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT owner_id INTO v_owner
  FROM public.meus_itens
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item nao encontrado'; END IF;
  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para reabrir este item';
  END IF;

  UPDATE public.meus_itens SET concluido_em = NULL WHERE id = p_id;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_reabrir(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_reabrir(UUID) TO authenticated;

-- ------------------------------------------------------------
-- meu_item_excluir: soft-delete. Trigger registra acao SISTEMA
-- automaticamente ANTES do item desaparecer da view.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_excluir(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT owner_id INTO v_owner
  FROM public.meus_itens
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item nao encontrado'; END IF;
  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para excluir este item';
  END IF;

  UPDATE public.meus_itens SET deleted_at = now() WHERE id = p_id;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_excluir(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_excluir(UUID) TO authenticated;

-- ------------------------------------------------------------
-- meu_item_listar: lista itens do owner com a ultima acao inline
-- (LATERAL JOIN evita N+1 na UI). Filtra abertos/concluidos.
-- Ordem: pinned -> vencidos -> prazo -> sem prazo -> created_at.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_listar(
  p_owner_id           UUID DEFAULT NULL,
  p_incluir_concluidos BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id              UUID,
  owner_id        UUID,
  owner_nome      TEXT,
  tipo            public.meu_item_tipo,
  referencia      TEXT,
  assunto         TEXT,
  prioridade      public.meu_item_prioridade,
  prazo           DATE,
  notify_email    BOOLEAN,
  pinned          BOOLEAN,
  concluido_em    TIMESTAMPTZ,
  origem          public.meu_item_origem,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  ultima_acao_id          UUID,
  ultima_acao_descricao   TEXT,
  ultima_acao_em          TIMESTAMPTZ,
  ultima_acao_tipo        public.meu_item_acao_tipo,
  ultima_acao_por_id      UUID,
  ultima_acao_por_nome    TEXT,
  ultima_acao_por_self    BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  v_owner := COALESCE(p_owner_id, v_caller);

  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para visualizar este painel';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.owner_id,
    po.display_name,
    i.tipo,
    i.referencia,
    i.assunto,
    i.prioridade,
    i.prazo,
    i.notify_email,
    i.pinned,
    i.concluido_em,
    i.origem,
    i.created_at,
    i.updated_at,
    a.id,
    a.descricao,
    a.created_at,
    a.tipo,
    a.created_by,
    pa.display_name,
    (a.created_by = i.owner_id)
  FROM public.meus_itens i
  JOIN public.profiles po ON po.id = i.owner_id
  LEFT JOIN LATERAL (
    SELECT ax.id, ax.descricao, ax.created_at, ax.tipo, ax.created_by
    FROM public.meus_itens_acoes ax
    WHERE ax.item_id = i.id
    ORDER BY ax.created_at DESC
    LIMIT 1
  ) a ON TRUE
  LEFT JOIN public.profiles pa ON pa.id = a.created_by
  WHERE i.deleted_at IS NULL
    AND i.owner_id = v_owner
    AND (p_incluir_concluidos OR i.concluido_em IS NULL)
  ORDER BY
    i.pinned DESC,
    (i.prazo IS NULL),
    i.prazo ASC,
    i.created_at DESC;
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_listar(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_listar(UUID, BOOLEAN) TO authenticated;

-- ------------------------------------------------------------
-- meu_item_historico: paginado. Sempre ordenado DESC.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_item_historico(
  p_item_id UUID,
  p_limit   INT DEFAULT 50,
  p_offset  INT DEFAULT 0
)
RETURNS TABLE (
  id          UUID,
  tipo        public.meu_item_acao_tipo,
  descricao   TEXT,
  created_at  TIMESTAMPTZ,
  created_by  UUID,
  autor_nome  TEXT,
  autor_self  BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_owner  UUID;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT owner_id INTO v_owner
  FROM public.meus_itens
  WHERE id = p_item_id AND deleted_at IS NULL;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item nao encontrado'; END IF;
  IF NOT public._meu_painel_pode_gerir(v_owner) THEN
    RAISE EXCEPTION 'Sem permissao para ver historico deste item';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.tipo,
    a.descricao,
    a.created_at,
    a.created_by,
    pa.display_name,
    (a.created_by = v_owner)
  FROM public.meus_itens_acoes a
  LEFT JOIN public.profiles pa ON pa.id = a.created_by
  WHERE a.item_id = p_item_id
  ORDER BY a.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END; $$;
REVOKE ALL ON FUNCTION public.meu_item_historico(UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_item_historico(UUID, INT, INT) TO authenticated;

-- ------------------------------------------------------------
-- meu_painel_servidores_geriveis: lista paineis que o caller
-- pode visualizar/editar (alem do proprio). Para o seletor do
-- gestor. Servidor comum recebe lista vazia.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meu_painel_servidores_geriveis()
RETURNS TABLE (
  id           UUID,
  display_name TEXT,
  email        TEXT,
  team_id      UUID,
  team_code    TEXT,
  team_name    TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_role   TEXT;
  v_team   UUID;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = v_caller;

  IF v_role NOT IN ('manager_cgris','manager_team') THEN
    -- Servidor comum nao tem subordinados
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.display_name, p.email, p.team_id, t.code, t.name
  FROM public.profiles p
  LEFT JOIN public.teams t ON t.id = p.team_id
  WHERE p.id <> v_caller
    AND p.is_active IS NOT FALSE
    AND (
      v_role = 'manager_cgris'
      OR (v_role = 'manager_team' AND v_team IS NOT NULL AND p.team_id = v_team)
    )
  ORDER BY p.display_name;
END; $$;
REVOKE ALL ON FUNCTION public.meu_painel_servidores_geriveis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_painel_servidores_geriveis() TO authenticated;

NOTIFY pgrst, 'reload schema';
