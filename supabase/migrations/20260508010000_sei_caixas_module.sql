-- ============================================================
-- Modulo SEI CGRIS — caixas (unidades) da CGRIS no SEI
-- ============================================================
--
-- Tabela sei_caixas armazena cada unidade SEI da CGRIS com:
--   - sigla            (ex: MGI-SGP-DECIPEX-CGRIS-COCON)
--   - nome_sistema     (descricao oficial cadastrada no SEI)
--   - descricao        (texto editavel — "o que e tratado nesta caixa")
--   - ordem            (sort)
--   - ativo            (soft-disable)
--
-- A descricao_sistema e o seed inicial (snapshot do sistema SEI).
-- A descricao e o campo livre que o admin altera para descrever
-- o fluxo de trabalho — "para onde enviar cada demanda".
--
-- RLS:
--   SELECT  -> authenticated
--   INSERT/UPDATE/DELETE -> admin_global

CREATE TABLE IF NOT EXISTS public.sei_caixas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla           TEXT NOT NULL UNIQUE CHECK (length(trim(sigla)) > 0),
  nome_sistema    TEXT NOT NULL CHECK (length(trim(nome_sistema)) > 0),
  descricao       TEXT NOT NULL DEFAULT '',
  ordem           INT  NOT NULL DEFAULT 0,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sei_caixas_ordem_sigla_idx
  ON public.sei_caixas (ordem ASC, sigla ASC);

DROP TRIGGER IF EXISTS trg_sei_caixas_touch ON public.sei_caixas;
CREATE TRIGGER trg_sei_caixas_touch
  BEFORE UPDATE ON public.sei_caixas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.sei_caixas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sei_caixas_select ON public.sei_caixas;
CREATE POLICY sei_caixas_select ON public.sei_caixas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS sei_caixas_insert ON public.sei_caixas;
CREATE POLICY sei_caixas_insert ON public.sei_caixas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin_global'
    )
  );

DROP POLICY IF EXISTS sei_caixas_update ON public.sei_caixas;
CREATE POLICY sei_caixas_update ON public.sei_caixas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin_global'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin_global'
    )
  );

DROP POLICY IF EXISTS sei_caixas_delete ON public.sei_caixas;
CREATE POLICY sei_caixas_delete ON public.sei_caixas
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin_global'
    )
  );

REVOKE ALL ON public.sei_caixas FROM PUBLIC;
REVOKE ALL ON public.sei_caixas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sei_caixas TO authenticated;

-- ============================================================
-- Seed das caixas SEI (snapshot do sistema)
-- ============================================================
INSERT INTO public.sei_caixas (sigla, nome_sistema, ordem) VALUES
  ('MGI-SGP-DECIPEX-CGRIS',         'Coordenação-Geral de Risco e Controle',                       10),
  ('MGI-SGP-DECIPEX-CGRIS-ACORD',   'Serviço de Atendimento aos Acórdãos e às Fiscalizações',      20),
  ('MGI-SGP-DECIPEX-CGRIS-ASSES',   'Serviço de Assessoramento de Risco e Controle',               30),
  ('MGI-SGP-DECIPEX-CGRIS-CEXT',    'Setor de Processos de Controle Extra',                        40),
  ('MGI-SGP-DECIPEX-CGRIS-COCON',   'Coordenação de Demandas de Órgãos de Controle',               50),
  ('MGI-SGP-DECIPEX-CGRIS-CODEJ',   'Coordenação de Demandas Judiciais',                           60),
  ('MGI-SGP-DECIPEX-CGRIS-COINT',   'Serviço de Atendimento ao Controle Interno',                  70),
  ('MGI-SGP-DECIPEX-CGRIS-EADM',    'Equipe Administrativa Bloqueada',                             80),
  ('MGI-SGP-DECIPEX-CGRIS-EATNDR',  'Equipe de Atendimento Rápido',                                90),
  ('MGI-SGP-DECIPEX-CGRIS-ECUMP',   'Equipe de Cumprimento Bloqueada',                             100),
  ('MGI-SGP-DECIPEX-CGRIS-EPRO',    'Equipe de Produtividade',                                     110),
  ('MGI-SGP-DECIPEX-CGRIS-ESUB',    'Equipe de Subsídio',                                          120),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC',   'Serviço de Demandas de Indícios Órgãos de Controle',          130),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC2',  'Serviço de Demandas de Indícios Órgãos de Controle 2',        140),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC3',  'Serviço de Demandas de Indícios Órgãos de Controle 3',        150),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC4',  'Serviço de Demandas de Indícios Órgãos de Controle 4',        160),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC5',  'Serviço de Demandas de Indícios Órgãos de Controle 5',        170),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC6',  'Serviço de Demandas de Indícios Órgãos de Controle 6',        180),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC7',  'Serviço de Demandas de Indícios Órgãos de Controle 7',        190),
  ('MGI-SGP-DECIPEX-CGRIS-INDIC8',  'Serviço de Demandas de Indícios Órgãos de Controle 8',        200),
  ('MGI-SGP-DECIPEX-CGRIS-PADDJ1',  'Setor de Padronização de Demandas Judiciais 1',               210),
  ('MGI-SGP-DECIPEX-CGRIS-PADDJ2',  'Setor de Padronização de Demandas Judiciais 2',               220),
  ('MGI-SGP-DECIPEX-CGRIS-PADDJ3',  'Setor de Padronização de Demandas Judiciais 3',               230),
  ('MGI-SGP-DECIPEX-CGRIS-PADDJ4',  'Setor de Padronização de Demandas Judiciais 4',               240),
  ('MGI-SGP-DECIPEX-CGRIS-RECAD',   'Atendimento a Demanda de Recadastramento AJ',                 250)
ON CONFLICT (sigla) DO UPDATE
  SET nome_sistema = EXCLUDED.nome_sistema,
      ordem        = EXCLUDED.ordem;

NOTIFY pgrst, 'reload schema';
