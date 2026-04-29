CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.teams (code, name) VALUES
  ('cocon', 'COCON — Coordenação de Controle'),
  ('codej', 'CODEJ — Coordenação de Demandas Judiciais')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email        TEXT,
  team_id      UUID REFERENCES public.teams(id),
  role         TEXT NOT NULL DEFAULT 'member'
                 CHECK (role IN ('admin_global', 'manager_team', 'member')),
  created_at   TIMESTAMPTZ DEFAULT now()
);
