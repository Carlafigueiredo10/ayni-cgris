-- ============================================================
-- update_my_profile: usuario edita o proprio perfil (campos limitados)
-- ============================================================
--
-- Servidor pode atualizar nome de exibicao, SIAPE e regime.
-- Coordenacao continua podendo sobrescrever via admin-users
-- (action update_profile). Email/role/team_id/is_active NAO sao
-- editaveis aqui — esses passam pela edge function admin.
--
-- Por que RPC e nao UPDATE direto?
-- A policy `profiles_update_own_name` permite o caller atualizar
-- a propria linha (id = auth.uid()), mas nao restringe colunas.
-- Sem essa RPC, o cliente poderia tentar mexer em role/team_id
-- diretamente. Concentrando aqui o ponto unico de auto-edicao
-- com whitelist explicita de campos.

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_display_name TEXT,
  p_siape TEXT,
  p_regime TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  IF p_regime IS NOT NULL AND p_regime NOT IN ('presencial','remoto','hibrido') THEN
    RAISE EXCEPTION 'regime invalido: %', p_regime;
  END IF;

  UPDATE public.profiles
  SET
    display_name = COALESCE(NULLIF(trim(p_display_name), ''), display_name),
    siape        = NULLIF(trim(p_siape), ''),
    regime       = p_regime
  WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
