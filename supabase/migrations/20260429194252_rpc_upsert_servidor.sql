-- RPC: upsert_servidor
-- Centraliza autorizacao (apenas admin_global) e resolucao team_code -> team_id

CREATE OR REPLACE FUNCTION public.upsert_servidor(
  p_id UUID,                -- NULL para insert, UUID para update
  p_nome TEXT,
  p_siape TEXT,
  p_email TEXT,
  p_team_code TEXT,         -- NULL ou 'cocon'/'codej'
  p_presencial BOOLEAN,
  p_ativo BOOLEAN
) RETURNS UUID AS $$
DECLARE
  v_caller_role TEXT;
  v_team_id UUID;
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

  IF p_id IS NULL THEN
    INSERT INTO public.servidores (nome, siape, email, team_id, presencial, ativo)
    VALUES (
      trim(p_nome),
      NULLIF(trim(p_siape), ''),
      NULLIF(trim(p_email), ''),
      v_team_id,
      COALESCE(p_presencial, FALSE),
      COALESCE(p_ativo, TRUE)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.servidores
    SET nome       = trim(p_nome),
        siape      = NULLIF(trim(p_siape), ''),
        email      = NULLIF(trim(p_email), ''),
        team_id    = v_team_id,
        presencial = COALESCE(p_presencial, FALSE),
        ativo      = COALESCE(p_ativo, TRUE)
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Servidor nao encontrado: %', p_id;
    END IF;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.upsert_servidor(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_servidor(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
