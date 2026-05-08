-- ============================================================
-- atribuir_subteam_servidor: variante de atribuir_subteam que
-- opera pelo ID do roster (servidores), nao do profile.
-- ============================================================
--
-- Por que existe: a UI de admin lista o roster (tabela servidores)
-- e nem todo servidor cadastrado tem profile (login). A RPC original
-- atribuir_subteam(p_user_id) exige profile. Esta variante:
--   - sempre atualiza servidores.subteam_id
--   - se houver profile correspondente (match por email), atualiza
--     tambem profiles.subteam_id (mantem consistencia)
--   - permissao via _teams_pode_gerir(equipe principal do servidor)

CREATE OR REPLACE FUNCTION public.atribuir_subteam_servidor(
  p_servidor_id UUID,
  p_subteam_id  UUID    -- NULL = remove
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_team UUID;
  v_email       TEXT;
  v_parent      UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;

  SELECT team_id, email INTO v_target_team, v_email
  FROM public.servidores WHERE id = p_servidor_id;
  IF v_target_team IS NULL THEN
    RAISE EXCEPTION 'Servidor sem equipe principal definida';
  END IF;

  -- Valida sub-equipe (se nao for NULL)
  IF p_subteam_id IS NOT NULL THEN
    SELECT parent_id INTO v_parent FROM public.teams WHERE id = p_subteam_id;
    IF v_parent IS NULL THEN
      RAISE EXCEPTION 'subteam_id nao e uma sub-equipe valida';
    END IF;
    IF v_parent <> v_target_team THEN
      RAISE EXCEPTION 'Sub-equipe pertence a outra equipe principal';
    END IF;
  END IF;

  IF NOT public._teams_pode_gerir(v_target_team) THEN
    RAISE EXCEPTION 'Sem permissao para alterar sub-equipe deste servidor';
  END IF;

  -- Atualiza roster (sempre)
  UPDATE public.servidores SET subteam_id = p_subteam_id WHERE id = p_servidor_id;

  -- Espelha em profiles se existir match por email
  IF v_email IS NOT NULL THEN
    UPDATE public.profiles
    SET subteam_id = p_subteam_id
    WHERE lower(trim(email)) = lower(trim(v_email));
  END IF;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.atribuir_subteam_servidor(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atribuir_subteam_servidor(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
