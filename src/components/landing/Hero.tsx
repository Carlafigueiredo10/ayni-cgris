import { Button } from "@/components/ui/button";
import type { Comunicado } from "@/lib/comunicado";

// TODO: substituir por dados reais (Supabase, API, etc.)
const comunicados: Comunicado[] = [
  {
    id: "1",
    titulo: "Novo fluxo de demandas de controle",
    mensagem: "A partir de março, todas as demandas seguem o fluxo atualizado.",
    data: "27/02/2026",
  },
  {
    id: "2",
    titulo: "Atualização do sistema Ayni",
    mensagem: "Módulo de indicadores disponível para testes internos.",
    data: "25/02/2026",
  },
  {
    id: "3",
    titulo: "Reunião de alinhamento",
    mensagem: "Próxima reunião da equipe agendada para 03/03 às 14h.",
    data: "24/02/2026",
  },
];

export function Hero() {
  return (
    <section id="inicio" className="container py-16 md:py-20">
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* Coluna esquerda: conteúdo */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
            Sistema Ayni
          </h1>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            Plataforma estratégica da CGRIS
          </p>

          <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
            Estrutura para inovar na coordenação estratégica de demandas de
            Controle e Judicial.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="bg-accent text-accent-foreground font-semibold hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              asChild
            >
              <a href="/login">Acessar sistema</a>
            </Button>

            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              asChild
            >
              <a href="/#atuacao">Conhecer a atuação</a>
            </Button>
          </div>

          <div className="mt-6 text-sm text-slate-500">
            <p>Acesso restrito a usuários autorizados.</p>
            <p>Autenticação via Supabase.</p>
          </div>
        </div>

        {/* Coluna direita: Comunicados */}
        <div className="relative hidden md:block">
          <div className="rounded-2xl border border-black/10 bg-surface-muted shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div className="text-sm font-semibold text-primary">
                Comunicados
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Recentes
              </span>
            </div>

            <div className="divide-y divide-black/5 px-6">
              {comunicados.map((c) => (
                <div key={c.id} className="py-4">
                  <div className="text-sm font-medium text-slate-900">
                    {c.titulo}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {c.mensagem}
                  </p>
                  <div className="mt-2 text-xs text-slate-400">{c.data}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-black/5 px-6 py-3">
              <a
                href="https://drive.google.com/drive/folders/SEU_ID_AQUI"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Ver todos os comunicados &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
