-- ============================================================
-- FIX 1: search_path na função pré-existente
-- ============================================================
ALTER FUNCTION public.check_allowed_email_domain() SET search_path = public, pg_temp;

-- ============================================================
-- FIX 2: Consolidar 3 policies SELECT em profiles → 1 policy
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_manager_team" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin_global'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND p.role = 'manager_team'
        AND p.team_id = profiles.team_id
    )
  );

-- ============================================================
-- FIX 3: Recriar policies com (select auth.uid()) em vez de auth.uid()
-- ============================================================

-- profiles UPDATE
DROP POLICY IF EXISTS "profiles_update_own_name" ON public.profiles;
CREATE POLICY "profiles_update_own_name" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (
    id = (select auth.uid())
    AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    AND team_id IS NOT DISTINCT FROM (SELECT team_id FROM public.profiles WHERE id = (select auth.uid()))
  );

-- teams SELECT
DROP POLICY IF EXISTS "teams_select_auth" ON public.teams;
CREATE POLICY "teams_select_auth" ON public.teams
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- registros SELECT
DROP POLICY IF EXISTS "registros_select_own" ON public.registros;
CREATE POLICY "registros_select_own" ON public.registros
  FOR SELECT USING (user_id = (select auth.uid()));

-- registros INSERT
DROP POLICY IF EXISTS "registros_insert_own" ON public.registros;
CREATE POLICY "registros_insert_own" ON public.registros
  FOR INSERT WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND team_id IS NOT NULL)
  );

-- registros UPDATE
DROP POLICY IF EXISTS "registros_update_own" ON public.registros;
CREATE POLICY "registros_update_own" ON public.registros
  FOR UPDATE USING (user_id = (select auth.uid()));

-- registros DELETE
DROP POLICY IF EXISTS "registros_delete_own" ON public.registros;
CREATE POLICY "registros_delete_own" ON public.registros
  FOR DELETE USING (user_id = (select auth.uid()));
