-- ============================================================
-- get_cgris_overview: agregado total CGRIS (todos os times somados)
-- Visivel a qualquer authenticated. Sem dados pessoais.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_cgris_overview(TEXT);

CREATE OR REPLACE FUNCTION public.get_cgris_overview(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  mes DATE,
  total_servidores_no_mes INT,
  total_servidores_cadastrados INT,
  total_processos INT,
  total_concluidos INT,
  total_minutos INT,
  qtd_judicial INT,
  qtd_controle INT,
  qtd_atos INT,
  qtd_reincidencias INT,
  taxa_reincidencia_pct NUMERIC,
  cocon_processos INT,
  codej_processos INT,
  natos_processos INT
) AS $$
DECLARE
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
BEGIN
  RETURN QUERY
  WITH agg AS (
    SELECT
      r.id, r.user_id, r.team_id, r.minutos, r.tipo_natureza, r.status,
      r.reincidencia_tipo, t.code AS team_code
    FROM public.registros r
    LEFT JOIN public.teams t ON t.id = r.team_id
    WHERE date_trunc('month', r.data) = v_month
  )
  SELECT
    v_month,
    (SELECT COUNT(DISTINCT user_id)::INT FROM agg),
    (SELECT COUNT(*)::INT FROM public.profiles WHERE is_active),
    (SELECT COUNT(*)::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE status = 'Concluído')::INT FROM agg),
    (SELECT COALESCE(SUM(minutos), 0)::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE tipo_natureza = 'judicial')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE tipo_natureza = 'controle')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE tipo_natureza = 'atos')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE reincidencia_tipo != 'none')::INT FROM agg),
    (SELECT
       ROUND(
         COUNT(*) FILTER (WHERE reincidencia_tipo != 'none')::NUMERIC
         / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
       )
     FROM agg),
    (SELECT COUNT(*) FILTER (WHERE team_code = 'cocon')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE team_code = 'codej')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE team_code = 'natos')::INT FROM agg);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_cgris_overview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cgris_overview(TEXT) TO authenticated;

-- Histórico mensal: últimos N meses agregados (pra evolução temporal)
DROP FUNCTION IF EXISTS public.get_cgris_monthly_history(INT);

CREATE OR REPLACE FUNCTION public.get_cgris_monthly_history(p_months INT DEFAULT 6)
RETURNS TABLE (
  mes DATE,
  total_processos INT,
  total_concluidos INT,
  qtd_reincidencias INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('month', r.data)::DATE AS mes,
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE r.status = 'Concluído')::INT,
    COUNT(*) FILTER (WHERE r.reincidencia_tipo != 'none')::INT
  FROM public.registros r
  WHERE r.data >= date_trunc('month', now() - (p_months - 1) * interval '1 month')
  GROUP BY date_trunc('month', r.data)
  ORDER BY date_trunc('month', r.data);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_cgris_monthly_history(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cgris_monthly_history(INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
