import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamReport } from "@/hooks/use-team-report";
import { useServidoresRanking } from "@/hooks/use-servidores-ranking";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";
import { format } from "date-fns";

const csvHeaders = [
  { label: "Equipe", key: "team_code" },
  { label: "Mes", key: "mes" },
  { label: "Processos", key: "total_processos" },
  { label: "Servidores ativos", key: "servidores_ativos" },
  { label: "Media min/proc", key: "media_minutos_processo" },
  { label: "Total min", key: "total_minutos" },
  { label: "Judicial", key: "qtd_judicial" },
  { label: "Controle", key: "qtd_controle" },
  { label: "Atos", key: "qtd_atos" },
  { label: "Reincidencias", key: "qtd_reincidencias" },
  { label: "Taxa reincidencia %", key: "taxa_reincidencia_pct" },
];

const csvHeadersServidor = [
  { label: "Nome", key: "display_name" },
  { label: "SIAPE", key: "siape" },
  { label: "Email", key: "email" },
  { label: "Equipe", key: "team_code" },
  { label: "Processos", key: "total_processos" },
  { label: "Concluidos", key: "total_concluidos" },
  { label: "Total min", key: "total_minutos" },
  { label: "Judicial", key: "qtd_judicial" },
  { label: "Controle", key: "qtd_controle" },
  { label: "Atos", key: "qtd_atos" },
  { label: "Reincidencias", key: "qtd_reincidencias" },
];

