const passos = [
  {
    n: "01",
    titulo: "Registrar demanda",
    texto: "Entrada padronizada com categorização e prioridade.",
  },
  {
    n: "02",
    titulo: "Acompanhar indicadores",
    texto: "Visão de andamento, prazos e pontos de atenção.",
  },
  {
    n: "03",
    titulo: "Apoiar decisões com transparência",
    texto: "Histórico e evidências para governança e alinhamento.",
  },
];

export function ComoFunciona() {
  return (
    <section className="bg-surface-muted py-16 md:py-20">
      <div className="container">
        <h2 className="text-2xl font-bold text-primary md:text-3xl">
          Como funciona
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Método simples, previsível e auditável — sem depender de memória ou
          improviso.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {passos.map((p) => (
            <div key={p.n} className="flex items-start gap-6">
              <div className="text-4xl font-bold text-primary/10">{p.n}</div>
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {p.titulo}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
