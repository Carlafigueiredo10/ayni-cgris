-- ============================================================
-- Substituir servidores.presencial (boolean) por regime (text)
-- ============================================================
--
-- Motivo: nova UX usa 3 valores (presencial/remoto/hibrido) e o
-- regime e auto-declarado no signup (profile.regime). Manter o
-- boolean legado vira divida tecnica imediata.
--
-- equipe_view passa a expor COALESCE(p.regime, s.regime) -- profile
-- prevalece (auto-declaracao do servidor; coordenacao pode editar
-- via /admin). Servidor.regime fica como fallback para quem ainda
-- nao se cadastrou no sistema.

-- 1) Adicionar nova coluna
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS regime TEXT
    CHECK (regime IS NULL OR regime IN ('presencial','remoto','hibrido'));

-- 2) Backfill conservador a partir do boolean
UPDATE public.servidores
SET regime = CASE WHEN presencial THEN 'presencial' ELSE 'remoto' END
WHERE regime IS NULL;

-- 3) Limpar dependencias antes do DROP COLUMN (view + RPC referenciam)
DROP VIEW IF EXISTS public.equipe_view;
DROP FUNCTION IF EXISTS public.upsert_servidor(uuid, text, text, text, text, boolean, boolean);

-- 4) Remover coluna legada
ALTER TABLE public.servidores DROP COLUMN presencial;

-- 5) Recriar upsert_servidor com p_regime no lugar de p_presencial
CREATE OR REPLACE FUNCTION public.upsert_servidor(
  p_id UUID,
  p_nome TEXT,
  p_siape TEXT,
  p_email TEXT,
  p_team_code TEXT,
  p_regime TEXT,
  p_ativo BOOLEAN
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
  v_team_id UUID;
  v_regime TEXT;
  v_id UUID;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role != 'admin_global' THEN
    RAISE EXCEPTION 'Apenas admin_global pode editar servidores';
  END IF;

  IF p_nome IS NULL OR length(trim(p_nome)) = 0 THEN
    RAISE EXCEPTION 'Nome e obrigatorio';
  END IF;

  IF p_team_code IS NOT NULL AND p_team_code != '' THEN
    SELECT id INTO v_team_id FROM public.teams WHERE code = p_team_code;
    IF v_team_id IS NULL THEN
      RAISE EXCEPTION 'Equipe nao encontrada: %', p_team_code;
    END IF;
  END IF;

  IF p_regime IS NOT NULL AND p_regime NOT IN ('presencial','remoto','hibrido') THEN
    RAISE EXCEPTION 'regime invalido: %', p_regime;
  END IF;
  v_regime := p_regime;

  IF p_id IS NULL THEN
    INSERT INTO public.servidores (nome, siape, email, team_id, regime, ativo)
    VALUES (
      trim(p_nome),
      NULLIF(trim(p_siape), ''),
      NULLIF(trim(p_email), ''),
      v_team_id,
      v_regime,
      COALESCE(p_ativo, TRUE)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.servidores
    SET nome    = trim(p_nome),
        siape   = NULLIF(trim(p_siape), ''),
        email   = NULLIF(trim(p_email), ''),
        team_id = v_team_id,
        regime  = v_regime,
        ativo   = COALESCE(p_ativo, TRUE)
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Servidor nao encontrado: %', p_id;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_servidor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_servidor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- 6) Recriar equipe_view: COALESCE(p.regime, s.regime), sem coluna presencial
CREATE VIEW public.equipe_view
WITH (security_invoker = off) AS
SELECT
  s.id                          AS servidor_id,
  s.nome,
  s.email,
  COALESCE(p.siape, s.siape)    AS siape,
  s.team_id,
  t.code                        AS team_code,
  t.name                        AS team_name,
  COALESCE(p.regime, s.regime)  AS regime,
  s.ativo,
  p.id                          AS profile_id,
  (p.id IS NOT NULL)            AS usuario_ativo
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
