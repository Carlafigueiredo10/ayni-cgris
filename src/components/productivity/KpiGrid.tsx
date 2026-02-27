import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  businessDaysInMonth,
  requiredPace,
} from "@/lib/business-days";

const MONTHLY_GOAL = 120;

type Props = {
  total: number;
  totalMinutos: number;
  media: number;
};

export default function KpiGrid({ total, totalMinutos, media }: Props) {
  const pct = Math.min(Math.round((total / MONTHLY_GOAL) * 100), 100);
  const pace = requiredPace(MONTHLY_GOAL, total);
  const bizDays = businessDaysInMonth();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Realizado
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
          <p className="text-xs text-muted-foreground">
            de {MONTHLY_GOAL} processos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Progresso
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{pct}%</p>
          <Progress value={pct} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tempo total
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {totalMinutos} min
          </p>
          <p className="text-xs text-muted-foreground">
            media {media} min/proc
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Ritmo necessario
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {pace}/dia
          </p>
          <p className="text-xs text-muted-foreground">
            {bizDays} dias uteis no mes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
