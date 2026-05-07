-- Adiciona qtd_atos no get_team_report (3a natureza: 'atos')
DROP FUNCTION IF EXISTS public.get_team_report(TEXT, TEXT);

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
  qtd_atos INT,
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
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'atos')::INT,
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
