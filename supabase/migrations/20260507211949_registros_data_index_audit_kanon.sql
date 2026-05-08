-- ============================================================
-- 1. Indices em registros para acelerar agregacoes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_registros_data
  ON public.registros (data DESC);

CREATE INDEX IF NOT EXISTS idx_registros_user_id_data
  ON public.registros (user_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_registros_team_id_data
  ON public.registros (team_id, data DESC);

-- ============================================================
-- 2. K-anonymity: get_cgris_overview oculta coord com <3 ativos no mes
-- Adiciona _servidores e _visivel por equipe; UI checa _visivel.
-- ============================================================
DROP FUNCTION IF EXISTS public.get_cgris_overview(TEXT);

CREATE OR REPLACE FUNCTION public.get_cgris_overview(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  mes DATE,
  total_servidores_no_mes INT,
  total_servidores_cadastrados INT,
  total_processos INT,
  total_concluidos INT,
  total_minutos INT,
  qtd_judicial INT,
  qtd_controle INT,
  qtd_atos INT,
  qtd_reincidencias INT,
  taxa_reincidencia_pct NUMERIC,
  cocon_processos INT,
  cocon_servidores INT,
  cocon_visivel BOOLEAN,
  codej_processos INT,
  codej_servidores INT,
  codej_visivel BOOLEAN,
  natos_processos INT,
  natos_servidores INT,
  natos_visivel BOOLEAN
) AS $$
DECLARE
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
  v_min_servidores INT := 3;
BEGIN
  RETURN QUERY
  WITH agg AS (
    SELECT
      r.id, r.user_id, r.team_id, r.minutos, r.tipo_natureza, r.status,
      r.reincidencia_tipo, t.code AS team_code
    FROM public.registros r
    LEFT JOIN public.teams t ON t.id = r.team_id
    WHERE date_trunc('month', r.data) = v_month
  ),
  por_team AS (
    SELECT
      team_code,
      COUNT(*)::INT AS processos,
      COUNT(DISTINCT user_id)::INT AS servidores
    FROM agg
    GROUP BY team_code
  )
  SELECT
    v_month,
    (SELECT COUNT(DISTINCT user_id)::INT FROM agg),
    (SELECT COUNT(*)::INT FROM public.profiles WHERE is_active),
    (SELECT COUNT(*)::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE status = 'Concluído')::INT FROM agg),
    (SELECT COALESCE(SUM(minutos), 0)::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE tipo_natureza = 'judicial')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE tipo_natureza = 'controle')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE tipo_natureza = 'atos')::INT FROM agg),
    (SELECT COUNT(*) FILTER (WHERE reincidencia_tipo != 'none')::INT FROM agg),
    (SELECT
       ROUND(
         COUNT(*) FILTER (WHERE reincidencia_tipo != 'none')::NUMERIC
         / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
       )
     FROM agg),
    COALESCE((SELECT processos FROM por_team WHERE team_code = 'cocon'), 0),
    COALESCE((SELECT servidores FROM por_team WHERE team_code = 'cocon'), 0),
    COALESCE((SELECT servidores FROM por_team WHERE team_code = 'cocon'), 0) >= v_min_servidores,
    COALESCE((SELECT processos FROM por_team WHERE team_code = 'codej'), 0),
    COALESCE((SELECT servidores FROM por_team WHERE team_code = 'codej'), 0),
    COALESCE((SELECT servidores FROM por_team WHERE team_code = 'codej'), 0) >= v_min_servidores,
    COALESCE((SELECT processos FROM por_team WHERE team_code = 'natos'), 0),
    COALESCE((SELECT servidores FROM por_team WHERE team_code = 'natos'), 0),
    COALESCE((SELECT servidores FROM por_team WHERE team_code = 'natos'), 0) >= v_min_servidores;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_cgris_overview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cgris_overview(TEXT) TO authenticated;

-- ============================================================
-- 3. Audit trigger em profiles: mudanca de role/team/is_active
-- Loga em admin_audit_logs (mesma tabela do edge function admin-users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_profile_change()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '{}'::JSONB;
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    v_changes := v_changes || jsonb_build_object(
      'role', jsonb_build_object('old', OLD.role, 'new', NEW.role)
    );
  END IF;
  IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
    v_changes := v_changes || jsonb_build_object(
      'team_id', jsonb_build_object('old', OLD.team_id, 'new', NEW.team_id)
    );
  END IF;
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    v_changes := v_changes || jsonb_build_object(
      'is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active)
    );
  END IF;

  IF v_changes <> '{}'::JSONB THEN
    INSERT INTO public.admin_audit_logs (
      admin_user_id, target_user_id, action, payload
    ) VALUES (
      COALESCE(auth.uid(), NEW.id),
      NEW.id,
      'profile_change',
      v_changes
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS audit_profile_change_trg ON public.profiles;
CREATE TRIGGER audit_profile_change_trg
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_change();

NOTIFY pgrst, 'reload schema';
