-- Adiciona equipe NATOS — Núcleo de Atos
INSERT INTO public.teams (code, name)
VALUES ('natos', 'NATOS — Núcleo de Atos')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
