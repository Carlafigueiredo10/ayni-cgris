INSERT INTO public.profiles (id, email, display_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'nome', u.email), 'member'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
