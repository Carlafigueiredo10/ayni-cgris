-- ============================================================
-- RPCs do modulo Ferias
-- ============================================================
--
-- Todas as escritas passam por RPCs SECURITY DEFINER que validam
-- papel/escopo. Leitura segue RLS (ver migration anterior).
--
-- Helper interno _ferias_pode_gerir(target_servidor_id) checa se
-- o caller pode aprovar/ajustar/cancelar ferias do servidor alvo:
--   - admin_global, manager_cgris: sempre
--   - manager_team: se compartilha team_id com o alvo

-- ------------------------------------------------------------
-- Helper: o caller pode gerir ferias do servidor alvo?
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._ferias_pode_gerir(p_target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles caller
    LEFT JOIN public.profiles target ON target.id = p_target
    WHERE caller.id = auth.uid()
      AND (
        caller.role IN ('admin_global','manager_cgris')
        OR (
          caller.role = 'manager_team'
          AND caller.team_id IS NOT NULL
          AND caller.team_id = target.team_id
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION public._ferias_pode_gerir(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._ferias_pode_gerir(UUID) TO authenticated;

-- ------------------------------------------------------------
-- solicitar_ferias: cria solicitacao em status PENDENTE.
-- Servidor cria pra si; gestor pode criar em nome de subordinado.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.solicitar_ferias(
  p_servidor_id UUID,           -- NULL => self
  p_data_inicio DATE,
  p_data_fim    DATE,
  p_observacao  TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_target UUID;
  v_id     UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  v_target := COALESCE(p_servidor_id, v_caller);

  IF v_target <> v_caller AND NOT public._ferias_pode_gerir(v_target) THEN
    RAISE EXCEPTION 'Sem permissao para solicitar ferias deste servidor';
  END IF;

  IF p_data_inicio IS NULL OR p_data_fim IS NULL THEN
    RAISE EXCEPTION 'Datas de inicio e fim sao obrigatorias';
  END IF;
  IF p_data_fim < p_data_inicio THEN
    RAISE EXCEPTION 'Data fim nao pode ser anterior a data inicio';
  END IF;

  INSERT INTO public.ferias (
    servidor_id, data_inicio, data_fim, status,
    observacao_servidor, created_by
  ) VALUES (
    v_target, p_data_inicio, p_data_fim, 'PENDENTE',
    NULLIF(trim(p_observacao), ''), v_caller
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.solicitar_ferias(UUID, DATE, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.solicitar_ferias(UUID, DATE, DATE, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- atualizar_ferias: servidor edita as proprias ferias enquanto
-- estiverem em PENDENTE ou AJUSTAR. Ao salvar de AJUSTAR, status
-- volta para PENDENTE automaticamente. Gestor tambem pode editar
-- (e editar observacao_gestor via alterar_status).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.atualizar_ferias(
  p_id          UUID,
  p_data_inicio DATE,
  p_data_fim    DATE,
  p_observacao  TEXT DEFAULT NULL
) RETURNS public.ferias_status
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller    UUID := auth.uid();
  v_servidor  UUID;
  v_status    public.ferias_status;
  v_new_status public.ferias_status;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT servidor_id, status INTO v_servidor, v_status
  FROM public.ferias
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_servidor IS NULL THEN
    RAISE EXCEPTION 'Ferias nao encontradas';
  END IF;

  IF v_servidor <> v_caller AND NOT public._ferias_pode_gerir(v_servidor) THEN
    RAISE EXCEPTION 'Sem permissao para editar estas ferias';
  END IF;

  IF v_status NOT IN ('PENDENTE','AJUSTAR') THEN
    RAISE EXCEPTION 'So e possivel editar ferias em PENDENTE ou AJUSTAR (status atual: %)', v_status;
  END IF;

  IF p_data_inicio IS NULL OR p_data_fim IS NULL THEN
    RAISE EXCEPTION 'Datas de inicio e fim sao obrigatorias';
  END IF;
  IF p_data_fim < p_data_inicio THEN
    RAISE EXCEPTION 'Data fim nao pode ser anterior a data inicio';
  END IF;

  -- Edicao de AJUSTAR retorna automaticamente para PENDENTE.
  v_new_status := CASE WHEN v_status = 'AJUSTAR' THEN 'PENDENTE'::public.ferias_status ELSE v_status END;

  UPDATE public.ferias SET
    data_inicio         = p_data_inicio,
    data_fim            = p_data_fim,
    observacao_servidor = NULLIF(trim(p_observacao), ''),
    status              = v_new_status
  WHERE id = p_id;

  RETURN v_new_status;
END; $$;
REVOKE ALL ON FUNCTION public.atualizar_ferias(UUID, DATE, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_ferias(UUID, DATE, DATE, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- alterar_status_ferias: gestor/admin muda status. Se for
-- AJUSTAR, observacao_gestor e obrigatoria (orientacao de ajuste).
-- CANCELADA pode ser definida pelo proprio servidor tambem.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.alterar_status_ferias(
  p_id              UUID,
  p_status          public.ferias_status,
  p_observacao_gestor TEXT DEFAULT NULL
) RETURNS public.ferias_status
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller   UUID := auth.uid();
  v_servidor UUID;
  v_status_atual public.ferias_status;
  v_pode_gerir BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT servidor_id, status INTO v_servidor, v_status_atual
  FROM public.ferias
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_servidor IS NULL THEN
    RAISE EXCEPTION 'Ferias nao encontradas';
  END IF;

  v_pode_gerir := public._ferias_pode_gerir(v_servidor);

  -- Servidor so pode CANCELAR as proprias ferias
  IF p_status = 'CANCELADA' THEN
    IF v_servidor <> v_caller AND NOT v_pode_gerir THEN
      RAISE EXCEPTION 'Sem permissao para cancelar estas ferias';
    END IF;
  ELSE
    IF NOT v_pode_gerir THEN
      RAISE EXCEPTION 'Apenas gestor da equipe pode aprovar/ajustar';
    END IF;
  END IF;

  IF p_status = 'AJUSTAR' AND (p_observacao_gestor IS NULL OR length(trim(p_observacao_gestor)) = 0) THEN
    RAISE EXCEPTION 'Observacao do gestor e obrigatoria ao solicitar ajuste';
  END IF;

  UPDATE public.ferias SET
    status            = p_status,
    observacao_gestor = COALESCE(NULLIF(trim(p_observacao_gestor), ''), observacao_gestor)
  WHERE id = p_id;

  RETURN p_status;
END; $$;
REVOKE ALL ON FUNCTION public.alterar_status_ferias(UUID, public.ferias_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alterar_status_ferias(UUID, public.ferias_status, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- excluir_ferias: soft-delete. Servidor pode excluir as proprias
-- enquanto PENDENTE/AJUSTAR/CANCELADA; gestor pode em qualquer
-- status. Nao remove de fato — preserva historico.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.excluir_ferias(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller   UUID := auth.uid();
  v_servidor UUID;
  v_status   public.ferias_status;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT servidor_id, status INTO v_servidor, v_status
  FROM public.ferias
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_servidor IS NULL THEN
    RAISE EXCEPTION 'Ferias nao encontradas';
  END IF;

  IF v_servidor = v_caller THEN
    IF v_status = 'APROVADA' THEN
      RAISE EXCEPTION 'Cancele primeiro (status APROVADA)';
    END IF;
  ELSIF NOT public._ferias_pode_gerir(v_servidor) THEN
    RAISE EXCEPTION 'Sem permissao para excluir estas ferias';
  END IF;

  UPDATE public.ferias SET deleted_at = now() WHERE id = p_id;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.excluir_ferias(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_ferias(UUID) TO authenticated;

-- ------------------------------------------------------------
-- listar_ferias_equipe: visao do gestor — todas as ferias dos
-- servidores da equipe (escopo conforme papel) num intervalo.
-- Inclui dados do servidor para a UI.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listar_ferias_equipe(
  p_team_code TEXT DEFAULT NULL,
  p_de        DATE DEFAULT NULL,
  p_ate       DATE DEFAULT NULL,
  p_status    public.ferias_status DEFAULT NULL
)
RETURNS TABLE (
  id                  UUID,
  servidor_id         UUID,
  servidor_nome       TEXT,
  servidor_email      TEXT,
  team_id             UUID,
  team_code           TEXT,
  team_name           TEXT,
  data_inicio         DATE,
  data_fim            DATE,
  status              public.ferias_status,
  observacao_servidor TEXT,
  observacao_gestor   TEXT,
  created_at          TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_role   TEXT;
  v_team   UUID;
  v_filter UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = v_caller;

  IF v_role NOT IN ('admin_global','manager_cgris','manager_team') THEN
    RAISE EXCEPTION 'Acesso restrito a coordenacao';
  END IF;

  IF p_team_code IS NOT NULL AND length(p_team_code) > 0 THEN
    SELECT id INTO v_filter FROM public.teams WHERE code = p_team_code;
    IF v_filter IS NULL THEN
      RAISE EXCEPTION 'Equipe nao encontrada: %', p_team_code;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    f.id, f.servidor_id, p.display_name, p.email,
    p.team_id, t.code, t.name,
    f.data_inicio, f.data_fim, f.status,
    f.observacao_servidor, f.observacao_gestor,
    f.created_at, f.updated_at
  FROM public.ferias f
  JOIN public.profiles p ON p.id = f.servidor_id
  LEFT JOIN public.teams t ON t.id = p.team_id
  WHERE f.deleted_at IS NULL
    AND (p_status IS NULL OR f.status = p_status)
    AND (p_de  IS NULL OR f.data_fim    >= p_de)
    AND (p_ate IS NULL OR f.data_inicio <= p_ate)
    AND (
      v_role IN ('admin_global','manager_cgris')
      OR (v_role = 'manager_team' AND v_team IS NOT NULL AND p.team_id = v_team)
    )
    AND (v_filter IS NULL OR p.team_id = v_filter)
  ORDER BY f.data_inicio, p.display_name;
END; $$;
REVOKE ALL ON FUNCTION public.listar_ferias_equipe(TEXT, DATE, DATE, public.ferias_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_ferias_equipe(TEXT, DATE, DATE, public.ferias_status) TO authenticated;

-- ------------------------------------------------------------
-- ferias_mapa: resumo por equipe num intervalo. Conta efetivo
-- (membros com profile na equipe) e quantos estarao em ferias
-- aprovadas/pendentes no periodo. Para o "Mapa Operacional".
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ferias_mapa(
  p_de  DATE,
  p_ate DATE
)
RETURNS TABLE (
  team_id          UUID,
  team_code        TEXT,
  team_name        TEXT,
  total_membros    INT,
  em_ferias        INT,
  aprovadas        INT,
  pendentes        INT,
  pct_ausente      NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_role   TEXT;
  v_team   UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF p_de IS NULL OR p_ate IS NULL OR p_ate < p_de THEN
    RAISE EXCEPTION 'Intervalo invalido';
  END IF;

  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = v_caller;

  IF v_role NOT IN ('admin_global','manager_cgris','manager_team') THEN
    RAISE EXCEPTION 'Acesso restrito a coordenacao';
  END IF;

  RETURN QUERY
  WITH escopo AS (
    SELECT t.id, t.code, t.name
    FROM public.teams t
    WHERE
      v_role IN ('admin_global','manager_cgris')
      OR (v_role = 'manager_team' AND v_team IS NOT NULL AND t.id = v_team)
    UNION ALL
    -- Bucket "Sem equipe": apenas admin_global/manager_cgris veem
    -- (ajuda a expor cadastro incompleto). manager_team nao precisa.
    SELECT NULL::UUID, NULL::TEXT, 'Sem equipe'::TEXT
    WHERE v_role IN ('admin_global','manager_cgris')
  ),
  membros AS (
    SELECT p.team_id, COUNT(*)::INT AS total
    FROM public.profiles p
    GROUP BY p.team_id
  ),
  ausencias AS (
    SELECT
      p.team_id,
      f.servidor_id,
      bool_or(f.status = 'APROVADA') AS tem_aprovada,
      bool_or(f.status = 'PENDENTE') AS tem_pendente
    FROM public.ferias f
    JOIN public.profiles p ON p.id = f.servidor_id
    WHERE f.deleted_at IS NULL
      AND f.status IN ('APROVADA','PENDENTE')
      AND daterange(f.data_inicio, f.data_fim, '[]')
          && daterange(p_de, p_ate, '[]')
    GROUP BY p.team_id, f.servidor_id
  )
  -- IS NOT DISTINCT FROM faz join NULL-safe pro bucket "Sem equipe"
  SELECT
    e.id,
    e.code,
    e.name,
    COALESCE(m.total, 0),
    COALESCE(COUNT(DISTINCT a.servidor_id)::INT, 0),
    COALESCE(COUNT(DISTINCT a.servidor_id) FILTER (WHERE a.tem_aprovada)::INT, 0),
    COALESCE(COUNT(DISTINCT a.servidor_id) FILTER (WHERE a.tem_pendente AND NOT a.tem_aprovada)::INT, 0),
    CASE
      WHEN COALESCE(m.total, 0) = 0 THEN 0::NUMERIC
      ELSE ROUND(COUNT(DISTINCT a.servidor_id)::NUMERIC / m.total * 100, 1)
    END
  FROM escopo e
  LEFT JOIN membros m   ON m.team_id IS NOT DISTINCT FROM e.id
  LEFT JOIN ausencias a ON a.team_id IS NOT DISTINCT FROM e.id
  GROUP BY e.id, e.code, e.name, m.total
  ORDER BY (e.id IS NULL), e.code;
END; $$;
REVOKE ALL ON FUNCTION public.ferias_mapa(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ferias_mapa(DATE, DATE) TO authenticated;

-- ------------------------------------------------------------
-- ferias_conflitos_equipe: lista pares concretos de servidores
-- da mesma equipe com ferias sobrepostas no intervalo, marcando
-- se sao "criticos" (estao em servidor_relacao_critica).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ferias_conflitos_equipe(
  p_de  DATE,
  p_ate DATE
)
RETURNS TABLE (
  team_id        UUID,
  team_code      TEXT,
  team_name      TEXT,
  servidor_a_id  UUID,
  servidor_a     TEXT,
  ferias_a_id    UUID,
  servidor_b_id  UUID,
  servidor_b     TEXT,
  ferias_b_id    UUID,
  inicio         DATE,
  fim            DATE,
  critico        BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_role   TEXT;
  v_team   UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF p_de IS NULL OR p_ate IS NULL OR p_ate < p_de THEN
    RAISE EXCEPTION 'Intervalo invalido';
  END IF;

  SELECT p.role, p.team_id INTO v_role, v_team
  FROM public.profiles p WHERE p.id = v_caller;

  IF v_role NOT IN ('admin_global','manager_cgris','manager_team') THEN
    RAISE EXCEPTION 'Acesso restrito a coordenacao';
  END IF;

  RETURN QUERY
  WITH no_periodo AS (
    SELECT
      f.id, f.servidor_id, p.display_name, p.team_id, t.code, t.name,
      f.data_inicio, f.data_fim
    FROM public.ferias f
    JOIN public.profiles p ON p.id = f.servidor_id
    LEFT JOIN public.teams t ON t.id = p.team_id
    WHERE f.deleted_at IS NULL
      AND f.status IN ('APROVADA','PENDENTE')
      AND daterange(f.data_inicio, f.data_fim, '[]')
          && daterange(p_de, p_ate, '[]')
      AND (
        v_role IN ('admin_global','manager_cgris')
        OR (v_role = 'manager_team' AND v_team IS NOT NULL AND p.team_id = v_team)
      )
  )
  SELECT
    a.team_id, a.code, a.name,
    a.servidor_id, a.display_name, a.id,
    b.servidor_id, b.display_name, b.id,
    GREATEST(a.data_inicio, b.data_inicio),
    LEAST(a.data_fim, b.data_fim),
    EXISTS (
      SELECT 1 FROM public.servidor_relacao_critica rc
      WHERE (rc.servidor_id = a.servidor_id AND rc.relacionado_id = b.servidor_id)
         OR (rc.servidor_id = b.servidor_id AND rc.relacionado_id = a.servidor_id)
    )
  FROM no_periodo a
  JOIN no_periodo b ON
       a.team_id = b.team_id
   AND a.servidor_id < b.servidor_id
   AND daterange(a.data_inicio, a.data_fim, '[]')
       && daterange(b.data_inicio, b.data_fim, '[]')
  ORDER BY a.team_id, GREATEST(a.data_inicio, b.data_inicio);
END; $$;
REVOKE ALL ON FUNCTION public.ferias_conflitos_equipe(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ferias_conflitos_equipe(DATE, DATE) TO authenticated;

-- ------------------------------------------------------------
-- relacao_critica_add / _remove: gestor mantem pares criticos.
-- Sempre normalizado para servidor.id < relacionado.id (evita
-- duplicidade na ordem inversa).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.relacao_critica_add(
  p_servidor_id    UUID,
  p_relacionado_id UUID,
  p_observacao     TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_a UUID;
  v_b UUID;
  v_id UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF p_servidor_id IS NULL OR p_relacionado_id IS NULL OR p_servidor_id = p_relacionado_id THEN
    RAISE EXCEPTION 'Servidores invalidos';
  END IF;

  IF NOT public._ferias_pode_gerir(p_servidor_id)
     OR NOT public._ferias_pode_gerir(p_relacionado_id) THEN
    RAISE EXCEPTION 'Sem permissao para vincular estes servidores';
  END IF;

  IF p_servidor_id < p_relacionado_id THEN
    v_a := p_servidor_id; v_b := p_relacionado_id;
  ELSE
    v_a := p_relacionado_id; v_b := p_servidor_id;
  END IF;

  INSERT INTO public.servidor_relacao_critica
    (servidor_id, relacionado_id, observacao, created_by)
  VALUES (v_a, v_b, NULLIF(trim(p_observacao), ''), v_caller)
  ON CONFLICT (servidor_id, relacionado_id) DO UPDATE
    SET observacao = COALESCE(EXCLUDED.observacao, public.servidor_relacao_critica.observacao)
  RETURNING id INTO v_id;

  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.relacao_critica_add(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.relacao_critica_add(UUID, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.relacao_critica_remove(
  p_servidor_id    UUID,
  p_relacionado_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_a UUID;
  v_b UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF NOT public._ferias_pode_gerir(p_servidor_id)
     OR NOT public._ferias_pode_gerir(p_relacionado_id) THEN
    RAISE EXCEPTION 'Sem permissao para desvincular estes servidores';
  END IF;

  IF p_servidor_id < p_relacionado_id THEN
    v_a := p_servidor_id; v_b := p_relacionado_id;
  ELSE
    v_a := p_relacionado_id; v_b := p_servidor_id;
  END IF;

  DELETE FROM public.servidor_relacao_critica
  WHERE servidor_id = v_a AND relacionado_id = v_b;

  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.relacao_critica_remove(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.relacao_critica_remove(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
