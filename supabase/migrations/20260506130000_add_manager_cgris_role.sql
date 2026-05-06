-- ============================================================
-- Novo papel: manager_cgris (gestor inter-coordenacoes)
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_global', 'manager_cgris', 'manager_team', 'member'));

-- list_profiles: manager_cgris ve todos perfis (igual admin)
DROP FUNCTION IF EXISTS public.list_profiles(UUID);

CREATE OR REPLACE FUNCTION public.list_profiles(p_team_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  team_id UUID,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_role TEXT;
  v_team UUID;
BEGIN
  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = auth.uid();

  IF v_role IN ('admin_global', 'manager_cgris') THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active, p.created_at
    FROM public.profiles p
    WHERE (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.created_at;
  ELSIF v_role = 'manager_team' THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active, p.created_at
    FROM public.profiles p
    WHERE p.team_id = v_team OR p.team_id IS NULL
    ORDER BY p.created_at;
  ELSE
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active, p.created_at
    FROM public.profiles p WHERE p.id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.list_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_profiles(UUID) TO authenticated;

-- assign_team: manager_cgris pode atribuir qualquer equipe (igual admin)
CREATE OR REPLACE FUNCTION public.assign_team(
  p_user_id UUID,
  p_team_code TEXT
) RETURNS INT AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_team UUID;
  v_target_team UUID;
  v_rows INT;
BEGIN
  SELECT role, team_id INTO v_caller_role, v_caller_team
  FROM public.profiles WHERE id = auth.uid();

  SELECT id INTO v_target_team
  FROM public.teams WHERE code = p_team_code;

  IF v_target_team IS NULL THEN
    RAISE EXCEPTION 'Equipe não encontrada: %', p_team_code;
  END IF;

  IF v_caller_role IN ('admin_global', 'manager_cgris') THEN
    UPDATE public.profiles SET team_id = v_target_team WHERE id = p_user_id;
  ELSIF v_caller_role = 'manager_team' AND v_caller_team = v_target_team THEN
    UPDATE public.profiles
    SET team_id = v_target_team
    WHERE id = p_user_id AND team_id IS NULL;
  ELSE
    RAISE EXCEPTION 'Sem permissão para atribuir equipe';
  END IF;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.assign_team(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_team(UUID, TEXT) TO authenticated;

-- promote_role: aceita novo valor + valida team_id obrigatorio pra manager_team
CREATE OR REPLACE FUNCTION public.promote_role(
  p_user_id UUID,
  p_new_role TEXT
) RETURNS INT AS $$
DECLARE
  v_caller_role  TEXT;
  v_caller_id    UUID := auth.uid();
  v_target_role  TEXT;
  v_target_team  UUID;
  v_rows INT;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.profiles WHERE id = v_caller_id;

  IF v_caller_role != 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode alterar papéis';
  END IF;

  IF p_new_role NOT IN ('admin_global', 'manager_cgris', 'manager_team', 'member') THEN
    RAISE EXCEPTION 'Papel inválido: %', p_new_role;
  END IF;

  SELECT role, team_id INTO v_target_role, v_target_team
  FROM public.profiles WHERE id = p_user_id;

  IF v_target_role = 'admin_global' AND p_user_id <> v_caller_id THEN
    RAISE EXCEPTION 'Não é permitido alterar papel de outro admin_global';
  END IF;

  IF p_new_role = 'manager_team' AND v_target_team IS NULL THEN
    RAISE EXCEPTION 'manager_team requer equipe atribuída — defina a equipe antes de promover';
  END IF;

  UPDATE public.profiles SET role = p_new_role WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.promote_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_role(UUID, TEXT) TO authenticated;

-- get_team_report: manager_cgris ve todas equipes (igual admin)
CREATE OR REPLACE FUNCTION public.get_team_report(
  p_team_code TEXT DEFAULT NULL,
  p_month TEXT DEFAULT NULL
)
RETURNS TABLE (
  team_id UUID,
  team_code TEXT,
  team_name TEXT,
  mes DATE,
  total_processos INT,
  servidores_ativos INT,
  media_minutos_processo NUMERIC,
  total_minutos INT,
  media_minutos_judicial NUMERIC,
  media_minutos_controle NUMERIC,
  qtd_judicial INT,
  qtd_controle INT,
  qtd_reincidencias INT,
  taxa_reincidencia_pct NUMERIC
) AS $$
DECLARE
  v_role TEXT;
  v_team UUID;
  v_month DATE := CASE WHEN p_month IS NOT NULL THEN p_month::DATE ELSE NULL END;
BEGIN
  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = auth.uid();

  IF v_role NOT IN ('admin_global', 'manager_cgris', 'manager_team') THEN
    RAISE EXCEPTION 'Acesso restrito à coordenação';
  END IF;

  RETURN QUERY
  SELECT
    r.team_id,
    t.code,
    t.name,
    date_trunc('month', r.data)::DATE,
    COUNT(*)::INT,
    COUNT(DISTINCT r.user_id)::INT,
    CASE WHEN COUNT(DISTINCT r.user_id) >= 3
         THEN ROUND(AVG(r.minutos), 1) ELSE NULL END,
    SUM(r.minutos)::INT,
    CASE WHEN COUNT(DISTINCT r.user_id) >= 3
         THEN ROUND(AVG(r.minutos) FILTER (WHERE r.tipo_natureza = 'judicial'), 1) ELSE NULL END,
    CASE WHEN COUNT(DISTINCT r.user_id) >= 3
         THEN ROUND(AVG(r.minutos) FILTER (WHERE r.tipo_natureza = 'controle'), 1) ELSE NULL END,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'judicial')::INT,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'controle')::INT,
    COUNT(*) FILTER (WHERE r.reincidencia_tipo != 'none')::INT,
    ROUND(
      COUNT(*) FILTER (WHERE r.reincidencia_tipo != 'none')::NUMERIC
      / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
    )
  FROM public.registros r
  JOIN public.teams t ON t.id = r.team_id
  WHERE r.data IS NOT NULL
    AND (v_month IS NULL OR date_trunc('month', r.data) = v_month)
    AND (
      (v_role IN ('admin_global', 'manager_cgris') AND (p_team_code IS NULL OR t.code = p_team_code))
      OR
      (v_role = 'manager_team' AND r.team_id = v_team)
    )
  GROUP BY r.team_id, t.code, t.name, date_trunc('month', r.data)
  ORDER BY date_trunc('month', r.data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_team_report(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_report(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
