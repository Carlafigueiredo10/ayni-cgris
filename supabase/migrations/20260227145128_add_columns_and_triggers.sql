-- Novas colunas em registros
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS reincidencia_tipo TEXT DEFAULT 'none'
    CHECK (reincidencia_tipo IN ('none', 'self', 'other'));
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS reincidencia_respostas JSONB;

-- Trigger: auto-create profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: sync team_id SOMENTE no INSERT (registros antigos mantêm equipe original)
CREATE OR REPLACE FUNCTION public.sync_team_id_on_registro()
RETURNS TRIGGER AS $$
BEGIN
  NEW.team_id := (SELECT team_id FROM public.profiles WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS set_team_id_on_registro ON public.registros;
CREATE TRIGGER set_team_id_on_registro
  BEFORE INSERT ON public.registros
  FOR EACH ROW EXECUTE FUNCTION public.sync_team_id_on_registro();
