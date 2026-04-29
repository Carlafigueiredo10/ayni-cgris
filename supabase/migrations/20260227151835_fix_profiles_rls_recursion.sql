-- Funcoes helper SECURITY DEFINER (bypassam RLS para evitar recursao)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_team_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_team_id() TO authenticated;

-- Recriar policy SELECT de profiles sem recursao
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = (select auth.uid())
    OR (select public.get_my_role()) = 'admin_global'
    OR (
      (select public.get_my_role()) = 'manager_team'
      AND team_id = (select public.get_my_team_id())
    )
  );

-- Recriar policy UPDATE sem recursao
DROP POLICY IF EXISTS "profiles_update_own_name" ON public.profiles;
CREATE POLICY "profiles_update_own_name" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (
    id = (select auth.uid())
    AND role IS NOT DISTINCT FROM (select public.get_my_role())
    AND team_id IS NOT DISTINCT FROM (select public.get_my_team_id())
  );

-- Policy INSERT em registros tambem referencia profiles — usar helper
DROP POLICY IF EXISTS "registros_insert_own" ON public.registros;
CREATE POLICY "registros_insert_own" ON public.registros
  FOR INSERT WITH CHECK (
    user_id = (select auth.uid())
    AND (select public.get_my_team_id()) IS NOT NULL
  );
