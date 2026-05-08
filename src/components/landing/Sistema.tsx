import { Card, CardContent } from "@/components/ui/card";
import { LlamaOutline } from "./LlamaOutline";
import { Scale, Gavel } from "lucide-react";

const eixos = [
  {
    icon: Scale,
    titulo: "Controle",
    texto:
      "Atendimento aos órgãos de controle — acórdãos, fiscalizações e indícios.",
  },
  {
    icon: Gavel,
    titulo: "Judicial",
    texto:
      "Demandas judiciais com padronização, cumprimento e subsídio técnico para resposta institucional.",
  },
];

const entregas = [
  {
    titulo: "Centralização de demandas",
    texto: "Registro e organização única das solicitações e encaminhamentos.",
  },
  {
    titulo: "Padronização de fluxos",
    texto: "Etapas consistentes com rastreabilidade e redução de retrabalho.",
  },
  {
    titulo: "Transparência operacional",
    texto: "Visibilidade de status, prazos e responsáveis com histórico.",
  },
  {
    titulo: "Apoio à tomada de decisão",
    texto: "Indicadores e visão consolidada para priorização e governança.",
  },
];

export function Sistema() {
  return (
    <section id="sistema" className="relative overflow-hidden bg-primary py-16 md:py-24">
      {/* Lhama de contorno — referencia ao mascote da estetica antiga */}
      <LlamaOutline
        className="pointer-events-none absolute -right-6 top-6 hidden h-56 w-56 text-white/15 md:block lg:-right-2 lg:h-72 lg:w-72"
      />

      <div className="container relative">
        {/* Topo — filosofia */}
        <div className="max-w-3xl">
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/80">
            Sistema Ayni
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            Reciprocidade que vira previsibilidade.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/80 md:text-lg">
            Ayni é um princípio andino de cooperação: o que entra retorna em
            forma de cuidado mútuo. Aqui, traduz-se em fluxos rastreáveis,
            decisões sustentadas e uma resposta institucional que não depende
            de memória individual.
          </p>
        </div>

        {/* Como atuamos — eixos reais */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            Como atuamos
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {eixos.map((e) => (
              <Card
                key={e.titulo}
                className="border border-white/15 bg-white/5 rounded-xl shadow-sm backdrop-blur"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                      <e.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {e.titulo}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">
                    {e.texto}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* O que entrega */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            O que o sistema entrega
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {entregas.map((e) => (
              <div
                key={e.titulo}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <div className="text-sm font-semibold text-white">
                  {e.titulo}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                  {e.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
