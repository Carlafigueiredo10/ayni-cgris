import { Card, CardContent } from "@/components/ui/card";
import type { CoordinationKpisRow } from "@/hooks/use-coordination-data";

type Props = {
  kpis: CoordinationKpisRow | null;
  loading?: boolean;
};

export default function CoordinationKpis({ kpis, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs text-muted-foreground">
            Carregando indicadores da coordenação...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!kpis) return null;

  const balanco = kpis.entrada_processos - kpis.saida_processos;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Coordenação no mês
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Entrada
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {kpis.entrada_processos}
            </p>
            <p className="text-xs text-muted-foreground">
              processos novos no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Saída
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {kpis.saida_processos}
            </p>
            <p className="text-xs text-muted-foreground">
              concluídos no mês
              {balanco !== 0 && (
                <span
                  className={
                    balanco > 0 ? "text-destructive ml-1" : "text-emerald-600 ml-1"
                  }
                >
                  ({balanco > 0 ? "+" : ""}
                  {balanco} balanço)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Média por servidor
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {kpis.media_concluidos_servidor ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              concluídos / {kpis.servidores_coordenacao} servidor
              {kpis.servidores_coordenacao === 1 ? "" : "es"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
