-- RPC que retorna o perfil do usuario logado
-- SECURITY DEFINER = bypassa RLS, nunca vai dar recursao/403/500
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  team_id UUID,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.display_name, p.email, p.team_id, p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Forcar reload do PostgREST
NOTIFY pgrst, 'reload schema';
