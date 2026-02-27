import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Circle } from "lucide-react";

type ModuleItem = {
  title: string;
  desc: string;
  href: string;
  status: "available" | "soon";
};

const modules: ModuleItem[] = [
  {
    title: "Biblioteca de Modelos",
    desc: "Modelos prontos de documentos e formulários para agilizar o trabalho.",
    href: "/biblioteca",
    status: "available",
  },
  {
    title: "Fluxos e Procedimentos",
    desc: "Consulte fluxos de trabalho e procedimentos da coordenação.",
    href: "/solicitacoes",
    status: "soon",
  },
  {
    title: "CGRIS em Números",
    desc: "Indicadores e resultados da atuação em tempo real.",
    href: "/em-numeros",
    status: "available",
  },
  {
    title: "Conheça nossa Equipe",
    desc: "Talentos, habilidades e histórias de cada membro da equipe.",
    href: "/equipe",
    status: "available",
  },
  {
    title: "Sala do Café",
    desc: "Espaço informal para conversas, ideias e conexões.",
    href: "/productivity",
    status: "soon",
  },
  {
    title: "Bem-estar",
    desc: "Recursos e ferramentas para cuidar da saúde física e mental.",
    href: "/wellness",
    status: "available",
  },
];

function loginUrl(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

export function Modules() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="modulos">
      <div className="container">
        <h2
          id="modulos"
          className="text-2xl font-bold text-primary md:text-3xl"
        >
          Módulos
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Módulos disponíveis apenas para usuários autorizados. Acesso mediante
          autenticação.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {modules.map((m) => (
            <Card
              key={m.title}
              className="relative overflow-hidden border border-black/10 bg-white rounded-xl shadow-sm"
            >
              <div
                className={
                  "absolute inset-y-0 left-0 w-1 " +
                  (m.status === "available" ? "bg-primary" : "bg-orange-400")
                }
              />
              <CardContent className="p-6 pl-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      {m.status === "available" ? (
                        <CheckSquare className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 fill-orange-400 text-orange-400" />
                      )}
                      {m.title}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {m.desc}
                    </p>
                  </div>

                  <span
                    className={
                      "shrink-0 rounded-full border px-2.5 py-1 text-xs " +
                      (m.status === "available"
                        ? "border-primary/20 text-primary bg-primary/5"
                        : "border-slate-200 text-slate-500 bg-slate-50")
                    }
                  >
                    {m.status === "available" ? "Disponível" : "Em breve"}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Requer login</span>

                  {m.status === "available" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      asChild
                    >
                      <a href={loginUrl(m.href)}>Acessar</a>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-slate-400"
                      disabled
                    >
                      Indisponível
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
