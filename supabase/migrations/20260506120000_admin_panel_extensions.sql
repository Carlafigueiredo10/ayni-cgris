-- ============================================================
-- Painel administrativo: is_active, audit logs, guardas anti-lock
-- ============================================================

-- 1. is_active em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active
  ON public.profiles(is_active);

-- 2. Audit log de ações administrativas
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES public.profiles(id),
  target_user_id  UUID REFERENCES public.profiles(id),
  action          TEXT NOT NULL,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target_created
  ON public.admin_audit_logs(target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_created
  ON public.admin_audit_logs(admin_user_id, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admin_global pode ler. INSERT só via service_role (edge function).
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.admin_audit_logs
  FOR SELECT USING (
    (select public.get_my_role()) = 'admin_global'
  );

-- 3. list_profiles: incluir is_active no retorno
DROP FUNCTION IF EXISTS public.list_profiles(UUID);

CREATE OR REPLACE FUNCTION public.list_profiles(p_team_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  team_id UUID,
  role TEXT,
  is_active BOOLEAN,
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
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active, p.created_at
    FROM public.profiles p
    WHERE (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.created_at;
  ELSIF v_role = 'manager_team' THEN
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active, p.created_at
    FROM public.profiles p
    WHERE p.team_id = v_team OR p.team_id IS NULL
    ORDER BY p.created_at;
  ELSE
    RETURN QUERY
    SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active, p.created_at
    FROM public.profiles p WHERE p.id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.list_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_profiles(UUID) TO authenticated;

-- 4. get_my_profile: incluir is_active também (consistência com AuthContext)
DROP FUNCTION IF EXISTS public.get_my_profile();

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  team_id UUID,
  role TEXT,
  is_active BOOLEAN
) AS $$
  SELECT p.id, p.display_name, p.email, p.team_id, p.role, p.is_active
  FROM public.profiles p WHERE p.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 5. promote_role com guarda anti-auto-destruição admin
CREATE OR REPLACE FUNCTION public.promote_role(
  p_user_id UUID,
  p_new_role TEXT
) RETURNS INT AS $$
DECLARE
  v_caller_role  TEXT;
  v_caller_id    UUID := auth.uid();
  v_target_role  TEXT;
  v_rows INT;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.profiles WHERE id = v_caller_id;

  IF v_caller_role != 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode alterar papéis';
  END IF;

  IF p_new_role NOT IN ('admin_global', 'manager_team', 'member') THEN
    RAISE EXCEPTION 'Papel inválido: %', p_new_role;
  END IF;

  SELECT role INTO v_target_role
  FROM public.profiles WHERE id = p_user_id;

  -- Guarda: não pode rebaixar/alterar outro admin_global (apenas self-demote)
  IF v_target_role = 'admin_global' AND p_user_id <> v_caller_id THEN
    RAISE EXCEPTION 'Não é permitido alterar papel de outro admin_global';
  END IF;

  UPDATE public.profiles SET role = p_new_role WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.promote_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_role(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
