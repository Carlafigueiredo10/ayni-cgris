-- PR 6: Sistema de pontuacao
-- Tabela assunto_pesos: peso por slug de assunto (placeholder peso=1; ajustar depois).
-- RPC get_my_score: para cada registro do user no mes, devolve atuacao_num,
-- multiplicador (5/4/3/2/1/0+), peso_assunto, fator_status (Concluido=1,
-- Encaminhado=0.5, outros=0) e pontos.

CREATE TABLE IF NOT EXISTS public.assunto_pesos (
  slug TEXT PRIMARY KEY,
  peso NUMERIC NOT NULL DEFAULT 1
);

INSERT INTO public.assunto_pesos (slug, peso) VALUES
  ('gratificacao_desempenho', 1),
  ('auxilio_alimentacao',     1),
  ('incorporacao_funcao',     1),
  ('progressao_funcional',    1),
  ('anistia',                 1),
  ('implantacao_rubrica',     1),
  ('exclusao_rubrica',        1),
  ('pagamento_atrasados',     1),
  ('revisao_proventos',       1),
  ('restituicao',             1),
  ('outros',                  1)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.assunto_pesos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assunto_pesos_select_auth" ON public.assunto_pesos;
CREATE POLICY "assunto_pesos_select_auth" ON public.assunto_pesos
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "assunto_pesos_admin_write" ON public.assunto_pesos;
CREATE POLICY "assunto_pesos_admin_write" ON public.assunto_pesos
  FOR ALL USING ((select public.get_my_role()) = 'admin_global')
  WITH CHECK ((select public.get_my_role()) = 'admin_global');

CREATE OR REPLACE FUNCTION public.get_my_score(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  registro_id      UUID,
  processo         TEXT,
  data             DATE,
  status           TEXT,
  assunto_slug     TEXT,
  atuacao_num      INT,
  multiplicador    INT,
  peso_assunto     NUMERIC,
  fator_status     NUMERIC,
  pontos           NUMERIC
) AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_team  UUID;
  v_month DATE := COALESCE(p_month::DATE, date_trunc('month', now())::DATE);
  v_next  DATE := (v_month + INTERVAL '1 month')::DATE;
BEGIN
  SELECT team_id INTO v_team FROM public.profiles WHERE id = v_uid;

  IF v_team IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      r.id,
      r.processo,
      r.data,
      r.status,
      r.user_id,
      COALESCE(r.assunto_judicial, '') AS assunto_slug,
      ROW_NUMBER() OVER (
        PARTITION BY r.processo
        ORDER BY r.created_at
      )::INT AS atuacao_num
    FROM public.registros r
    WHERE r.team_id = v_team
  ),
  meus AS (
    SELECT *
    FROM ranked
    WHERE user_id = v_uid
      AND data >= v_month AND data < v_next
  )
  SELECT
    m.id,
    m.processo,
    m.data,
    m.status,
    m.assunto_slug,
    m.atuacao_num,
    GREATEST(0, 6 - m.atuacao_num)::INT AS multiplicador,
    COALESCE((SELECT ap.peso FROM public.assunto_pesos ap
               WHERE ap.slug = m.assunto_slug), 1)::NUMERIC AS peso_assunto,
    CASE m.status
      WHEN 'Concluido' THEN 1.0
      WHEN 'Encaminhado' THEN 0.5
      ELSE 0.0
    END::NUMERIC AS fator_status,
    (
      COALESCE((SELECT ap.peso FROM public.assunto_pesos ap
                 WHERE ap.slug = m.assunto_slug), 1)
      * GREATEST(0, 6 - m.atuacao_num)
      * CASE m.status
          WHEN 'Concluido' THEN 1.0
          WHEN 'Encaminhado' THEN 0.5
          ELSE 0.0
        END
    )::NUMERIC AS pontos
  FROM meus m
  ORDER BY m.data DESC, m.atuacao_num ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_my_score(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_score(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
