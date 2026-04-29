-- PR 2: Bloco judicial - classificacao, assunto e multa
-- - classificacao: 'acordao_tcu' | 'diligencia' | 'indicio'
-- - acordao_tcu_tipo: 'oitiva' | 'responsabilizacao' (so quando classificacao = 'acordao_tcu')
-- - assunto_judicial: slug do assunto (lista depende de tipo_processo) ou 'outros'
-- - assunto_judicial_outros: descricao livre quando assunto_judicial = 'outros'
-- - multa: boolean indicando se ha multa associada
-- - multa_destinatario: 'uniao' | 'pessoal'
-- - multa_periodicidade: 'dia' | 'total'
-- - multa_faixa: slug da faixa (5 valores ficticios por enquanto)

ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS classificacao            TEXT,
  ADD COLUMN IF NOT EXISTS acordao_tcu_tipo         TEXT,
  ADD COLUMN IF NOT EXISTS assunto_judicial         TEXT,
  ADD COLUMN IF NOT EXISTS assunto_judicial_outros  TEXT,
  ADD COLUMN IF NOT EXISTS multa                    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS multa_destinatario       TEXT,
  ADD COLUMN IF NOT EXISTS multa_periodicidade      TEXT,
  ADD COLUMN IF NOT EXISTS multa_faixa              TEXT;

NOTIFY pgrst, 'reload schema';
