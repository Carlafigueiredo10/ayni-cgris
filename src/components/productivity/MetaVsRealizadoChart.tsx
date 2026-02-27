import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTHLY_GOAL = 120;

type Props = { total: number };

export default function MetaVsRealizadoChart({ total }: Props) {
  const data = [
    { label: "Realizado", value: total },
    { label: "Meta", value: MONTHLY_GOAL },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Meta vs Realizado</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              width={70}
            />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              <Cell fill="hsl(var(--primary))" />
              <Cell fill="hsl(var(--muted))" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
