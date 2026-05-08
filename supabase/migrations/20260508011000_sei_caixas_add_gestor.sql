-- Adiciona campo gestor_responsavel a sei_caixas
ALTER TABLE public.sei_caixas
  ADD COLUMN IF NOT EXISTS gestor_responsavel TEXT NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
