-- ============================================================
-- get_servidores_ranking: ranking detalhado por servidor
-- Restrito a admin_global, manager_cgris, manager_team (própria equipe)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_servidores_ranking(TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION public.get_servidores_ranking(
  p_month TEXT DEFAULT NULL,
  p_team_code TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  siape TEXT,
  team_code TEXT,
  total_processos INT,
  total_concluidos INT,
  total_minutos INT,
  qtd_judicial INT,
  qtd_controle INT,
  qtd_atos INT,
  qtd_reincidencias INT
) AS $$
DECLARE
  v_role TEXT;
  v_team UUID;
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
BEGIN
  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = auth.uid();

  IF v_role NOT IN ('admin_global', 'manager_cgris', 'manager_team') THEN
    RAISE EXCEPTION 'Acesso restrito a gestores e admin';
  END IF;

  RETURN QUERY
  SELECT
    r.user_id,
    pr.display_name,
    pr.email,
    pr.siape,
    t.code,
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE r.status = 'Concluído')::INT,
    COALESCE(SUM(r.minutos), 0)::INT,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'judicial')::INT,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'controle')::INT,
    COUNT(*) FILTER (WHERE r.tipo_natureza = 'atos')::INT,
    COUNT(*) FILTER (WHERE r.reincidencia_tipo != 'none')::INT
  FROM public.registros r
  JOIN public.profiles pr ON pr.id = r.user_id
  LEFT JOIN public.teams t ON t.id = r.team_id
  WHERE date_trunc('month', r.data) = v_month
    AND (
      v_role IN ('admin_global', 'manager_cgris')
      OR (v_role = 'manager_team' AND r.team_id = v_team)
    )
    AND (
      p_team_code IS NULL
      OR t.code = p_team_code
      OR (v_role = 'manager_team') -- ignore p_team_code se for manager_team (sempre sua equipe)
    )
  GROUP BY r.user_id, pr.display_name, pr.email, pr.siape, t.code
  ORDER BY COUNT(*) DESC, COUNT(*) FILTER (WHERE r.status = 'Concluído') DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_servidores_ranking(TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_servidores_ranking(TEXT, TEXT, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
