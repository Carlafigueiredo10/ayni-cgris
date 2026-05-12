-- Auto-preenchimento de assunto judicial ao cadastrar registro com processo
-- ja conhecido pela equipe. Retorna tipo_processo, assunto_judicial e
-- assunto_judicial_outros do registro judicial mais recente da equipe para
-- o mesmo numero de processo.

CREATE OR REPLACE FUNCTION public.get_processo_last_judicial(p_processo TEXT)
RETURNS TABLE (
  tipo_processo            TEXT,
  assunto_judicial         TEXT,
  assunto_judicial_outros  TEXT
) AS $$
DECLARE
  v_team UUID;
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = auth.uid();

  IF v_team IS NULL OR p_processo IS NULL OR length(trim(p_processo)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.tipo_processo,
    r.assunto_judicial,
    r.assunto_judicial_outros
  FROM public.registros r
  WHERE r.team_id = v_team
    AND r.processo = p_processo
    AND r.tipo_natureza = 'judicial'
    AND r.assunto_judicial IS NOT NULL
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_processo_last_judicial(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_processo_last_judicial(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
