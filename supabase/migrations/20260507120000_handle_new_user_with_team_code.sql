-- Atualiza handle_new_user pra popular team_id a partir do team_code no metadata
-- Quando o LoginCard envia { nome, team_code } no signUp, o profile já é criado
-- com a equipe selecionada (sem precisar do admin atribuir depois).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, team_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'member',
    (SELECT id FROM public.teams
      WHERE code = NEW.raw_user_meta_data->>'team_code')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