export default function Relatorios() {
  const { isAdmin, isManagerCgris, isManager, profile, loading: authLoading } = useAuth();
  const canAccess = isAdmin || isManagerCgris || isManager;

  const { rows, loading, fetchReport } = useTeamReport();

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("code, name")
        .order("code");
      if (error) throw error;
      return (data ?? []) as { code: string; name: string }[];
    },
  });

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>(
    format(new Date(), "yyyy-MM-01")
  );

  const ranking = useServidoresRanking({
    month: monthFilter,
    team_code: teamFilter || undefined,
    limit: 100,
    enabled: !authLoading && canAccess,
  });

  useEffect(() => {
    if (!authLoading && canAccess) {
      fetchReport(teamFilter || undefined, monthFilter || undefined);
    }
  }, [authLoading, canAccess, teamFilter, monthFilter, fetchReport]);

  if (authLoading) return null;
  if (profile === null) return null;
  if (!canAccess) return <Navigate to="/meu-painel" replace />;

  const totals = rows.reduce(
    (acc, r) => ({
      processos: acc.processos + r.total_processos,
      minutos: acc.minutos + r.total_minutos,
      judicial: acc.judicial + r.qtd_judicial,
      controle: acc.controle + r.qtd_controle,
      atos: acc.atos + r.qtd_atos,
      reincidencias: acc.reincidencias + r.qtd_reincidencias,
    }),
    {
      processos: 0,
      minutos: 0,
      judicial: 0,
      controle: 0,
      atos: 0,
      reincidencias: 0,
    }
  );

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Relatorio Gerencial — CGRIS", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Periodo: ${monthFilter || "Todos"} | Equipe: ${teamFilter?.toUpperCase() || "Todas"}`,
      14,
      22
    );
    autoTable(doc, {
      head: [
        [
          "Equipe",
          "Mes",
          "Processos",
          "Servidores",
          "Media min",
          "Total min",
          "Judicial",
          "Controle",
          "Atos",
          "Reinc.",
          "% Reinc.",
        ],
      ],
      body: rows.map((r) => [
        r.team_code.toUpperCase(),
        r.mes,
        r.total_processos,
        r.servidores_ativos,
        r.media_minutos_processo ?? "N/D",
        r.total_minutos,
        r.qtd_judicial,
        r.qtd_controle,
        r.qtd_atos,
        r.qtd_reincidencias,
        r.taxa_reincidencia_pct != null ? r.taxa_reincidencia_pct + "%" : "N/D",
      ]),
      startY: 28,
      styles: { fontSize: 8 },
    });
    doc.save("relatorio_cgris.pdf");
  };

  const exportRankingPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Indicadores por Servidor — CGRIS", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Periodo: ${monthFilter || "—"} | Equipe: ${teamFilter?.toUpperCase() || "Todas"}`,
      14,
      22
    );
    autoTable(doc, {
      head: [
        [
          "Nome",
          "SIAPE",
          "Equipe",
          "Processos",
          "Concluidos",
          "Min",
          "Jud.",
          "Ctrl.",
          "Atos",
          "Reinc.",
        ],
      ],
      body: ranking.rows.map((r) => [
        r.display_name ?? r.email ?? "-",
        r.siape ?? "-",
        r.team_code?.toUpperCase() ?? "-",
        r.total_processos,
        r.total_concluidos,
        r.total_minutos,
        r.qtd_judicial,
        r.qtd_controle,
        r.qtd_atos,
        r.qtd_reincidencias,
      ]),
      startY: 28,
      styles: { fontSize: 8 },
    });
    doc.save("indicadores_servidores.pdf");
  };

  const chartData = rows.map((r) => ({
    equipe: r.team_code.toUpperCase(),
    processos: r.total_processos,
  }));

  const showTeamFilter = isAdmin || isManagerCgris;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Relatorios gerenciais
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicadores detalhados — restritos a gestao
          </p>
        </div>
      </div>

      {/* Filtros (compartilhados pelas duas abas) */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Mes
          </label>
          <input
            type="month"
            value={monthFilter.slice(0, 7)}
            onChange={(e) => setMonthFilter(e.target.value + "-01")}
            className="block border rounded-md h-9 px-3 bg-background text-sm"
          />
        </div>
        {showTeamFilter && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Equipe
            </label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="block border rounded-md h-9 px-3 bg-background text-sm"
            >
              <option value="">Todas</option>
              {teams.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Tabs defaultValue="equipe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipe">Por equipe</TabsTrigger>
          <TabsTrigger value="servidor">Por servidor</TabsTrigger>
        </TabsList>

        {/* ==================== ABA POR EQUIPE ==================== */}
        <TabsContent value="equipe" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total processos
                </p>
                <p className="text-2xl font-bold">{totals.processos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total minutos
                </p>
                <p className="text-2xl font-bold">{totals.minutos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Por natureza
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      Judicial
                    </span>
                    <span className="font-semibold tabular-nums">
                      {totals.judicial}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent"></span>
                      Controle
                    </span>
                    <span className="font-semibold tabular-nums">
                      {totals.controle}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                      Atos
                    </span>
                    <span className="font-semibold tabular-nums">
                      {totals.atos}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Reincidencias
                </p>
                <p className="text-2xl font-bold">{totals.reincidencias}</p>
              </CardContent>
            </Card>
          </div>

          {/* Grafico */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Processos por equipe
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="equipe" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="processos" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            i % 2 === 0
                              ? "hsl(var(--primary))"
                              : "hsl(var(--accent))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabela detalhada */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Detalhamento por equipe/mes
              </CardTitle>
              <div className="flex gap-2">
                <CSVLink
                  data={rows}
                  headers={csvHeaders}
                  filename="relatorio_cgris.csv"
                >
                  <Button variant="outline" size="sm">
                    CSV
                  </Button>
                </CSVLink>
                <Button variant="outline" size="sm" onClick={exportPDF}>
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm py-4">
                  Carregando...
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Equipe</th>
                        <th className="pb-2 font-medium">Mes</th>
                        <th className="pb-2 font-medium">Processos</th>
                        <th className="pb-2 font-medium">Servidores</th>
                        <th className="pb-2 font-medium">Media min</th>
                        <th className="pb-2 font-medium">Judicial</th>
                        <th className="pb-2 font-medium">Controle</th>
                        <th className="pb-2 font-medium">Atos</th>
                        <th className="pb-2 font-medium">Reinc. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{r.team_code.toUpperCase()}</td>
                          <td className="py-2">{r.mes}</td>
                          <td className="py-2">{r.total_processos}</td>
                          <td className="py-2">{r.servidores_ativos}</td>
                          <td className="py-2">
                            {r.media_minutos_processo ?? "N/D"}
                          </td>
                          <td className="py-2">{r.qtd_judicial}</td>
                          <td className="py-2">{r.qtd_controle}</td>
                          <td className="py-2">{r.qtd_atos}</td>
                          <td className="py-2">
                            {r.taxa_reincidencia_pct != null
                              ? r.taxa_reincidencia_pct + "%"
                              : "N/D"}
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && !loading && (
                        <tr>
                          <td
                            className="py-8 text-center text-muted-foreground"
                            colSpan={9}
                          >
                            Sem dados para o periodo selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ABA POR SERVIDOR ==================== */}
        <TabsContent value="servidor" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-medium">
                  Indicadores operacionais por servidor
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ranking.rows.length} servidores com registros no periodo
                  {!showTeamFilter && " (sua equipe)"}
                </p>
              </div>
              <div className="flex gap-2">
                <CSVLink
                  data={ranking.rows}
                  headers={csvHeadersServidor}
                  filename="indicadores_servidores.csv"
                >
                  <Button variant="outline" size="sm">
                    CSV
                  </Button>
                </CSVLink>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportRankingPDF}
                  disabled={ranking.rows.length === 0}
                >
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ranking.loading ? (
                <p className="text-muted-foreground text-sm py-4">
                  Carregando...
                </p>
              ) : ranking.rows.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Sem registros no periodo.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium w-10">#</th>
                        <th className="pb-2 font-medium">Servidor</th>
                        <th className="pb-2 font-medium">SIAPE</th>
                        <th className="pb-2 font-medium">Equipe</th>
                        <th className="pb-2 font-medium text-right">
                          Processos
                        </th>
                        <th className="pb-2 font-medium text-right">
                          Concluidos
                        </th>
                        <th className="pb-2 font-medium text-right">Min</th>
                        <th className="pb-2 font-medium text-right">Jud.</th>
                        <th className="pb-2 font-medium text-right">Ctrl.</th>
                        <th className="pb-2 font-medium text-right">Atos</th>
                        <th className="pb-2 font-medium text-right">Reinc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.rows.map((r, i) => (
                        <tr
                          key={r.user_id}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 text-muted-foreground tabular-nums">
                            {i + 1}
                          </td>
                          <td className="py-2">
                            <div className="font-medium">
                              {r.display_name || r.email || "—"}
                            </div>
                            {r.display_name && (
                              <div className="text-xs text-muted-foreground">
                                {r.email}
                              </div>
                            )}
                          </td>
                          <td className="py-2 tabular-nums">
                            {r.siape || "—"}
                          </td>
                          <td className="py-2">
                            {r.team_code?.toUpperCase() || "—"}
                          </td>
                          <td className="py-2 text-right tabular-nums font-semibold">
                            {r.total_processos}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {r.total_concluidos}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {r.total_minutos}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {r.qtd_judicial}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {r.qtd_controle}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {r.qtd_atos}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {r.qtd_reincidencias}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
