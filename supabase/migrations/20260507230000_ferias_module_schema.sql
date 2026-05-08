-- ============================================================
-- Modulo Ferias: coordenacao operacional (NAO substitui SOUGOV)
-- ============================================================
--
-- Camada leve para alinhamento de ferias entre servidor e gestor.
-- Nao bloqueia, nao substitui sistema oficial. Apenas coordena
-- visibilidade de sobreposicao por equipe + pares criticos.
--
-- - ferias: solicitacao por servidor (profiles.id), com status
--   PENDENTE / APROVADA / AJUSTAR / CANCELADA. Soft-delete via
--   deleted_at. APROVADAs nao podem sobrepor para mesma pessoa
--   (EXCLUDE constraint), mas PENDENTEs podem coexistir.
-- - servidor_relacao_critica: pares de servidores que nao
--   deveriam tirar ferias simultaneamente. Mantido manualmente.
-- - RLS: SELECT permitido para o proprio servidor, gestor da
--   equipe, manager_cgris e admin_global. Escrita via RPCs.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Enum de status
DO $$ BEGIN
  CREATE TYPE public.ferias_status AS ENUM (
    'PENDENTE','APROVADA','AJUSTAR','CANCELADA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tabela ferias
CREATE TABLE IF NOT EXISTS public.ferias (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_inicio         DATE NOT NULL,
  data_fim            DATE NOT NULL,
  status              public.ferias_status NOT NULL DEFAULT 'PENDENTE',
  observacao_servidor TEXT,
  observacao_gestor   TEXT,
  created_by          UUID NOT NULL REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT ferias_data_valida CHECK (data_fim >= data_inicio),
  CONSTRAINT ferias_aprovadas_no_overlap EXCLUDE USING gist (
    servidor_id WITH =,
    daterange(data_inicio, data_fim, '[]') WITH &&
  ) WHERE (status = 'APROVADA' AND deleted_at IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_ferias_servidor
  ON public.ferias(servidor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ferias_status
  ON public.ferias(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ferias_periodo
  ON public.ferias USING gist (daterange(data_inicio, data_fim, '[]'))
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_ferias_touch ON public.ferias;
CREATE TRIGGER trg_ferias_touch
  BEFORE UPDATE ON public.ferias
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Tabela de relacao critica (pares que nao devem coincidir)
CREATE TABLE IF NOT EXISTS public.servidor_relacao_critica (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relacionado_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  observacao      TEXT,
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT srel_critica_distintos CHECK (servidor_id <> relacionado_id),
  CONSTRAINT srel_critica_unico UNIQUE (servidor_id, relacionado_id)
);

CREATE INDEX IF NOT EXISTS idx_srel_critica_servidor
  ON public.servidor_relacao_critica(servidor_id);
CREATE INDEX IF NOT EXISTS idx_srel_critica_relacionado
  ON public.servidor_relacao_critica(relacionado_id);

-- 4) RLS - ferias (SELECT). Escrita so via RPC.
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ferias_select ON public.ferias;
CREATE POLICY ferias_select ON public.ferias
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      servidor_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.profiles caller
        LEFT JOIN public.profiles target ON target.id = ferias.servidor_id
        WHERE caller.id = auth.uid()
          AND (
            caller.role IN ('admin_global','manager_cgris')
            OR (
              caller.role = 'manager_team'
              AND caller.team_id IS NOT NULL
              AND caller.team_id = target.team_id
            )
          )
      )
    )
  );

-- 5) RLS - servidor_relacao_critica (SELECT). Escrita via RPC.
ALTER TABLE public.servidor_relacao_critica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS srel_critica_select ON public.servidor_relacao_critica;
CREATE POLICY srel_critica_select ON public.servidor_relacao_critica
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles caller
      LEFT JOIN public.profiles s ON s.id = servidor_relacao_critica.servidor_id
      LEFT JOIN public.profiles r ON r.id = servidor_relacao_critica.relacionado_id
      WHERE caller.id = auth.uid()
        AND (
          caller.role IN ('admin_global','manager_cgris')
          OR (
            caller.role = 'manager_team'
            AND caller.team_id IS NOT NULL
            AND (caller.team_id = s.team_id OR caller.team_id = r.team_id)
          )
          OR caller.id = servidor_relacao_critica.servidor_id
          OR caller.id = servidor_relacao_critica.relacionado_id
        )
    )
  );

NOTIFY pgrst, 'reload schema';
