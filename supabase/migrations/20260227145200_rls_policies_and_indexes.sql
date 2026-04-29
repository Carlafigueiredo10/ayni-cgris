-- Drop políticas permissivas existentes
DROP POLICY IF EXISTS "Permitir ler registros" ON public.registros;
DROP POLICY IF EXISTS "Permitir inserir registros" ON public.registros;

-- HABILITAR RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- === profiles ===
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_manager_team" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_name" ON public.profiles;
DROP POLICY IF EXISTS "teams_select_auth" ON public.teams;
DROP POLICY IF EXISTS "registros_select_own" ON public.registros;
DROP POLICY IF EXISTS "registros_insert_own" ON public.registros;
DROP POLICY IF EXISTS "registros_update_own" ON public.registros;
DROP POLICY IF EXISTS "registros_delete_own" ON public.registros;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_global')
  );

CREATE POLICY "profiles_select_manager_team" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'manager_team'
        AND p.team_id = profiles.team_id
    )
  );

CREATE POLICY "profiles_update_own_name" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  );

-- === teams ===
CREATE POLICY "teams_select_auth" ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- === registros ===
CREATE POLICY "registros_select_own" ON public.registros
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "registros_insert_own" ON public.registros
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND team_id IS NOT NULL)
  );

CREATE POLICY "registros_update_own" ON public.registros
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "registros_delete_own" ON public.registros
  FOR DELETE USING (user_id = auth.uid());

-- === Índices ===
CREATE INDEX IF NOT EXISTS idx_registros_user_id    ON public.registros(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_team_id    ON public.registros(team_id);
CREATE INDEX IF NOT EXISTS idx_registros_data       ON public.registros(data);
CREATE INDEX IF NOT EXISTS idx_registros_processo   ON public.registros(processo);
CREATE INDEX IF NOT EXISTS idx_registros_team_data  ON public.registros(team_id, data);
CREATE INDEX IF NOT EXISTS idx_registros_user_data  ON public.registros(user_id, data);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id     ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
