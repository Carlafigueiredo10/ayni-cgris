-- Fase do controle (COCON): a etapa em que o processo se encontra
-- quando a natureza eh 'controle'. Necessario porque o status
-- (Concluido / Encaminhado / Solicitada informacao externa) se refere
-- a fase corrente, nao ao processo inteiro: um mesmo processo pode
-- ter Notificacao concluida, depois Defesa, depois Recurso, etc.
--
-- Valores esperados:
--   notificacao | defesa | recurso | solicitacao_informacoes
--
-- Aplica-se somente quando tipo_natureza = 'controle'. Para outras
-- naturezas a coluna fica NULL.

ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS fase TEXT;

CREATE INDEX IF NOT EXISTS idx_registros_fase ON public.registros(fase);

NOTIFY pgrst, 'reload schema';
