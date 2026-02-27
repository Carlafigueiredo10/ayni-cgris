import { Card, CardContent } from "@/components/ui/card";

const itens = [
  {
    titulo: "Controle",
    texto: "Gestão estruturada de demandas e fluxos de acompanhamento.",
  },
  {
    titulo: "Judicial",
    texto: "Integração de informações e suporte a decisões estratégicas.",
  },
  {
    titulo: "Inovação",
    texto: "Transformação de processos com foco em eficiência institucional.",
  },
];

export function Atuacao() {
  return (
    <section id="atuacao" className="bg-primary py-16 md:py-20">
      <div className="container">
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          A Atuação
        </h2>
        <p className="mt-2 max-w-2xl text-white/80">
          Três pilares que organizam e tornam previsível a resposta
          institucional às demandas.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {itens.map((item) => (
            <Card
              key={item.titulo}
              className="border border-white/10 bg-white/10 rounded-xl shadow-sm backdrop-blur"
            >
              <CardContent className="p-6">
                <div className="text-lg font-semibold text-white">
                  {item.titulo}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {item.texto}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
