import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Registro } from "@/types/registro";

type Props = { registros: Registro[] };

export default function ConsolidadoTable({ registros }: Props) {
  const rows = useMemo(() => {
    const map = new Map<
      string,
      { mes: string; qtd: number; totalMin: number }
    >();
    for (const r of registros) {
      const mes = r.data.slice(0, 7); // YYYY-MM
      const entry = map.get(mes) || { mes, qtd: 0, totalMin: 0 };
      entry.qtd += 1;
      entry.totalMin += r.minutos;
      map.set(mes, entry);
    }
    return Array.from(map.values())
      .sort((a, b) => b.mes.localeCompare(a.mes))
      .map((r) => ({
        ...r,
        media: Math.round(r.totalMin / r.qtd),
      }));
  }, [registros]);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Consolidado mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Mes</th>
                <th className="pb-2 font-medium">Processos</th>
                <th className="pb-2 font-medium">Total min</th>
                <th className="pb-2 font-medium">Media min</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.mes} className="border-b last:border-0">
                  <td className="py-2">{r.mes}</td>
                  <td className="py-2">{r.qtd}</td>
                  <td className="py-2">{r.totalMin}</td>
                  <td className="py-2">{r.media}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
