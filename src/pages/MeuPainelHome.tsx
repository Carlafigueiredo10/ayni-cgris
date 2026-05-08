import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { MeuPainelNav } from "@/components/meu-painel/MeuPainelNav";
import KpiGrid from "@/components/productivity/KpiGrid";
import PontosKpi from "@/components/productivity/PontosKpi";
import { useRegistros } from "@/hooks/use-registros";
import { useMyScore } from "@/hooks/use-my-score";
import {
  useMeuPainelItens,
  classificarPrazo,
  type MeuItem,
} from "@/hooks/use-meu-painel";

function primeiroNome(s: string | null | undefined): string {
  if (!s) return "";
  return s.split(" ")[0];
}

function formatBR(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type Resumo = {
  total: number;
  emDia: number;
  vencendoHoje: number;
  emAtraso: number;
  vencidos: MeuItem[];
  hoje: MeuItem[];
  proximos: MeuItem[];
};

function resumirItens(itens: MeuItem[]): Resumo {
  const r: Resumo = {
    total: 0,
    emDia: 0,
    vencendoHoje: 0,
    emAtraso: 0,
    vencidos: [],
    hoje: [],
    proximos: [],
  };
  for (const it of itens) {
    if (it.concluido_em) continue;
    r.total++;
    const status = classificarPrazo(it.prazo);
    if (status === "vencido") {
      r.emAtraso++;
      r.vencidos.push(it);
    } else if (status === "hoje") {
      r.vencendoHoje++;
      r.hoje.push(it);
    } else {
      r.emDia++;
      if (status === "em-3-dias") r.proximos.push(it);
    }
  }
  // Ordena cada lista por prazo asc
  const byPrazo = (a: MeuItem, b: MeuItem) =>
    (a.prazo ?? "9999-99-99").localeCompare(b.prazo ?? "9999-99-99");
  r.vencidos.sort(byPrazo);
  r.hoje.sort(byPrazo);
  r.proximos.sort(byPrazo);
  return r;
}

export default function MeuPainelHome() {
  const { profile } = useAuth();
  const { stats } = useRegistros();
  const { total: pontosTotal, rows: scoreRows, loading: scoreLoading } = useMyScore();
  const { itens, loading } = useMeuPainelItens({
    ownerId: null,
    incluirConcluidos: false,
  });

  const resumo = useMemo(() => resumirItens(itens), [itens]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      <MeuPainelNav />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Olá, {primeiroNome(profile?.display_name) || "servidor(a)"}
        </h1>
        <p className="text-sm text-slate-600">
          Seu hub operacional pessoal — entregas e tarefas em um só lugar.
        </p>
      </div>

      {/* CTAs principais */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/meu-painel/entregas"
          className="group rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <TrendingUp className="h-4 w-4" />
                Registrar entrega
              </div>
              <p className="mt-1 text-base font-semibold text-slate-900">
                Lance um processo do mês
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Tempo, classificação, reincidência e pontuação.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
          </div>
        </Link>

        <Link
          to="/meu-painel/tarefas"
          className="group rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-5 transition-all hover:border-emerald-400 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <ListChecks className="h-4 w-4" />
                Acompanhar tarefas
              </div>
              <p className="mt-1 text-base font-semibold text-slate-900">
                Sua agenda de pendências
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Processos, tarefas e lembretes com diário cronológico.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-emerald-700 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
          </div>
        </Link>
      </div>

      {/* Pendências de hoje — bloco mais importante */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Pendências de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : resumo.vencidos.length === 0 && resumo.hoje.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Tudo em dia. Nada vencendo hoje nem atrasado.
            </div>
          ) : (
            <div className="space-y-3">
              {resumo.vencidos.length > 0 && (
                <BlocoUrgencia
                  titulo={`Em atraso (${resumo.vencidos.length})`}
                  cor="red"
                  itens={resumo.vencidos.slice(0, 5)}
                />
              )}
              {resumo.hoje.length > 0 && (
                <BlocoUrgencia
                  titulo={`Vence hoje (${resumo.hoje.length})`}
                  cor="orange"
                  itens={resumo.hoje.slice(0, 5)}
                />
              )}
              {(resumo.vencidos.length + resumo.hoje.length) > 10 && (
                <Link
                  to="/meu-painel/tarefas"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Ver todas
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo do mês — Entregas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
            <TrendingUp className="h-4 w-4" />
            Resumo do mês — Entregas
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/meu-painel/entregas" className="gap-1">
              Abrir
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <KpiGrid
          total={stats.total}
          totalMinutos={stats.totalMinutos}
          media={stats.media}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PontosKpi
            total={pontosTotal}
            registrosPontuados={scoreRows.length}
            loading={scoreLoading}
          />
        </div>
      </section>

      {/* Resumo de tarefas + próximas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
            <ListChecks className="h-4 w-4" />
            Resumo — Tarefas
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/meu-painel/tarefas" className="gap-1">
              Abrir
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCardSimples label="Abertas" valor={resumo.total} />
          <KpiCardSimples label="Em dia" valor={resumo.emDia} cor="emerald" />
          <KpiCardSimples label="Vencendo hoje" valor={resumo.vencendoHoje} cor="orange" />
          <KpiCardSimples label="Em atraso" valor={resumo.emAtraso} cor="red" />
        </div>
      </section>

      {/* Próximas tarefas */}
      {resumo.proximos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              Próximas (até 3 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {resumo.proximos.slice(0, 5).map((it) => (
                <ItemUrgenciaLinha key={it.id} item={it} cor="amber" />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ----------------- Auxiliares -----------------

function KpiCardSimples({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: number;
  cor?: "emerald" | "orange" | "red";
}) {
  const klass: Record<NonNullable<typeof cor>, string> = {
    emerald: "text-emerald-700",
    orange: "text-orange-700",
    red: "text-red-700",
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${cor ? klass[cor] : "text-foreground"}`}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

function BlocoUrgencia({
  titulo,
  cor,
  itens,
}: {
  titulo: string;
  cor: "red" | "orange";
  itens: MeuItem[];
}) {
  const klass = {
    red: "text-red-700 bg-red-50 border-red-200",
    orange: "text-orange-700 bg-orange-50 border-orange-200",
  }[cor];
  return (
    <div>
      <Badge variant="outline" className={`mb-2 font-normal ${klass}`}>
        {titulo}
      </Badge>
      <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
        {itens.map((it) => (
          <ItemUrgenciaLinha key={it.id} item={it} cor={cor} />
        ))}
      </ul>
    </div>
  );
}

function ItemUrgenciaLinha({
  item,
  cor,
}: {
  item: MeuItem;
  cor: "red" | "orange" | "amber";
}) {
  const dot = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    amber: "bg-amber-400",
  }[cor];
  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      <Link
        to="/meu-painel/tarefas"
        className="min-w-0 flex-1 truncate text-slate-900 hover:text-primary"
      >
        {item.referencia ? (
          <span className="text-slate-500">{item.referencia} — </span>
        ) : null}
        {item.assunto}
      </Link>
      <span className="shrink-0 text-xs text-slate-500">{formatBR(item.prazo)}</span>
      {item.ultima_acao_tipo === "SISTEMA" && (
        <Sparkles className="h-3 w-3 shrink-0 text-blue-500" />
      )}
    </li>
  );
}
