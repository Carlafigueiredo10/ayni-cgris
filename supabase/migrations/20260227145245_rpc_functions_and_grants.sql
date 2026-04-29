-- ============================================================
-- RPCs para atribuição (SECURITY DEFINER — sem UPDATE direto)
-- ============================================================

-- assign_team: admin_global ou manager_team (só pro próprio time)
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

  IF v_caller_role = 'admin_global' THEN
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

-- promote_role: APENAS admin_global
CREATE OR REPLACE FUNCTION public.promote_role(
  p_user_id UUID,
  p_new_role TEXT
) RETURNS INT AS $$
DECLARE
  v_caller_role TEXT;
  v_rows INT;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role != 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode alterar papéis';
  END IF;

  IF p_new_role NOT IN ('admin_global', 'manager_team', 'member') THEN
    RAISE EXCEPTION 'Papel inválido: %', p_new_role;
  END IF;

  UPDATE public.profiles SET role = p_new_role WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- RPC: check_reincidence
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_reincidence(p_processo TEXT)
RETURNS TABLE (
  reincidence_type TEXT,
  previous_count INT,
  same_server_count INT,
  different_server_count INT
) AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team UUID;
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = v_uid;

  RETURN QUERY
  SELECT
    CASE
      WHEN COUNT(*) FILTER (WHERE r.user_id = v_uid) > 0 THEN 'self'
      WHEN COUNT(*) > 0 THEN 'other'
      ELSE 'none'
    END,
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE r.user_id = v_uid)::INT,
    COUNT(*) FILTER (WHERE r.user_id != v_uid)::INT
  FROM public.registros r
  WHERE r.processo = p_processo
    AND r.team_id = v_team;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- RPC: get_team_summary (member vê agregado do time, sem nomes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_team_summary(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  mes DATE,
  total_processos INT,
  media_minutos NUMERIC,
  qtd_judicial INT,
  qtd_controle INT,
  qtd_concluidos INT,
  total_minutos INT
) AS $$
DECLARE
  v_team UUID;
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = auth.uid();

  IF v_team IS NULL THEN
    RAISE EXCEPTION 'Usuário sem equipe atribuída';
  END IF;

  RETURN QUERY
  SELECT
    date_trunc('month', r.data)::DATE,
    COUNT(*)::INT,
    CASE WHEN COUNT(DISTINCT r.user_id) >= 3
         THEN ROUND(AVG(r.minutos), 1) ELSE NULL END,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'judicial')::INT,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'controle')::INT,
    COUNT(*) FILTER (WHERE r.status = 'Concluído')::INT,
    SUM(r.minutos)::INT
  FROM public.registros r
  WHERE r.team_id = v_team
    AND date_trunc('month', r.data) = v_month
  GROUP BY date_trunc('month', r.data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- RPC: get_team_report (manager/admin — agregados sem nomes)
-- ============================================================
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

  IF v_role NOT IN ('admin_global', 'manager_team') THEN
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
      (v_role = 'admin_global' AND (p_team_code IS NULL OR t.code = p_team_code))
      OR
      (v_role = 'manager_team' AND r.team_id = v_team)
    )
  GROUP BY r.team_id, t.code, t.name, date_trunc('month', r.data)
  ORDER BY date_trunc('month', r.data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- GRANT/REVOKE: bloquear anon, permitir apenas authenticated
-- ============================================================
REVOKE ALL ON FUNCTION public.assign_team(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_team(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.promote_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_role(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.check_reincidence(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_reincidence(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_team_summary(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_summary(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_team_report(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_report(TEXT, TEXT) TO authenticated;
