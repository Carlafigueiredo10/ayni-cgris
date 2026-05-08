-- Permite que gestores (manager_cgris, manager_team) editem
-- descricao e responsavel das caixas SEI. Estrutura (INSERT/DELETE)
-- continua restrita ao admin_global.

DROP POLICY IF EXISTS sei_caixas_update ON public.sei_caixas;
CREATE POLICY sei_caixas_update ON public.sei_caixas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_global', 'manager_cgris', 'manager_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_global', 'manager_cgris', 'manager_team')
    )
  );

NOTIFY pgrst, 'reload schema';
