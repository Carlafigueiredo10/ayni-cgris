-- PR 3: Encaminhamento, trilha (controle) e faixas de justificativa
-- - encaminhado_para: area destino quando status = 'Encaminhado'
--                     (cgris_interno | aj | digep | outros)
-- - encaminhado_para_outros: descricao livre quando encaminhado_para = 'outros'
-- - trilha: trilha (texto livre por enquanto; sera convertido em select quando
--           a lista oficial de trilhas for fornecida)
-- - acao_coletiva_faixa: faixa quando motivo_tempo = 'acao_coletiva'
--                         (2_10 | 10_40 | 40_100 | mais_100)
-- - lote_indicios_faixa: faixa quando motivo_tempo = 'lote_indicios'
--                         (ate_100 | 100_500 | mais_500)

ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS encaminhado_para         TEXT,
  ADD COLUMN IF NOT EXISTS encaminhado_para_outros  TEXT,
  ADD COLUMN IF NOT EXISTS trilha                   TEXT,
  ADD COLUMN IF NOT EXISTS acao_coletiva_faixa      TEXT,
  ADD COLUMN IF NOT EXISTS lote_indicios_faixa      TEXT;

CREATE INDEX IF NOT EXISTS idx_registros_trilha ON public.registros(trilha);

NOTIFY pgrst, 'reload schema';
