-- PR 4: KPIs da coordenacao
-- - entrada_processos: processos com primeira aparicao no mes, dentro do team
-- - saida_processos: registros com status = 'Concluido' no mes, dentro do team
-- - servidores_coordenacao: total de servidores ativos cadastrados no team
--                            (independente de terem registrado no mes)
-- - media_concluidos_servidor: saida / servidores

CREATE OR REPLACE FUNCTION public.get_coordination_kpis(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  mes DATE,
  entrada_processos INT,
  saida_processos INT,
  servidores_coordenacao INT,
  media_concluidos_servidor NUMERIC
) AS $$
DECLARE
  v_team UUID;
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
  v_next  DATE := (v_month + INTERVAL '1 month')::DATE;
  v_entrada INT;
  v_saida INT;
  v_servidores INT;
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = auth.uid();

  IF v_team IS NULL THEN
    RAISE EXCEPTION 'Usuario sem equipe atribuida';
  END IF;

  SELECT COUNT(*)::INT INTO v_entrada
  FROM (
    SELECT r.processo, MIN(r.data) AS primeira
    FROM public.registros r
    WHERE r.team_id = v_team
    GROUP BY r.processo
  ) p
  WHERE p.primeira >= v_month AND p.primeira < v_next;

  SELECT COUNT(*)::INT INTO v_saida
  FROM public.registros r
  WHERE r.team_id = v_team
    AND r.status = 'Concluido'
    AND r.data >= v_month AND r.data < v_next;

  SELECT COUNT(*)::INT INTO v_servidores
  FROM public.servidores s
  WHERE s.team_id = v_team AND s.ativo = TRUE;

  RETURN QUERY
  SELECT
    v_month,
    v_entrada,
    v_saida,
    v_servidores,
    CASE WHEN v_servidores > 0
         THEN ROUND(v_saida::NUMERIC / v_servidores, 1)
         ELSE NULL END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_coordination_kpis(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_coordination_kpis(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
