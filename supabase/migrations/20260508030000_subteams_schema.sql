-- ============================================================
-- Sub-equipes: agrupamento operacional dentro de uma equipe
-- ============================================================
--
-- DECISAO DE DESIGN (importante e nao mudar):
--   Sub-equipe e AGRUPAMENTO VISUAL/OPERACIONAL.
--   NAO e unidade institucional, contabil, gerencial ou de RLS.
--   - profiles.team_id continua apontando para a equipe principal.
--   - profiles.subteam_id (novo) e opcional.
--   - Relatorios, RLS, ranking, metas e dashboards seguem
--     agregando pela equipe principal. NUNCA por sub-equipe.
--   - Nao ha "gestor de sub-equipe". Quem gere sub-equipes da
--     equipe X e o gestor (manager_team) da equipe X — mesmo
--     escopo de permissao da equipe principal.
--
-- Constraints duros (no banco):
--   1) Sub-equipe NAO pode ter sub-equipe (max 1 nivel).
--   2) Limite de 10 sub-equipes por equipe principal.
--   3) profile.subteam_id, se preenchido, deve apontar para uma
--      sub-equipe cuja parent_id = profile.team_id.

-- ------------------------------------------------------------
-- 1) teams.parent_id (auto-FK)
-- ------------------------------------------------------------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.teams(id) ON DELETE RESTRICT;

ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_parent_not_self;
ALTER TABLE public.teams
  ADD CONSTRAINT teams_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id);

CREATE INDEX IF NOT EXISTS idx_teams_parent ON public.teams(parent_id);

-- ------------------------------------------------------------
-- 2) Trigger: bloqueia hierarquia profunda (sub-de-sub) + limite 10
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._teams_validar_subequipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent_parent UUID;
  v_count INT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1) parent nao pode ser ele mesmo uma sub-equipe
  SELECT parent_id INTO v_parent_parent
  FROM public.teams WHERE id = NEW.parent_id;
  IF v_parent_parent IS NOT NULL THEN
    RAISE EXCEPTION 'Sub-equipe nao pode ter sub-equipe (max 1 nivel)';
  END IF;

  -- 2) limite de 10 sub-equipes por equipe principal
  SELECT COUNT(*)::INT INTO v_count
  FROM public.teams
  WHERE parent_id = NEW.parent_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Limite de 10 sub-equipes por equipe atingido';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public._teams_validar_subequipe() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_teams_validar_subequipe ON public.teams;
CREATE TRIGGER trg_teams_validar_subequipe
  BEFORE INSERT OR UPDATE OF parent_id ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public._teams_validar_subequipe();

-- ------------------------------------------------------------
-- 3) profiles.subteam_id + constraint de coerencia
--    subteam_id (se preenchido) -> teams.parent_id = profile.team_id
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subteam_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subteam ON public.profiles(subteam_id)
  WHERE subteam_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public._profiles_validar_subteam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent UUID;
BEGIN
  IF NEW.subteam_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT parent_id INTO v_parent
  FROM public.teams WHERE id = NEW.subteam_id;

  IF v_parent IS NULL THEN
    RAISE EXCEPTION 'subteam_id deve apontar para uma sub-equipe (teams.parent_id NOT NULL)';
  END IF;

  IF NEW.team_id IS NULL OR NEW.team_id <> v_parent THEN
    RAISE EXCEPTION 'subteam_id deve pertencer a equipe principal do servidor (team_id)';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public._profiles_validar_subteam() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_profiles_validar_subteam ON public.profiles;
CREATE TRIGGER trg_profiles_validar_subteam
  BEFORE INSERT OR UPDATE OF team_id, subteam_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public._profiles_validar_subteam();

-- Ao trocar a equipe principal, zera subteam_id automaticamente
-- (impede inconsistencia e libera o usuario pra reescolher).
CREATE OR REPLACE FUNCTION public._profiles_clear_subteam_on_team_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    NEW.subteam_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public._profiles_clear_subteam_on_team_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_profiles_clear_subteam ON public.profiles;
CREATE TRIGGER trg_profiles_clear_subteam
  BEFORE UPDATE OF team_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public._profiles_clear_subteam_on_team_change();

-- ------------------------------------------------------------
-- 4) servidores.subteam_id (espelha o roster institucional)
--    Reusa as mesmas regras de coerencia em outro trigger.
-- ------------------------------------------------------------
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS subteam_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_servidores_subteam ON public.servidores(subteam_id)
  WHERE subteam_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public._servidores_validar_subteam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent UUID;
BEGIN
  IF NEW.subteam_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT parent_id INTO v_parent
  FROM public.teams WHERE id = NEW.subteam_id;

  IF v_parent IS NULL THEN
    RAISE EXCEPTION 'subteam_id deve apontar para uma sub-equipe';
  END IF;

  IF NEW.team_id IS NULL OR NEW.team_id <> v_parent THEN
    RAISE EXCEPTION 'subteam_id deve pertencer a equipe principal do servidor';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public._servidores_validar_subteam() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_servidores_validar_subteam ON public.servidores;
CREATE TRIGGER trg_servidores_validar_subteam
  BEFORE INSERT OR UPDATE OF team_id, subteam_id ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public._servidores_validar_subteam();

DROP TRIGGER IF EXISTS trg_servidores_clear_subteam ON public.servidores;
CREATE TRIGGER trg_servidores_clear_subteam
  BEFORE UPDATE OF team_id ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public._profiles_clear_subteam_on_team_change();

NOTIFY pgrst, 'reload schema';
