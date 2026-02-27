import { requiredPace, elapsedBusinessDays } from "@/lib/business-days";

const MONTHLY_GOAL = 120;

type Props = { total: number };

export default function Tendencia({ total }: Props) {
  const elapsed = elapsedBusinessDays();
  const expected = elapsed > 0 ? Math.round((MONTHLY_GOAL / 22) * elapsed) : 0;
  const pace = requiredPace(MONTHLY_GOAL, total);
  const ahead = total >= expected;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        ahead
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {ahead ? (
        <p>
          Voce esta <strong>dentro do ritmo</strong>. Mantenha {pace}{" "}
          processos/dia util para atingir a meta.
        </p>
      ) : (
        <p>
          Voce esta <strong>abaixo do ritmo esperado</strong> ({total} de{" "}
          {expected} esperados ate hoje). Necessario {pace} processos/dia util
          restante.
        </p>
      )}
    </div>
  );
}
