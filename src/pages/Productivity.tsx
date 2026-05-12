import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useRegistros } from "@/hooks/use-registros";
import type { Registro, ReincidenciaResult } from "@/types/registro";
import KpiGrid from "@/components/productivity/KpiGrid";
import CoordinationKpis from "@/components/productivity/CoordinationKpis";
import PontosKpi from "@/components/productivity/PontosKpi";
import ProgressoAcumuladoChart from "@/components/productivity/ProgressoAcumuladoChart";
import MetaVsRealizadoChart from "@/components/productivity/MetaVsRealizadoChart";
import RegistroForm from "@/components/productivity/RegistroForm";
import RelatorioTable from "@/components/productivity/RelatorioTable";
import ConsolidadoTable from "@/components/productivity/ConsolidadoTable";
import ReincidenciaModal from "@/components/productivity/ReincidenciaModal";
import { useCoordinationData } from "@/hooks/use-coordination-data";
import { useMyScore } from "@/hooks/use-my-score";
import { MeuPainelNav } from "@/components/meu-painel/MeuPainelNav";

const Productivity = () => {
  const {
    registros,
    stats,
    checkReincidence,
    checkCpfHistory,
    getProcessoLastJudicial,
    addRegistro,
  } = useRegistros();
  const { coordinationKpis, loading: coordLoading } = useCoordinationData();
  const {
    total: pontosTotal,
    rows: scoreRows,
    byRegistroId: scoreById,
    loading: scoreLoading,
    refresh: refreshScore,
  } = useMyScore();

  const [pendingRegistro, setPendingRegistro] = useState<Registro | null>(null);
  const [reincidenciaResult, setReincidenciaResult] =
    useState<ReincidenciaResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (novo: Registro) => {
    setSubmitting(true);
    const result = await checkReincidence(novo.processo);

    if (result && result.reincidence_type !== "none") {
      setPendingRegistro(novo);
      setReincidenciaResult(result);
      setModalOpen(true);
      setSubmitting(false);
      return;
    }

    await addRegistro(novo);
    await refreshScore();
    setSubmitting(false);
  };

  const handleReincidenciaConfirm = async (
    respostas: Record<string, string>
  ) => {
    if (!pendingRegistro || !reincidenciaResult) return;
    setModalOpen(false);
    setSubmitting(true);
    await addRegistro(
      pendingRegistro,
      reincidenciaResult.reincidence_type,
      respostas
    );
    await refreshScore();
    setPendingRegistro(null);
    setReincidenciaResult(null);
    setSubmitting(false);
  };

  const handleReincidenciaCancel = () => {
    setModalOpen(false);
    setPendingRegistro(null);
    setReincidenciaResult(null);
  };

  return (
    <div className="space-y-6">
      <MeuPainelNav />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Registro de entregas
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe metricas e produtividade individual
          </p>
        </div>
      </div>

      <KpiGrid
        total={stats.total}
        totalMinutos={stats.totalMinutos}
        media={stats.media}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PontosKpi
          total={pontosTotal}
          registrosPontuados={scoreRows.length}
          loading={scoreLoading}
        />
      </div>

      <CoordinationKpis kpis={coordinationKpis} loading={coordLoading} />

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Produtividade Individual</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <RegistroForm
            onSubmit={handleSubmit}
            submitting={submitting}
            onCpfCheck={checkCpfHistory}
            onProcessoLookup={getProcessoLastJudicial}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProgressoAcumuladoChart registros={registros} />
        <MetaVsRealizadoChart total={stats.total} />
      </div>

      <RelatorioTable registros={registros} scoreById={scoreById} />
      <ConsolidadoTable registros={registros} />

      <ReincidenciaModal
        open={modalOpen}
        result={reincidenciaResult}
        onConfirm={handleReincidenciaConfirm}
        onCancel={handleReincidenciaCancel}
      />
    </div>
  );
};

export default Productivity;
