-- ABORDAGEM SIMPLES: profiles SELECT = apenas proprio perfil
-- Admin/Manager acessam outros perfis via RPCs SECURITY DEFINER
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (id = (select auth.uid()));

-- UPDATE policy tambem simplificada
DROP POLICY IF EXISTS "profiles_update_own_name" ON public.profiles;
CREATE POLICY "profiles_update_own_name" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- RPC para admin/manager listar perfis (substitui SELECT direto)
CREATE OR REPLACE FUNCTION public.list_profiles(p_team_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  team_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_role TEXT;
  v_team UUID;
BEGIN
  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = auth.uid();

  IF v_role = 'admin_global' THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.created_at
    FROM public.profiles p
    WHERE (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.created_at;
  ELSIF v_role = 'manager_team' THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.created_at
    FROM public.profiles p
    WHERE p.team_id = v_team OR p.team_id IS NULL
    ORDER BY p.created_at;
  ELSE
    -- member: retorna apenas proprio perfil
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.created_at
    FROM public.profiles p WHERE p.id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.list_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_profiles(UUID) TO authenticated;

-- Forcar reload do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
