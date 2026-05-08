-- ============================================================
-- Auditoria leve em servidores + RBAC granular em upsert_servidor
-- ============================================================
--
-- - servidores ganha updated_at (auto via trigger) e updated_by
-- - upsert_servidor agora aceita admin_global, manager_cgris e
--   manager_team. manager_team SO opera na propria equipe e nao
--   pode mover servidor entre equipes.
-- - equipe_view recriada para expor updated_at/updated_by

-- 1) Auditoria
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_servidores_touch ON public.servidores;
CREATE TRIGGER trg_servidores_touch
  BEFORE UPDATE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) RBAC granular
DROP FUNCTION IF EXISTS public.upsert_servidor(uuid, text, text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.upsert_servidor(
  p_id UUID,
  p_nome TEXT,
  p_siape TEXT,
  p_email TEXT,
  p_team_code TEXT,
  p_regime TEXT,
  p_ativo BOOLEAN
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id   UUID := auth.uid();
  v_caller_role TEXT;
  v_caller_team UUID;
  v_target_team UUID;
  v_existing_team UUID;
  v_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT role, team_id INTO v_caller_role, v_caller_team
  FROM public.profiles WHERE id = v_caller_id;

  IF v_caller_role NOT IN ('admin_global','manager_cgris','manager_team') THEN
    RAISE EXCEPTION 'Sem permissao para editar servidores';
  END IF;

  IF p_nome IS NULL OR length(trim(p_nome)) = 0 THEN
    RAISE EXCEPTION 'Nome e obrigatorio';
  END IF;

  IF p_team_code IS NOT NULL AND p_team_code != '' THEN
    SELECT id INTO v_target_team FROM public.teams WHERE code = p_team_code;
    IF v_target_team IS NULL THEN
      RAISE EXCEPTION 'Equipe nao encontrada: %', p_team_code;
    END IF;
  END IF;

  IF p_regime IS NOT NULL AND p_regime NOT IN ('presencial','remoto','hibrido') THEN
    RAISE EXCEPTION 'regime invalido: %', p_regime;
  END IF;

  IF v_caller_role = 'manager_team' THEN
    IF v_caller_team IS NULL THEN
      RAISE EXCEPTION 'Gestor sem equipe atribuida';
    END IF;
    IF v_target_team IS NOT NULL AND v_target_team != v_caller_team THEN
      RAISE EXCEPTION 'Gestor de equipe so pode operar na propria equipe';
    END IF;
    IF p_id IS NOT NULL THEN
      SELECT team_id INTO v_existing_team FROM public.servidores WHERE id = p_id;
      IF v_existing_team IS NULL THEN
        RAISE EXCEPTION 'Servidor nao encontrado: %', p_id;
      END IF;
      IF v_existing_team != v_caller_team THEN
        RAISE EXCEPTION 'Servidor pertence a outra equipe';
      END IF;
    END IF;
    IF p_id IS NULL THEN
      v_target_team := v_caller_team;
    END IF;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.servidores (nome, siape, email, team_id, regime, ativo, updated_by)
    VALUES (
      trim(p_nome),
      NULLIF(trim(p_siape), ''),
      NULLIF(trim(p_email), ''),
      v_target_team,
      p_regime,
      COALESCE(p_ativo, TRUE),
      v_caller_id
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.servidores
    SET nome       = trim(p_nome),
        siape      = NULLIF(trim(p_siape), ''),
        email      = NULLIF(trim(p_email), ''),
        team_id    = v_target_team,
        regime     = p_regime,
        ativo      = COALESCE(p_ativo, TRUE),
        updated_by = v_caller_id
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Servidor nao encontrado: %', p_id;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_servidor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_servidor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- 3) Recriar view com updated_at/updated_by
DROP VIEW IF EXISTS public.equipe_view;

CREATE VIEW public.equipe_view
WITH (security_invoker = off) AS
SELECT
  s.id                          AS servidor_id,
  s.nome,
  s.email,
  COALESCE(p.siape, s.siape)    AS siape,
  s.team_id,
  t.code                        AS team_code,
  t.name                        AS team_name,
  COALESCE(p.regime, s.regime)  AS regime,
  s.ativo,
  s.updated_at,
  s.updated_by,
  p.id                          AS profile_id,
  (p.id IS NOT NULL)            AS usuario_ativo
FROM public.servidores s
LEFT JOIN public.profiles p ON (
  (p.siape IS NOT NULL AND s.siape IS NOT NULL AND p.siape = s.siape)
  OR
  (
    (p.siape IS NULL OR s.siape IS NULL)
    AND lower(trim(p.email)) = lower(trim(s.email))
  )
)
LEFT JOIN public.teams t ON t.id = s.team_id;

REVOKE ALL ON public.equipe_view FROM PUBLIC;
GRANT SELECT ON public.equipe_view TO authenticated;

NOTIFY pgrst, 'reload schema';
