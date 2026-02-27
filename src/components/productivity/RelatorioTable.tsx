import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Registro } from "@/types/registro";

const csvHeaders = [
  { label: "Data", key: "data" },
  { label: "Processo", key: "processo" },
  { label: "Status", key: "status" },
  { label: "Minutos", key: "minutos" },
  { label: "Natureza", key: "tipoNatureza" },
];

type Props = { registros: Registro[] };

export default function RelatorioTable({ registros }: Props) {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Relatorio de Produtividade Individual", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
    autoTable(doc, {
      head: [["Data", "Processo", "Status", "Min", "Natureza"]],
      body: registros.map((r) => [
        r.data,
        r.processo,
        r.status,
        r.minutos,
        r.tipoNatureza || "-",
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
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={r.id || i} className="border-b last:border-0">
                  <td className="py-2">{r.data}</td>
                  <td className="py-2 font-mono text-xs">{r.processo}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2">{r.minutos}</td>
                  <td className="py-2">{r.tipoNatureza || "-"}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td
                    className="py-8 text-center text-muted-foreground"
                    colSpan={5}
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
