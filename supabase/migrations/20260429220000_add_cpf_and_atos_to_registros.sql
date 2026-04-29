-- PR 1: campos CPF e Atos de pessoal em registros
-- - cpf: CPF (somente digitos) vinculado ao registro, validado no client
-- - tipo_ato: 'pensao' | 'aposentadoria' | 'administrativo' (quando tipo_natureza = 'atos')
-- - subtipo_ato: sub-tipo dependente (nova_concessao, revisao, diligencia, devolucao, judicial,
--                                    levantamento_indicador, busca_processo, triagem_planilha, anexo_diligencia)

ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS cpf         TEXT,
  ADD COLUMN IF NOT EXISTS tipo_ato    TEXT,
  ADD COLUMN IF NOT EXISTS subtipo_ato TEXT;

CREATE INDEX IF NOT EXISTS idx_registros_cpf ON public.registros(cpf);

NOTIFY pgrst, 'reload schema';
