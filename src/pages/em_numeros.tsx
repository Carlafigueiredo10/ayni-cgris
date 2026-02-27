import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle, Users, Activity, Clock } from "lucide-react";
import { useCoordinationData } from "@/hooks/use-coordination-data";
import DiagonalLines from "@/components/ui/diagonal-lines";

const EmNumeros = () => {
  const { teamSummary, personalStats, loading } = useCoordinationData();

  const ts = teamSummary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          CGRIS em Numeros
        </h1>
        <p className="text-muted-foreground mt-1">
          Indicadores agregados da sua coordenacao — mes atual
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando dados...</p>
      ) : !ts ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Sem dados da equipe para o mes atual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs da equipe */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de processos
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-bold text-foreground">
                  {ts.total_processos}
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
                  {ts.qtd_concluidos}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Media por processo
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-bold text-foreground">
                  {ts.media_minutos != null ? ts.media_minutos + " min" : "N/D"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ts.media_minutos == null && "menos de 3 servidores ativos"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <DiagonalLines />
              <CardHeader className="relative flex flex-row items-center gap-2 pb-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Distribuicao
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-lg font-bold text-foreground">
                  {ts.qtd_judicial} judicial
                </p>
                <p className="text-lg font-bold text-foreground">
                  {ts.qtd_controle} controle
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparacao pessoal vs equipe */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Seu desempenho vs coordenacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Seus processos
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {personalStats.total}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sua media
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {personalStats.media} min
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Media da coordenacao
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {ts.media_minutos != null ? ts.media_minutos + " min" : "N/D"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EmNumeros;
