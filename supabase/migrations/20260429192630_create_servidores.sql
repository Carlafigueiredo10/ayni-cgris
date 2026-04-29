-- Tabela: servidores (roster institucional)
-- Independente de profiles (que so existe quando alguem loga)

CREATE TABLE public.servidores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  siape      TEXT,
  email      TEXT,
  team_id    UUID REFERENCES public.teams(id),
  presencial BOOLEAN NOT NULL DEFAULT FALSE,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_servidores_siape   ON public.servidores(siape);
CREATE INDEX idx_servidores_email   ON public.servidores(email);
CREATE INDEX idx_servidores_team_id ON public.servidores(team_id);
CREATE INDEX idx_servidores_ativo   ON public.servidores(ativo);

-- RLS
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado le o roster
CREATE POLICY "servidores_select_auth" ON public.servidores
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Apenas admin_global escreve
CREATE POLICY "servidores_insert_admin" ON public.servidores
  FOR INSERT WITH CHECK ((select public.get_my_role()) = 'admin_global');

CREATE POLICY "servidores_update_admin" ON public.servidores
  FOR UPDATE USING ((select public.get_my_role()) = 'admin_global');

CREATE POLICY "servidores_delete_admin" ON public.servidores
  FOR DELETE USING ((select public.get_my_role()) = 'admin_global');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
