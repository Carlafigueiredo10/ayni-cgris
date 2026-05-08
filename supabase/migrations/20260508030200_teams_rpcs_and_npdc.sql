-- ============================================================
-- RPCs de gestao de equipes e sub-equipes + NPDC + view ajustada
-- ============================================================
--
-- Objetivos:
--   1) teams.active (soft-delete; NUNCA hard-delete pra preservar
--      relatorios historicos e referencias).
--   2) RPCs de admin para criar/renomear/inativar equipe principal
--      (so admin_global).
--   3) RPCs de gestor para criar/renomear/inativar sub-equipe da
--      propria equipe (manager_team escopo proprio; manager_cgris
--      todas; admin_global todas).
--   4) RPC para atribuir/desatribuir sub-equipe a um servidor.
--   5) RPC para listar equipes (incluindo sub-equipes), substitui
--      consultas diretas e a lista hardcoded TEAM_OPTIONS no front.
--   6) Insert da NPDC.
--   7) equipe_view exposta com subteam.

-- ------------------------------------------------------------
-- 1) teams.active (soft-delete)
-- ------------------------------------------------------------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_teams_active ON public.teams(active);

-- ------------------------------------------------------------
-- 2) Helper: caller pode gerir equipe X?
--    - admin_global / manager_cgris: sempre
--    - manager_team: somente se a equipe X = sua propria equipe,
--      ou se X for sub-equipe cuja parent_id = sua equipe.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._teams_pode_gerir(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  WITH caller AS (
    SELECT p.role, p.team_id FROM public.profiles p WHERE p.id = auth.uid()
  ),
  alvo AS (
    SELECT t.id, t.parent_id FROM public.teams t WHERE t.id = p_team_id
  )
  SELECT EXISTS (
    SELECT 1 FROM caller c, alvo a
    WHERE
      c.role IN ('admin_global','manager_cgris')
      OR (
        c.role = 'manager_team'
        AND c.team_id IS NOT NULL
        AND (
          c.team_id = a.id
          OR c.team_id = a.parent_id
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION public._teams_pode_gerir(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._teams_pode_gerir(UUID) TO authenticated;

-- ------------------------------------------------------------
-- 3) admin_criar_equipe: cria equipe principal (parent_id NULL).
--    Apenas admin_global. Code normalizado e unico.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_criar_equipe(
  p_code TEXT,
  p_name TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_code TEXT;
  v_id   UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role <> 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode criar equipes';
  END IF;

  v_code := lower(trim(p_code));
  IF v_code IS NULL OR length(v_code) = 0 THEN
    RAISE EXCEPTION 'Codigo da equipe e obrigatorio';
  END IF;
  IF length(v_code) > 16 THEN
    RAISE EXCEPTION 'Codigo deve ter no maximo 16 caracteres';
  END IF;
  IF v_code !~ '^[a-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Codigo deve conter apenas letras minusculas, numeros, _ ou -';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Nome da equipe e obrigatorio';
  END IF;
  IF length(trim(p_name)) > 120 THEN
    RAISE EXCEPTION 'Nome deve ter no maximo 120 caracteres';
  END IF;
  IF EXISTS (SELECT 1 FROM public.teams WHERE code = v_code) THEN
    RAISE EXCEPTION 'Ja existe uma equipe com o codigo "%"', v_code;
  END IF;

  INSERT INTO public.teams (code, name, parent_id, active)
  VALUES (v_code, trim(p_name), NULL, TRUE)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_criar_equipe(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_criar_equipe(TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- 4) admin_renomear_equipe / admin_set_equipe_active
--    Apenas admin_global. Code NAO pode ser alterado (preserva
--    referencias historicas).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_renomear_equipe(
  p_team_id UUID,
  p_name    TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role <> 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode renomear equipes';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Nome e obrigatorio';
  END IF;

  UPDATE public.teams SET name = trim(p_name) WHERE id = p_team_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_renomear_equipe(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_renomear_equipe(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_equipe_active(
  p_team_id UUID,
  p_active  BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_parent UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role <> 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode inativar equipe principal';
  END IF;

  SELECT parent_id INTO v_parent FROM public.teams WHERE id = p_team_id;
  IF v_parent IS NOT NULL THEN
    RAISE EXCEPTION 'Use criar_subequipe / inativar_subequipe para sub-equipes';
  END IF;

  UPDATE public.teams SET active = p_active WHERE id = p_team_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_equipe_active(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_equipe_active(UUID, BOOLEAN) TO authenticated;

-- ------------------------------------------------------------
-- 5) criar_subequipe / renomear_subequipe / inativar_subequipe
--    Permissao via _teams_pode_gerir(parent_team).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.criar_subequipe(
  p_parent_team_id UUID,
  p_name           TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent_code TEXT;
  v_subcode     TEXT;
  v_id          UUID;
  v_n           INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  IF NOT public._teams_pode_gerir(p_parent_team_id) THEN
    RAISE EXCEPTION 'Sem permissao para criar sub-equipe nesta equipe';
  END IF;

  SELECT code, parent_id INTO v_parent_code, v_id
  FROM public.teams WHERE id = p_parent_team_id;
  IF v_parent_code IS NULL THEN
    RAISE EXCEPTION 'Equipe pai nao encontrada';
  END IF;
  IF v_id IS NOT NULL THEN
    RAISE EXCEPTION 'Sub-equipe nao pode ter sub-equipe';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Nome da sub-equipe e obrigatorio';
  END IF;
  IF length(trim(p_name)) > 120 THEN
    RAISE EXCEPTION 'Nome deve ter no maximo 120 caracteres';
  END IF;

  -- Code automatico: parentcode-Nseq (ex: codej-1, codej-2). Garantia de unicidade.
  SELECT COUNT(*)::INT + 1 INTO v_n
  FROM public.teams WHERE parent_id = p_parent_team_id;
  v_subcode := v_parent_code || '-' || v_n::text;
  WHILE EXISTS (SELECT 1 FROM public.teams WHERE code = v_subcode) LOOP
    v_n := v_n + 1;
    v_subcode := v_parent_code || '-' || v_n::text;
  END LOOP;

  INSERT INTO public.teams (code, name, parent_id, active)
  VALUES (v_subcode, trim(p_name), p_parent_team_id, TRUE)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.criar_subequipe(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_subequipe(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.renomear_subequipe(
  p_subteam_id UUID,
  p_name       TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  SELECT parent_id INTO v_parent FROM public.teams WHERE id = p_subteam_id;
  IF v_parent IS NULL THEN
    RAISE EXCEPTION 'Sub-equipe nao encontrada (ou nao e sub-equipe)';
  END IF;
  IF NOT public._teams_pode_gerir(v_parent) THEN
    RAISE EXCEPTION 'Sem permissao para renomear esta sub-equipe';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Nome e obrigatorio';
  END IF;

  UPDATE public.teams SET name = trim(p_name) WHERE id = p_subteam_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.renomear_subequipe(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.renomear_subequipe(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.inativar_subequipe(
  p_subteam_id UUID,
  p_active     BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  SELECT parent_id INTO v_parent FROM public.teams WHERE id = p_subteam_id;
  IF v_parent IS NULL THEN
    RAISE EXCEPTION 'Sub-equipe nao encontrada';
  END IF;
  IF NOT public._teams_pode_gerir(v_parent) THEN
    RAISE EXCEPTION 'Sem permissao';
  END IF;

  -- Ao inativar uma sub-equipe, desvincula servidores e nao deleta o registro
  IF p_active = FALSE THEN
    UPDATE public.profiles SET subteam_id = NULL WHERE subteam_id = p_subteam_id;
    UPDATE public.servidores SET subteam_id = NULL WHERE subteam_id = p_subteam_id;
  END IF;

  UPDATE public.teams SET active = p_active WHERE id = p_subteam_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.inativar_subequipe(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inativar_subequipe(UUID, BOOLEAN) TO authenticated;

-- ------------------------------------------------------------
-- 6) atribuir_subteam: define ou remove sub-equipe de um servidor.
--    Atualiza profiles E servidores (espelho do roster).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.atribuir_subteam(
  p_user_id     UUID,
  p_subteam_id  UUID    -- NULL = remove
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_team UUID;
  v_parent      UUID;
  v_email       TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT team_id, email INTO v_target_team, v_email
  FROM public.profiles WHERE id = p_user_id;
  IF v_target_team IS NULL THEN
    RAISE EXCEPTION 'Servidor sem equipe principal definida';
  END IF;

  IF p_subteam_id IS NOT NULL THEN
    SELECT parent_id INTO v_parent FROM public.teams WHERE id = p_subteam_id;
    IF v_parent IS NULL THEN
      RAISE EXCEPTION 'subteam_id nao e uma sub-equipe valida';
    END IF;
    IF v_parent <> v_target_team THEN
      RAISE EXCEPTION 'Sub-equipe pertence a outra equipe principal';
    END IF;
  END IF;

  IF NOT public._teams_pode_gerir(v_target_team) THEN
    RAISE EXCEPTION 'Sem permissao para alterar sub-equipe deste servidor';
  END IF;

  UPDATE public.profiles SET subteam_id = p_subteam_id WHERE id = p_user_id;

  -- Espelha em servidores (roster). Casa por email normalizado.
  IF v_email IS NOT NULL THEN
    UPDATE public.servidores
    SET subteam_id = p_subteam_id
    WHERE lower(trim(email)) = lower(trim(v_email));
  END IF;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.atribuir_subteam(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atribuir_subteam(UUID, UUID) TO authenticated;

-- ------------------------------------------------------------
-- 7) list_teams: lista equipes principais + suas sub-equipes.
--    Inclui inativas (UI decide o que mostrar).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_teams()
RETURNS TABLE (
  id        UUID,
  code      TEXT,
  name      TEXT,
  parent_id UUID,
  active    BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT t.id, t.code, t.name, t.parent_id, t.active
  FROM public.teams t
  ORDER BY (t.parent_id IS NOT NULL), t.code;
$$;
REVOKE ALL ON FUNCTION public.list_teams() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_teams() TO authenticated;

-- ------------------------------------------------------------
-- 8) Atualiza equipe_view com subteam_id/code/name (para badge UI).
--    Mantem o JOIN composto por siape OU email + COALESCE(regime).
-- ------------------------------------------------------------
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
  s.subteam_id,
  st.code                       AS subteam_code,
  st.name                       AS subteam_name,
  COALESCE(p.regime, s.regime)  AS regime,
  s.ativo,
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
LEFT JOIN public.teams t  ON t.id = s.team_id
LEFT JOIN public.teams st ON st.id = s.subteam_id;

REVOKE ALL ON public.equipe_view FROM PUBLIC;
GRANT SELECT ON public.equipe_view TO authenticated;

-- ------------------------------------------------------------
-- 9) Insert NPDC (vinculada a CGRIS = sem parent, equipe principal).
-- ------------------------------------------------------------
INSERT INTO public.teams (code, name, parent_id, active)
VALUES ('npdc', 'NPDC — Núcleo de Produtividade, Dados e Comunicação', NULL, TRUE)
ON CONFLICT (code) DO NOTHING;

NOTIFY pgrst, 'reload schema';
