-- ============================================================
-- Fix: ambiguidade de team_id em 3 RPCs do modulo Ferias
-- ============================================================
--
-- listar_ferias_equipe, ferias_mapa e ferias_conflitos_equipe
-- declaram team_id na clausula RETURNS TABLE, o que torna o
-- nome implicitamente uma variavel PL/pgSQL e gera ambiguidade
-- no SELECT role, team_id FROM profiles WHERE id = v_caller.
--
-- Fix: qualificar com p.role / p.team_id no SELECT INTO.
-- (CREATE OR REPLACE — idempotente em ambientes ja corrigidos.)

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
    SELECT t.id INTO v_filter FROM public.teams t WHERE t.code = p_team_code;
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

NOTIFY pgrst, 'reload schema';
