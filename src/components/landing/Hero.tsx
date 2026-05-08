import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComunicados,
  formatNumeroComunicado,
} from "@/hooks/use-comunicados";

export function Hero() {
  const { user, loading } = useAuth();
  const isLoggedIn = !!user && !loading;

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
              <a href={isLoggedIn ? "/productivity" : "/login"}>
                {isLoggedIn ? "Ir para o sistema" : "Acessar sistema"}
              </a>
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

        {/* Coluna direita: Comunicados — só pra logados */}
        {isLoggedIn && (
          <div className="relative hidden md:block">
            <ComunicadosCard />
          </div>
        )}
      </div>
    </section>
  );
}

function ComunicadosCard() {
  const { comunicados, loading } = useComunicados({ limit: 3 });

  return (
    <div className="rounded-2xl border border-black/10 bg-surface-muted shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
        <div className="text-sm font-semibold text-primary">Comunicados</div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Recentes
        </span>
      </div>

      <div className="divide-y divide-black/5 px-6">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Carregando...
          </div>
        ) : comunicados.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Nenhum comunicado publicado ainda.
          </div>
        ) : (
          comunicados.map((c) => (
            <a
              key={c.id}
              href={c.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-4 hover:bg-black/[0.02] -mx-6 px-6 transition-colors"
            >
              <div className="text-xs font-medium text-primary">
                {formatNumeroComunicado(c)}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900 line-clamp-2">
                {c.titulo}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
                {c.resumo}
              </p>
              <div className="mt-2 text-xs text-slate-400">
                {formatDateBR(c.data_publicacao)}
              </div>
            </a>
          ))
        )}
      </div>

      <div className="border-t border-black/5 px-6 py-3">
        <a
          href="/comunicados"
          className="rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Ver todos os comunicados &rarr;
        </a>
      </div>
    </div>
  );
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
