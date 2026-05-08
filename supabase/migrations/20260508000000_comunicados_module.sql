-- ============================================================
-- Modulo de comunicados
-- ============================================================
--
-- Tabela comunicados armazena metadados (numero, ano, titulo,
-- resumo, link do Drive, data, autor). O arquivo em si fica no
-- Google Drive — aqui so guardamos a referencia.
--
-- RLS:
--   SELECT  -> authenticated  (qualquer servidor logado)
--   INSERT/UPDATE/DELETE -> admin_global

CREATE TABLE IF NOT EXISTS public.comunicados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          INT  NOT NULL CHECK (numero > 0),
  ano             INT  NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  titulo          TEXT NOT NULL CHECK (length(trim(titulo)) > 0),
  resumo          TEXT NOT NULL CHECK (length(trim(resumo)) > 0),
  drive_url       TEXT NOT NULL CHECK (drive_url ~* '^https?://'),
  data_publicacao DATE NOT NULL DEFAULT current_date,
  autor_setor     TEXT NOT NULL DEFAULT 'Produtividade, Dados e Comunicação/CGRIS',
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (numero, ano)
);

CREATE INDEX IF NOT EXISTS comunicados_ano_numero_idx
  ON public.comunicados (ano DESC, numero DESC);

CREATE INDEX IF NOT EXISTS comunicados_data_publicacao_idx
  ON public.comunicados (data_publicacao DESC);

DROP TRIGGER IF EXISTS trg_comunicados_touch ON public.comunicados;
CREATE TRIGGER trg_comunicados_touch
  BEFORE UPDATE ON public.comunicados
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comunicados_select ON public.comunicados;
CREATE POLICY comunicados_select ON public.comunicados
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS comunicados_insert ON public.comunicados;
CREATE POLICY comunicados_insert ON public.comunicados
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin_global'
    )
  );

DROP POLICY IF EXISTS comunicados_update ON public.comunicados;
CREATE POLICY comunicados_update ON public.comunicados
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

DROP POLICY IF EXISTS comunicados_delete ON public.comunicados;
CREATE POLICY comunicados_delete ON public.comunicados
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin_global'
    )
  );

REVOKE ALL ON public.comunicados FROM PUBLIC;
REVOKE ALL ON public.comunicados FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comunicados TO authenticated;

NOTIFY pgrst, 'reload schema';
