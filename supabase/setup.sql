-- =============================================================================
-- AYNI CGRIS — Setup completo do banco de dados
-- =============================================================================
-- Este arquivo é IDEMPOTENTE: pode ser rodado múltiplas vezes sem erro.
-- Cole no Supabase Dashboard → SQL Editor → Run.
--
-- ANTES DE RODAR: execute  \d public.registros  para confirmar que as colunas
-- user_id e data existem com esses nomes. Se não, ajuste as policies/triggers.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0) Extensão (garante gen_random_uuid)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ---------------------------------------------------------------------------
-- 1) Tabela: teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- 2) Tabela: profiles (extensão de auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT,
  team_id    UUID REFERENCES public.teams(id),
  role       TEXT NOT NULL DEFAULT 'member'
               CHECK (role IN ('member', 'manager')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- team_id = NULL → "aguardando atribuição de equipe"
-- CHECK constraint (não enum — mais fácil de alterar depois)


-- ---------------------------------------------------------------------------
-- 3) Adicionar team_id na tabela registros existente
-- ---------------------------------------------------------------------------
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);


-- ===========================================================================
-- TRIGGERS
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 4) Trigger: auto-create profile no signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 5) Trigger: sincronizar team_id em registros
-- ---------------------------------------------------------------------------
-- O frontend NÃO precisa enviar team_id.
-- O trigger preenche automaticamente a partir do profile do usuário.
-- Garante consistência mesmo se o frontend tiver bug.

CREATE OR REPLACE FUNCTION public.sync_team_id_on_registro()
RETURNS TRIGGER AS $$
BEGIN
  NEW.team_id := (SELECT team_id FROM public.profiles WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_team_id_on_registro ON public.registros;
CREATE TRIGGER set_team_id_on_registro
  BEFORE INSERT OR UPDATE ON public.registros
  FOR EACH ROW EXECUTE FUNCTION public.sync_team_id_on_registro();


-- ===========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 6a) RLS: profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_manager" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Gestor vê todos os profiles
CREATE POLICY "profiles_select_manager" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
  );

-- Só edita próprio perfil. role e team_id ficam TRAVADOS.
-- IS NOT DISTINCT FROM lida corretamente com NULLs.
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND team_id IS NOT DISTINCT FROM (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---------------------------------------------------------------------------
-- 6b) RLS: teams
-- ---------------------------------------------------------------------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select_auth" ON public.teams;

-- Qualquer autenticado pode ver equipes
CREATE POLICY "teams_select_auth" ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ---------------------------------------------------------------------------
-- 6c) RLS: registros
-- ---------------------------------------------------------------------------
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registros_select_own" ON public.registros;
DROP POLICY IF EXISTS "registros_select_manager" ON public.registros;
DROP POLICY IF EXISTS "registros_insert_own" ON public.registros;
DROP POLICY IF EXISTS "registros_update_own" ON public.registros;
DROP POLICY IF EXISTS "registros_delete_own" ON public.registros;

-- Próprios registros
CREATE POLICY "registros_select_own" ON public.registros
  FOR SELECT USING (user_id = auth.uid());

-- Gestor vê todos
CREATE POLICY "registros_select_manager" ON public.registros
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
  );

-- Inserir apenas próprio + precisa ter equipe atribuída
CREATE POLICY "registros_insert_own" ON public.registros
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND team_id IS NOT NULL)
  );

-- Editar apenas próprio
CREATE POLICY "registros_update_own" ON public.registros
  FOR UPDATE USING (user_id = auth.uid());

-- Deletar apenas próprio
CREATE POLICY "registros_delete_own" ON public.registros
  FOR DELETE USING (user_id = auth.uid());


-- ===========================================================================
-- ÍNDICES (performance)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_registros_user_id ON public.registros(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_team_id ON public.registros(team_id);
CREATE INDEX IF NOT EXISTS idx_registros_data    ON public.registros(data);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id  ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role     ON public.profiles(role);


-- ===========================================================================
-- FLUXO DE ATRIBUIÇÃO PÓS-SIGNUP
-- ===========================================================================
--
-- 1. Usuário faz signup → trigger cria profile (role='member', team_id=NULL)
-- 2. App detecta team_id=NULL → mostra "Aguardando atribuição de equipe"
-- 3. Admin vai ao Supabase Dashboard → Table Editor → profiles
--    → atribui team_id (seleciona equipe) e role ('manager' se for gestor)
-- 4. Usuário recarrega → team_id preenchido → acesso completo liberado
--
-- Para criar uma equipe inicial:
--   INSERT INTO public.teams (name) VALUES ('CGRIS');
--
-- Para atribuir um usuário:
--   UPDATE public.profiles
--   SET team_id = '<uuid-da-equipe>', role = 'manager'
--   WHERE email = 'gestor@exemplo.gov.br';


-- ===========================================================================
-- CHECKLIST DE TESTES MANUAIS (RLS)
-- ===========================================================================
--
-- PREPARAÇÃO:
--   1. Criar 2 usuários de teste (signup normal no app)
--   2. Via Supabase Dashboard: criar 1 team
--        INSERT INTO public.teams (name) VALUES ('Equipe Teste');
--   3. Atribuir ambos ao mesmo team
--   4. Marcar 1 como role='manager', outro fica 'member'
--   5. Cada um insere pelo menos 1 registro pelo app
--
-- TESTES MEMBER:
--   #1  Member SEM equipe tenta inserir registro
--       → Esperado: ❌ Bloqueado (INSERT policy exige team_id NOT NULL)
--
--   #2  Member COM equipe insere registro
--       → Esperado: ✅ Funciona, team_id preenchido automaticamente pelo trigger
--
--   #3  Member faz SELECT em registros
--       → Esperado: ✅ Vê APENAS seus registros
--
--   #4  Member tenta UPDATE no registro de outro usuário
--       → Esperado: ❌ Bloqueado (UPDATE policy: user_id = auth.uid())
--
--   #5  Member tenta DELETE no registro de outro usuário
--       → Esperado: ❌ Bloqueado (DELETE policy: user_id = auth.uid())
--
--   #6  Member tenta UPDATE em profiles mudando role para 'manager'
--       → Esperado: ❌ role NÃO muda (WITH CHECK bloqueia)
--
--   #7  Member faz SELECT em profiles
--       → Esperado: ✅ Vê APENAS seu próprio perfil
--
-- TESTES MANAGER:
--   #8  Manager faz SELECT em registros
--       → Esperado: ✅ Vê registros de TODOS os usuários
--
--   #9  Manager faz SELECT em profiles
--       → Esperado: ✅ Vê perfis de TODOS os usuários
--
--   #10 Manager tenta INSERT com user_id de outro usuário
--       → Esperado: ❌ Bloqueado (user_id deve = auth.uid())
--
--   #11 Manager tenta UPDATE registro de outro usuário
--       → Esperado: ❌ Bloqueado (UPDATE é só próprio)
--
-- TESTES DE TRIGGER:
--   #12 Novo signup → verificar tabela profiles
--       → Esperado: ✅ Profile criado com role='member', team_id=NULL
--
--   #13 Inserir registro SEM enviar team_id no payload
--       → Esperado: ✅ team_id preenchido automaticamente pelo trigger
--
-- TESTE DE IDEMPOTÊNCIA:
--   #14 Rodar este arquivo SQL inteiro de novo
--       → Esperado: ✅ Nenhum erro (DROP IF EXISTS + ON CONFLICT + CREATE IF NOT EXISTS)
