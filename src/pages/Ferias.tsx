import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plane, Plus, Pencil, Ban, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useMinhasFerias,
  useSolicitarFerias,
  useAtualizarFerias,
  useAlterarStatusFerias,
  useExcluirFerias,
  type Ferias,
  type FeriasStatus,
} from "@/hooks/use-ferias";

const STATUS_LABEL: Record<FeriasStatus, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  AJUSTAR: "Ajustar",
  CANCELADA: "Cancelada",
};

const STATUS_VARIANT: Record<FeriasStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  APROVADA: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
  AJUSTAR: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200",
  CANCELADA: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200",
};

function formatBR(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function diasEntre(inicio: string, fim: string) {
  const a = new Date(inicio + "T00:00:00");
  const b = new Date(fim + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

type FormState = {
  dataInicio: string;
  dataFim: string;
  observacao: string;
};

const EMPTY: FormState = { dataInicio: "", dataFim: "", observacao: "" };

export default function Ferias() {
  const { profile, isAdmin, isManager, isManagerCgris } = useAuth();
  const podeAprovar = isAdmin || isManager || isManagerCgris;

  const { ferias, loading } = useMinhasFerias();
  const solicitar = useSolicitarFerias();
  const atualizar = useAtualizarFerias();
  const alterarStatus = useAlterarStatusFerias();
  const excluir = useExcluirFerias();

  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [editando, setEditando] = useState<Ferias | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Ferias | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Ferias | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const sorted = useMemo(
    () =>
      [...ferias].sort(
        (a, b) =>
          new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
      ),
    [ferias]
  );

  function abrirSolicitar() {
    setForm(EMPTY);
    setSolicitarOpen(true);
  }

  function abrirEditar(f: Ferias) {
    setForm({
      dataInicio: f.data_inicio,
      dataFim: f.data_fim,
      observacao: f.observacao_servidor ?? "",
    });
    setEditando(f);
  }

  function fecharForm() {
    setSolicitarOpen(false);
    setEditando(null);
    setForm(EMPTY);
  }

  function validarForm(): string | null {
    if (!form.dataInicio || !form.dataFim) return "Preencha as datas de início e fim";
    if (form.dataFim < form.dataInicio) return "A data fim não pode ser anterior ao início";
    return null;
  }

  async function submitSolicitar() {
    const erro = validarForm();
    if (erro) {
      toast.error(erro);
      return;
    }
    try {
      await solicitar.mutateAsync({
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        observacao: form.observacao || null,
      });
      toast.success("Solicitação criada");
      fecharForm();
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function submitEditar() {
    if (!editando) return;
    const erro = validarForm();
    if (erro) {
      toast.error(erro);
      return;
    }
    try {
      const novoStatus = await atualizar.mutateAsync({
        id: editando.id,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        observacao: form.observacao || null,
      });
      if (editando.status === "AJUSTAR" && novoStatus === "PENDENTE") {
        toast.success("Atualizado — voltou para Pendente");
      } else {
        toast.success("Atualizado");
      }
      fecharForm();
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function cancelar(f: Ferias) {
    try {
      await alterarStatus.mutateAsync({ id: f.id, status: "CANCELADA" });
      toast.success("Férias canceladas");
      setConfirmCancel(null);
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function deletar(f: Ferias) {
    try {
      await excluir.mutateAsync(f.id);
      toast.success("Registro removido");
      setConfirmDelete(null);
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (!profile) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        Sessão não encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Plane className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Férias</h1>
          <p className="text-sm text-muted-foreground">
            Coordenação operacional. Não substitui o SOUGOV — é um alinhamento
            entre servidor e gestor.
          </p>
        </div>
      </div>

      <Tabs defaultValue="minhas" className="w-full">
        <TabsList>
          <TabsTrigger value="minhas">Minhas férias</TabsTrigger>
          {podeAprovar && (
            <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
          )}
          {podeAprovar && <TabsTrigger value="mapa">Mapa operacional</TabsTrigger>}
        </TabsList>

        <TabsContent value="minhas" className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Seus cadastros. Edição livre enquanto estiver Pendente ou em
              Ajuste.
            </p>
            <Button onClick={abrirSolicitar} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Cadastrar férias
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Carregando...
            </p>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Você ainda não cadastrou nenhuma solicitação de férias.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sorted.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {formatBR(f.data_inicio)} → {formatBR(f.data_fim)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({diasEntre(f.data_inicio, f.data_fim)} dias)
                          </span>
                          <Badge
                            variant="outline"
                            className={STATUS_VARIANT[f.status]}
                          >
                            {STATUS_LABEL[f.status]}
                          </Badge>
                        </div>
                        {f.observacao_servidor && (
                          <p className="text-xs text-muted-foreground">
                            Sua observação: {f.observacao_servidor}
                          </p>
                        )}
                        {f.status === "AJUSTAR" && f.observacao_gestor && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-900">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div>
                              <span className="font-semibold">
                                Gestor pediu ajuste:
                              </span>{" "}
                              {f.observacao_gestor}
                            </div>
                          </div>
                        )}
                        {f.status === "APROVADA" && f.observacao_gestor && (
                          <p className="text-xs text-muted-foreground">
                            Nota do gestor: {f.observacao_gestor}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(f.status === "PENDENTE" || f.status === "AJUSTAR") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEditar(f)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Button>
                        )}
                        {(f.status === "PENDENTE" ||
                          f.status === "AJUSTAR" ||
                          f.status === "APROVADA") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmCancel(f)}
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        )}
                        {f.status !== "APROVADA" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConfirmDelete(f)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {podeAprovar && (
          <TabsContent value="aprovacoes" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aprovações da equipe</CardTitle>
                <CardDescription>Em construção.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        )}

        {podeAprovar && (
          <TabsContent value="mapa" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mapa operacional</CardTitle>
                <CardDescription>Em construção.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={solicitarOpen || editando !== null} onOpenChange={(o) => !o && fecharForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar férias" : "Cadastrar férias"}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? "Após salvar, a solicitação volta para Pendente para nova análise do gestor."
                : "Informe o período pretendido. Seu gestor revisa e marca como Aprovada ou pede ajuste."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_inicio">Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) =>
                    setForm({ ...form, dataInicio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_fim">Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                />
              </div>
            </div>
            {form.dataInicio && form.dataFim && form.dataFim >= form.dataInicio && (
              <p className="text-xs text-muted-foreground">
                {diasEntre(form.dataInicio, form.dataFim)} dia(s) corridos.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea
                id="observacao"
                rows={3}
                value={form.observacao}
                onChange={(e) =>
                  setForm({ ...form, observacao: e.target.value })
                }
                placeholder="Ex.: vou parcelar; já avisei a equipe..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={fecharForm}>
              Cancelar
            </Button>
            <Button
              onClick={editando ? submitEditar : submitSolicitar}
              disabled={solicitar.isPending || atualizar.isPending}
            >
              {solicitar.isPending || atualizar.isPending
                ? "Salvando..."
                : editando
                ? "Salvar"
                : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmCancel !== null}
        onOpenChange={(o) => !o && setConfirmCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar estas férias?</AlertDialogTitle>
            <AlertDialogDescription>
              O período fica registrado como cancelado. Se já saiu no SOUGOV,
              cancele lá também — este sistema é só de coordenação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCancel && cancelar(confirmCancel)}
            >
              Cancelar férias
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Remoção permanente da sua lista. Use cancelamento se quiser
              preservar o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deletar(confirmDelete)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
