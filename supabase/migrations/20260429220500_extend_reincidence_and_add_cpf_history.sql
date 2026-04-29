-- PR 5: cruzamentos no momento do lancamento
-- 1. check_reincidence agora tambem retorna o status do ultimo registro
--    (last_status) e se houve conclusao previa (already_concluded). Util para
--    avisar que um processo concluido esta sendo reaberto.
-- 2. check_cpf_history: lista processos previos da equipe associados ao mesmo
--    CPF, para alertar batimento (especialmente em controle).

CREATE OR REPLACE FUNCTION public.check_reincidence(p_processo TEXT)
RETURNS TABLE (
  reincidence_type        TEXT,
  previous_count          INT,
  same_server_count       INT,
  different_server_count  INT,
  last_status             TEXT,
  already_concluded       BOOLEAN
) AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team UUID;
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = v_uid;

  RETURN QUERY
  WITH historico AS (
    SELECT r.user_id, r.status, r.created_at
    FROM public.registros r
    WHERE r.processo = p_processo
      AND r.team_id = v_team
  ),
  ultimo AS (
    SELECT status FROM historico ORDER BY created_at DESC LIMIT 1
  )
  SELECT
    CASE
      WHEN COUNT(*) FILTER (WHERE h.user_id = v_uid) > 0 THEN 'self'
      WHEN COUNT(*) > 0 THEN 'other'
      ELSE 'none'
    END,
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE h.user_id = v_uid)::INT,
    COUNT(*) FILTER (WHERE h.user_id != v_uid)::INT,
    (SELECT u.status FROM ultimo u),
    EXISTS (SELECT 1 FROM historico h2 WHERE h2.status = 'Concluido')
  FROM historico h;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.check_reincidence(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_reincidence(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_cpf_history(p_cpf TEXT)
RETURNS TABLE (
  total_registros   INT,
  processos_distintos INT,
  ultimo_processo   TEXT,
  ultimo_status     TEXT,
  ultima_data       DATE
) AS $$
DECLARE
  v_team UUID;
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = auth.uid();

  IF v_team IS NULL OR p_cpf IS NULL OR length(trim(p_cpf)) = 0 THEN
    RETURN QUERY SELECT 0, 0, NULL::TEXT, NULL::TEXT, NULL::DATE;
    RETURN;
  END IF;

  RETURN QUERY
  WITH historico AS (
    SELECT r.processo, r.status, r.data, r.created_at
    FROM public.registros r
    WHERE r.team_id = v_team
      AND r.cpf = p_cpf
  ),
  ultimo AS (
    SELECT processo, status, data
    FROM historico
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*)::INT FROM historico),
    (SELECT COUNT(DISTINCT h.processo)::INT FROM historico h),
    (SELECT u.processo FROM ultimo u),
    (SELECT u.status FROM ultimo u),
    (SELECT u.data FROM ultimo u);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.check_cpf_history(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_cpf_history(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
