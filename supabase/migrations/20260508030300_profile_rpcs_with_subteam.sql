-- ============================================================
-- get_my_profile e list_profiles agora expoem subteam_id
-- ============================================================

DROP FUNCTION IF EXISTS public.get_my_profile();

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID, display_name TEXT, email TEXT, team_id UUID, subteam_id UUID,
  role TEXT, is_active BOOLEAN, siape TEXT, regime TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT p.id, p.display_name, p.email, p.team_id, p.subteam_id,
         p.role, p.is_active, p.siape, p.regime
  FROM public.profiles p WHERE p.id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

DROP FUNCTION IF EXISTS public.list_profiles(UUID);

CREATE OR REPLACE FUNCTION public.list_profiles(p_team_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID, display_name TEXT, email TEXT, team_id UUID, subteam_id UUID,
  role TEXT, is_active BOOLEAN, created_at TIMESTAMPTZ, siape TEXT, regime TEXT
) AS $$
DECLARE v_role TEXT; v_team UUID;
BEGIN
  SELECT p.role, p.team_id INTO v_role, v_team FROM public.profiles p WHERE p.id = auth.uid();
  IF v_role IN ('admin_global', 'manager_cgris') THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.subteam_id, p.role,
           p.is_active, p.created_at, p.siape, p.regime
    FROM public.profiles p
    WHERE (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.created_at;
  ELSIF v_role = 'manager_team' THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.subteam_id, p.role,
           p.is_active, p.created_at, p.siape, p.regime
    FROM public.profiles p
    WHERE p.team_id = v_team OR p.team_id IS NULL
    ORDER BY p.created_at;
  ELSE
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.subteam_id, p.role,
           p.is_active, p.created_at, p.siape, p.regime
    FROM public.profiles p WHERE p.id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.list_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_profiles(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
