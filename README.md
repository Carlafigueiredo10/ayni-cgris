# Ayni-CGRIS

Plataforma de gestão de tempo e produtividade da CGRIS/DECIPEX/MGI.

## Stack

Vite + React 18 + TypeScript + Tailwind + shadcn/ui. Backend em Supabase (auth, RLS, RPCs). Chat IA via Express (`server.js`) proxiando OpenAI.

## Rodar local

```sh
npm install
npm run dev      # http://localhost:8080
```

Variáveis de ambiente (criar `.env` na raiz):

```
VITE_SUPABASE_URL=https://uprcgywrotmabwnyorur.supabase.co
VITE_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...                # só pra rodar o server.js do chat
ALLOWED_ORIGINS=http://localhost:8080
```

## Estrutura

```
src/
  pages/         rotas (login, productivity, admin, relatorios, ...)
  components/    UI (shadcn em ui/, landing/, productivity/)
  contexts/      AuthContext (sessão + perfil)
  hooks/         use-registros, use-admin, use-team-report
  layouts/       PrivateLayout (header + TeamGuard)
supabase/
  migrations/    schema versionado (extraído do banco em 2026-04-29)
```

## Schema

O schema do banco vive em `supabase/migrations/`. Mudanças no Supabase devem ser feitas como nova migration, não direto pelo Dashboard.

## Deploy

Vercel (`vercel.json`) e Azure Static Web Apps (`.github/workflows/`). Push em `main` deploya automaticamente.
