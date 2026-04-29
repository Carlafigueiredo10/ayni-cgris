import { Card, CardContent } from "@/components/ui/card";

type Props = {
  total: number;
  registrosPontuados: number;
  loading?: boolean;
};

export default function PontosKpi({
  total,
  registrosPontuados,
  loading,
}: Props) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Pontos no mês
        </p>
        <p className="text-2xl font-bold text-foreground mt-1">
          {loading ? "—" : Math.round(total * 10) / 10}
        </p>
        <p className="text-xs text-muted-foreground">
          {registrosPontuados} registro
          {registrosPontuados === 1 ? "" : "s"} considerado
          {registrosPontuados === 1 ? "" : "s"}
        </p>
      </CardContent>
    </Card>
  );
}
