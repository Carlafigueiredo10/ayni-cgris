import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Registro, ScoreRow } from "@/types/registro";

const csvHeaders = [
  { label: "Data", key: "data" },
  { label: "Processo", key: "processo" },
  { label: "Status", key: "status" },
  { label: "Minutos", key: "minutos" },
  { label: "Natureza", key: "tipoNatureza" },
];

type Props = {
  registros: Registro[];
  scoreById?: Map<string, ScoreRow>;
};

export default function RelatorioTable({ registros, scoreById }: Props) {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Relatorio de Produtividade Individual", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
    autoTable(doc, {
      head: [["Data", "Processo", "Status", "Min", "Natureza", "Pontos"]],
      body: registros.map((r) => [
        r.data,
        r.processo,
        r.status,
        r.minutos,
        r.tipoNatureza || "-",
        r.id ? scoreById?.get(r.id)?.pontos ?? "-" : "-",
      ]),
      startY: 28,
      styles: { fontSize: 8 },
    });
    doc.save("relatorio_produtividade.pdf");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Historico de registros
        </CardTitle>
        <div className="flex gap-2">
          <CSVLink
            data={registros}
            headers={csvHeaders}
            filename="relatorio_produtividade.csv"
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">Processo</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Min</th>
                <th className="pb-2 font-medium">Natureza</th>
                <th className="pb-2 font-medium">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => {
                const score = r.id ? scoreById?.get(r.id) : undefined;
                return (
                  <tr key={r.id || i} className="border-b last:border-0">
                    <td className="py-2">{r.data}</td>
                    <td className="py-2 font-mono text-xs">{r.processo}</td>
                    <td className="py-2">{r.status}</td>
                    <td className="py-2">{r.minutos}</td>
                    <td className="py-2">{r.tipoNatureza || "-"}</td>
                    <td className="py-2">
                      {score ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium cursor-help underline decoration-dotted">
                              {Math.round(Number(score.pontos) * 10) / 10}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="text-xs space-y-0.5">
                              <p>
                                <strong>Memória de cálculo</strong>
                              </p>
                              <p>
                                peso assunto ({score.assunto_slug || "—"}):{" "}
                                {Number(score.peso_assunto)}
                              </p>
                              <p>
                                {score.atuacao_num}ª atuação ⇒ multiplicador ×
                                {score.multiplicador}
                              </p>
                              <p>
                                status ({score.status}) ⇒ ×
                                {Number(score.fator_status)}
                              </p>
                              <p className="border-t pt-0.5 mt-0.5">
                                {Number(score.peso_assunto)} ×{" "}
                                {score.multiplicador} ×{" "}
                                {Number(score.fator_status)} ={" "}
                                {Math.round(Number(score.pontos) * 10) / 10}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
              {registros.length === 0 && (
                <tr>
                  <td
                    className="py-8 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    Nenhum registro ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
