-- ============================================================
-- Refactor: get_cgris_overview com breakdown DINAMICO por equipe
-- ============================================================
--
-- Antes: 9 colunas hardcoded (cocon_processos / cocon_servidores /
-- cocon_visivel / codej_* / natos_*). Toda equipe nova exigia
-- migration + deploy + ajuste no frontend.
--
-- Agora: coluna JSONB processos_por_equipe = array de objetos
--   [{ team_id, code, name, processos, servidores, visivel }, ...]
-- Inclui SOMENTE equipes principais (parent_id IS NULL). Sub-equipes
-- nao aparecem aqui — agregacao continua sendo por equipe principal,
-- conforme decisao de design.
--
-- Regra de visivel mantida: equipe so expoe numeros se tiver >= 3
-- servidores distintos com registros no mes (privacidade).

DROP FUNCTION IF EXISTS public.get_cgris_overview(TEXT);

CREATE OR REPLACE FUNCTION public.get_cgris_overview(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  mes                          DATE,
  total_servidores_no_mes      INT,
  total_servidores_cadastrados INT,
  total_processos              INT,
  total_concluidos             INT,
  total_minutos                INT,
  qtd_judicial                 INT,
  qtd_controle                 INT,
  qtd_atos                     INT,
  qtd_reincidencias            INT,
  taxa_reincidencia_pct        NUMERIC,
  processos_por_equipe         JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
BEGIN
  RETURN QUERY
  WITH agg AS (
    SELECT
      r.id, r.user_id, r.team_id, r.minutos, r.tipo_natureza, r.status,
      r.reincidencia_tipo
    FROM public.registros r
    WHERE date_trunc('month', r.data) = v_month
  ),
  -- Agregado por equipe principal. Equipes sem registros aparecem com 0.
  por_equipe AS (
    SELECT
      t.id            AS team_id,
      t.code          AS code,
      t.name          AS name,
      COALESCE(COUNT(a.id) FILTER (WHERE a.id IS NOT NULL), 0)::INT AS processos,
      COALESCE(COUNT(DISTINCT a.user_id) FILTER (WHERE a.user_id IS NOT NULL), 0)::INT AS servidores
    FROM public.teams t
    LEFT JOIN agg a ON a.team_id = t.id
    WHERE t.parent_id IS NULL
    GROUP BY t.id, t.code, t.name
    ORDER BY t.code
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
    (SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'team_id',    pe.team_id,
          'code',       pe.code,
          'name',       pe.name,
          'processos',  pe.processos,
          'servidores', pe.servidores,
          'visivel',    pe.servidores >= 3
        )
        ORDER BY pe.code
      ), '[]'::jsonb)
     FROM por_equipe pe);
END;
$$;

REVOKE ALL ON FUNCTION public.get_cgris_overview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cgris_overview(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
