import { Card, CardContent } from "@/components/ui/card";

const cards = [
  {
    titulo: "Centralização de demandas",
    texto:
      "Registro e organização única das solicitações e encaminhamentos.",
  },
  {
    titulo: "Padronização de fluxos",
    texto:
      "Etapas consistentes com rastreabilidade e redução de retrabalho.",
  },
  {
    titulo: "Transparência operacional",
    texto:
      "Visibilidade de status, prazos e responsáveis com histórico.",
  },
  {
    titulo: "Apoio à tomada de decisão",
    texto:
      "Indicadores e visão consolidada para priorização e governança.",
  },
];

export function Sistema() {
  return (
    <section id="sistema" className="container py-16 md:py-20">
      <h2 className="text-2xl font-bold text-primary md:text-3xl">
        O Sistema Ayni
      </h2>
      <p className="mt-2 max-w-2xl text-slate-600">
        Uma plataforma para estruturar, acompanhar e sustentar decisões com
        previsibilidade.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <Card
            key={c.titulo}
            className="border border-primary/20 bg-white rounded-xl shadow-sm"
          >
            <CardContent className="p-6">
              <div className="text-base font-semibold text-slate-900">
                {c.titulo}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {c.texto}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
