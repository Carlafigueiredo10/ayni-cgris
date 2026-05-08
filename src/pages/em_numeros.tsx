import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useCgrisOverview } from "@/hooks/use-cgris-overview";
import DiagonalLines from "@/components/ui/diagonal-lines";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const EmNumeros = () => {
  const { overview, history, loading } = useCgrisOverview();

  const mesLabel = overview?.mes
    ? format(parseISO(overview.mes), "MMMM 'de' yyyy", { locale: ptBR })
    : "—";

  const historicoChart = history.map((h) => ({
    mes: format(parseISO(h.mes), "MMM/yy", { locale: ptBR }),
    processos: h.total_processos,
    concluidos: h.total_concluidos,
    reincidencias: h.qtd_reincidencias,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CGRIS em Numeros</h1>
        <p className="text-muted-foreground mt-1 capitalize">
          Indicadores agregados — {mesLabel}
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando dados...</p>
      ) : !overview ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Sem dados consolidados para o mes atual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Servidores ativos no mes
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-bold text-foreground">
                  {overview.total_servidores_no_mes}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {overview.total_servidores_cadastrados} cadastrados
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Processos trabalhados
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-bold text-foreground">
                  {overview.total_processos}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Concluidos
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-bold text-foreground">
                  {overview.total_concluidos}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.total_processos > 0
                    ? Math.round(
                        (overview.total_concluidos / overview.total_processos) *
                          100
                      ) + "% do total"
                    : "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de reincidencia
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-bold text-foreground">
                  {overview.taxa_reincidencia_pct != null
                    ? overview.taxa_reincidencia_pct + "%"
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.qtd_reincidencias} casos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribuicoes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por natureza</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Judicial
                    </span>
                    <span className="font-semibold tabular-nums">
                      {overview.qtd_judicial}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent"></span>
                      Controle
                    </span>
                    <span className="font-semibold tabular-nums">
                      {overview.qtd_controle}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
                      Atos
                    </span>
                    <span className="font-semibold tabular-nums">
                      {overview.qtd_atos}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por coordenacao</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      COCON
                    </span>
                    <span className="font-semibold tabular-nums">
                      {overview.cocon_visivel
                        ? overview.cocon_processos
                        : "—"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent"></span>
                      CODEJ
                    </span>
                    <span className="font-semibold tabular-nums">
                      {overview.codej_visivel
                        ? overview.codej_processos
                        : "—"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
                      NATOS
                    </span>
                    <span className="font-semibold tabular-nums">
                      {overview.natos_visivel
                        ? overview.natos_processos
                        : "—"}
                    </span>
                  </li>
                </ul>
                {(!overview.cocon_visivel ||
                  !overview.codej_visivel ||
                  !overview.natos_visivel) && (
                  <p className="text-xs text-muted-foreground mt-3">
                    "—" indica coordenacao com menos de 3 servidores ativos no
                    periodo (privacidade).
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Evolucao mensal */}
          {historicoChart.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Evolucao mensal (ultimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicoChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="processos"
                      stroke="hsl(var(--primary))"
                      name="Processos"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="concluidos"
                      stroke="hsl(var(--accent))"
                      name="Concluidos"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="reincidencias"
                      stroke="hsl(var(--destructive))"
                      name="Reincidencias"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default EmNumeros;
