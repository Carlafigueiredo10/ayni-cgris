import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Registro } from "@/types/registro";
import { businessDaysInMonth } from "@/lib/business-days";

const MONTHLY_GOAL = 120;

type Props = { registros: Registro[] };

export default function ProgressoAcumuladoChart({ registros }: Props) {
  const data = useMemo(() => {
    const sorted = [...registros].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    let acum = 0;
    const dailyMap = new Map<string, number>();
    for (const r of sorted) {
      acum += 1;
      dailyMap.set(r.data, acum);
    }
    return Array.from(dailyMap.entries()).map(([data, acumulado]) => ({
      data,
      acumulado,
      meta: Math.round(
        (MONTHLY_GOAL / businessDaysInMonth(new Date(data))) *
          new Date(data).getDate()
      ),
    }));
  }, [registros]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Progresso acumulado
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="data" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine
              y={MONTHLY_GOAL}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{ value: "Meta", fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="acumulado"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="meta"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 3"
              strokeWidth={1}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
