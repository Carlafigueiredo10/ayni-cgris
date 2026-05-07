-- ============================================================
-- View equipe_view: roster institucional + status de ativacao
-- ============================================================
--
-- Aba Equipe lia direto de `servidores`. Como o cadastro alimenta
-- `profiles` (e nao espelha em `servidores`), faltava sinal de quem
-- ja tem conta. Esta view une as duas fontes via email normalizado
-- e expoe `usuario_ativo` para a UI mostrar badge.
--
-- security_invoker = off (default) -> roda como owner, bypassa RLS
-- de `profiles` (que limita a `id = auth.uid()`). Necessario para
-- que todos enxerguem o status de ativacao do roster inteiro.

CREATE OR REPLACE VIEW public.equipe_view
WITH (security_invoker = off) AS
SELECT
  s.id            AS servidor_id,
  s.nome,
  s.email,
  s.siape,
  s.team_id,
  t.code          AS team_code,
  t.name          AS team_name,
  s.presencial,
  s.ativo,
  p.id            AS profile_id,
  (p.id IS NOT NULL) AS usuario_ativo
FROM public.servidores s
LEFT JOIN public.profiles p
  ON lower(trim(p.email)) = lower(trim(s.email))
LEFT JOIN public.teams t
  ON t.id = s.team_id;

REVOKE ALL ON public.equipe_view FROM PUBLIC;
GRANT SELECT ON public.equipe_view TO authenticated;

-- Indices funcionais para acelerar o JOIN por email
CREATE INDEX IF NOT EXISTS idx_profiles_lower_email
  ON public.profiles (lower(trim(email)));

CREATE INDEX IF NOT EXISTS idx_servidores_lower_email
  ON public.servidores (lower(trim(email)));

NOTIFY pgrst, 'reload schema';
