-- Bugfix: get_team_summary filtrava por 'Concluído' (com acento) mas o app
-- salva o status como 'Concluido' (sem acento). Resultado: qtd_concluidos
-- ficava sempre zerado.

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
    RAISE EXCEPTION 'Usuario sem equipe atribuida';
  END IF;

  RETURN QUERY
  SELECT
    date_trunc('month', r.data)::DATE,
    COUNT(*)::INT,
    CASE WHEN COUNT(DISTINCT r.user_id) >= 3
         THEN ROUND(AVG(r.minutos), 1) ELSE NULL END,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'judicial')::INT,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'controle')::INT,
    COUNT(*) FILTER (WHERE r.status = 'Concluido')::INT,
    SUM(r.minutos)::INT
  FROM public.registros r
  WHERE r.team_id = v_team
    AND date_trunc('month', r.data) = v_month
  GROUP BY date_trunc('month', r.data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

NOTIFY pgrst, 'reload schema';
