-- ============================================================
-- profiles: identificacao SIAPE + regime de trabalho
-- ============================================================
--
-- - SIAPE no signup (apenas armazena, sem validar contra roster)
--   facilita o batimento profiles<->servidores na equipe_view
--   (mais robusto que email; e-mail muda, SIAPE nao)
-- - Regime: auto-declaracao no signup (presencial/remoto/hibrido).
--   Coordenacao pode editar via /admin (admin-users update_profile)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS siape TEXT,
  ADD COLUMN IF NOT EXISTS regime TEXT
    CHECK (regime IS NULL OR regime IN ('presencial','remoto','hibrido'));

CREATE INDEX IF NOT EXISTS idx_profiles_siape
  ON public.profiles (siape) WHERE siape IS NOT NULL;

-- ------------------------------------------------------------
-- handle_new_user: le siape e regime do user_metadata
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, team_id, siape, regime)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'member',
    (SELECT id FROM public.teams
      WHERE code = NEW.raw_user_meta_data->>'team_code'),
    NULLIF(NEW.raw_user_meta_data->>'siape', ''),
    CASE NEW.raw_user_meta_data->>'regime'
      WHEN 'presencial' THEN 'presencial'
      WHEN 'remoto'     THEN 'remoto'
      WHEN 'hibrido'    THEN 'hibrido'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------
-- equipe_view: JOIN preferindo SIAPE (fallback email), expoe regime
-- ------------------------------------------------------------
-- DROP+CREATE em vez de OR REPLACE: a view ja existe e estamos
-- adicionando coluna no meio (regime), o que OR REPLACE proibe.
DROP VIEW IF EXISTS public.equipe_view;

CREATE VIEW public.equipe_view
WITH (security_invoker = off) AS
SELECT
  s.id                       AS servidor_id,
  s.nome,
  s.email,
  COALESCE(p.siape, s.siape) AS siape,
  s.team_id,
  t.code                     AS team_code,
  t.name                     AS team_name,
  p.regime,
  s.presencial,
  s.ativo,
  p.id                       AS profile_id,
  (p.id IS NOT NULL)         AS usuario_ativo
FROM public.servidores s
LEFT JOIN public.profiles p ON (
  (p.siape IS NOT NULL AND s.siape IS NOT NULL AND p.siape = s.siape)
  OR
  (
    (p.siape IS NULL OR s.siape IS NULL)
    AND lower(trim(p.email)) = lower(trim(s.email))
  )
)
LEFT JOIN public.teams t ON t.id = s.team_id;

REVOKE ALL ON public.equipe_view FROM PUBLIC;
GRANT SELECT ON public.equipe_view TO authenticated;

NOTIFY pgrst, 'reload schema';
