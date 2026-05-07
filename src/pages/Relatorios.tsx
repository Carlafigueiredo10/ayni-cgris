import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamReport, type TeamReportRow } from "@/hooks/use-team-report";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  { label: "Reincidencias", key: "qtd_reincidencias" },
  { label: "Taxa reincidencia %", key: "taxa_reincidencia_pct" },
];

export default function Relatorios() {
  const { isAdmin, isManager, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (!authLoading && (isAdmin || isManager)) {
      fetchReport(teamFilter || undefined, monthFilter || undefined);
    }
  }, [authLoading, isAdmin, isManager, teamFilter, monthFilter, fetchReport]);

  if (authLoading) return null;
  if (!isAdmin && !isManager) return <Navigate to="/productivity" replace />;

  const totals = rows.reduce(
    (acc, r) => ({
      processos: acc.processos + r.total_processos,
      minutos: acc.minutos + r.total_minutos,
      judicial: acc.judicial + r.qtd_judicial,
      controle: acc.controle + r.qtd_controle,
      reincidencias: acc.reincidencias + r.qtd_reincidencias,
    }),
    { processos: 0, minutos: 0, judicial: 0, controle: 0, reincidencias: 0 }
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
        r.qtd_reincidencias,
        r.taxa_reincidencia_pct != null ? r.taxa_reincidencia_pct + "%" : "N/D",
      ]),
      startY: 28,
      styles: { fontSize: 8 },
    });
    doc.save("relatorio_cgris.pdf");
  };

  const chartData = rows.map((r) => ({
    equipe: r.team_code.toUpperCase(),
    processos: r.total_processos,
  }));

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
            Indicadores agregados por equipe — zero dados individuais
          </p>
        </div>
      </div>

      {/* Filtros */}
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
        {isAdmin && (
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Judicial / Controle
            </p>
            <p className="text-2xl font-bold">
              {totals.judicial} / {totals.controle}
            </p>
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
            <p className="text-muted-foreground text-sm py-4">Carregando...</p>
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
                        colSpan={8}
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
    </div>
  );
}
