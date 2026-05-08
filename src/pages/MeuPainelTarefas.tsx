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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ListChecks,
  Plus,
  Search,
  Pin,
  PinOff,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Pencil,
  MoreHorizontal,
  History,
  Clock,
  AlertTriangle,
  CalendarPlus,
  Mail,
  BellOff,
  Sparkles,
  ArrowDownToLine,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { MeuPainelNav } from "@/components/meu-painel/MeuPainelNav";
import {
  useMeuPainelItens,
  useServidoresGeriveis,
  useHistoricoItem,
  useCriarItem,
  useRegistrarAcao,
  useAtualizarItem,
  useConcluirItem,
  useReabrirItem,
  useExcluirItem,
  classificarPrazo,
  adicionarDias,
  type MeuItem,
  type MeuItemTipo,
  type MeuItemPrioridade,
} from "@/hooks/use-meu-painel";

const TIPO_LABEL: Record<MeuItemTipo, string> = {
  PROCESSO: "Processo",
  TAREFA: "Tarefa",
  LEMBRETE: "Lembrete",
};

const TIPOS_TODOS: MeuItemTipo[] = ["PROCESSO", "TAREFA", "LEMBRETE"];

const PRIORIDADE_LABEL: Record<MeuItemPrioridade, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
};

function formatBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateTimeBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tempoRelativo(iso: string) {
  const dif = Date.now() - new Date(iso).getTime();
  const min = Math.round(dif / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d}d`;
  const meses = Math.round(d / 30);
  if (meses < 12) return `há ${meses}m`;
  return `há ${Math.round(meses / 12)}a`;
}

function PrazoBadge({ prazoISO }: { prazoISO: string | null }) {
  const status = classificarPrazo(prazoISO);
  if (status === "sem-prazo") {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const klass: Record<typeof status, string> = {
    "vencido": "bg-red-100 text-red-800 border-red-200",
    "hoje": "bg-orange-100 text-orange-800 border-orange-200",
    "em-3-dias": "bg-amber-100 text-amber-800 border-amber-200",
    "futuro": "bg-slate-100 text-slate-700 border-slate-200",
    "sem-prazo": "",
  };
  return (
    <Badge variant="outline" className={`${klass[status]} font-normal`}>
      {prazoISO ? formatBR(prazoISO) : ""}
    </Badge>
  );
}

function PrioridadeBadge({ p }: { p: MeuItemPrioridade }) {
  const klass: Record<MeuItemPrioridade, string> = {
    ALTA: "bg-red-50 text-red-700 border-red-200",
    NORMAL: "bg-slate-50 text-slate-700 border-slate-200",
    BAIXA: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <Badge variant="outline" className={`${klass[p]} font-normal`}>
      {PRIORIDADE_LABEL[p]}
    </Badge>
  );
}

function TipoBadge({ tipo, origem }: { tipo: MeuItemTipo; origem: MeuItem["origem"] }) {
  const klass: Record<MeuItemTipo, string> = {
    PROCESSO: "bg-indigo-50 text-indigo-700 border-indigo-200",
    TAREFA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    LEMBRETE: "bg-yellow-50 text-yellow-800 border-yellow-200",
  };
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant="outline" className={`${klass[tipo]} font-normal`}>
        {TIPO_LABEL[tipo]}
      </Badge>
      {origem === "COORDENACAO" && (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 font-normal"
          title="Item atribuído pela Coordenação"
        >
          <Building2 className="mr-1 h-3 w-3" />
          Coord.
        </Badge>
      )}
    </span>
  );
}

type FormState = {
  tipo: MeuItemTipo;
  referencia: string;
  assunto: string;
  prioridade: MeuItemPrioridade;
  prazo: string;
  notifyEmail: boolean;
  primeiraAcao: string;
};

const FORM_VAZIO: FormState = {
  tipo: "TAREFA",
  referencia: "",
  assunto: "",
  prioridade: "NORMAL",
  prazo: "",
  notifyEmail: true,
  primeiraAcao: "",
};

export default function MeuPainelTarefas() {
  const { profile, isManager, isManagerCgris } = useAuth();
  const podeGerirOutros = isManager || isManagerCgris;

  const { data: subordinados = [] } = useServidoresGeriveis();
  const [viewOwnerId, setViewOwnerId] = useState<string | null>(null);
  const [tab, setTab] = useState<"abertos" | "concluidos">("abertos");
  const [busca, setBusca] = useState("");
  const [tiposFiltro, setTiposFiltro] = useState<Set<MeuItemTipo>>(new Set());

  const { itens, loading } = useMeuPainelItens({
    ownerId: viewOwnerId,
    incluirConcluidos: tab === "concluidos",
  });

  const criar = useCriarItem();
  const registrarAcao = useRegistrarAcao();
  const atualizar = useAtualizarItem();
  const concluir = useConcluirItem();
  const reabrir = useReabrirItem();
  const excluir = useExcluirItem();

  const [novoOpen, setNovoOpen] = useState(false);
  const [editando, setEditando] = useState<MeuItem | null>(null);
  const [formState, setFormState] = useState<FormState>(FORM_VAZIO);
  const [acaoItem, setAcaoItem] = useState<MeuItem | null>(null);
  const [acaoTexto, setAcaoTexto] = useState("");
  const [historicoItem, setHistoricoItem] = useState<MeuItem | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<MeuItem | null>(null);

  const owner = useMemo(() => {
    if (!viewOwnerId) return null;
    return subordinados.find((s) => s.id === viewOwnerId) ?? null;
  }, [subordinados, viewOwnerId]);

  const itensFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter((it) => {
      if (tiposFiltro.size > 0 && !tiposFiltro.has(it.tipo)) return false;
      if (!q) return true;
      const haystack = [
        it.assunto,
        it.referencia ?? "",
        it.ultima_acao_descricao ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [itens, busca, tiposFiltro]);

  function toggleTipoFiltro(t: MeuItemTipo) {
    setTiposFiltro((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  }

  function abrirNovo() {
    setFormState(FORM_VAZIO);
    setNovoOpen(true);
  }

  function abrirEditar(it: MeuItem) {
    setFormState({
      tipo: it.tipo,
      referencia: it.referencia ?? "",
      assunto: it.assunto,
      prioridade: it.prioridade,
      prazo: it.prazo ?? "",
      notifyEmail: it.notify_email,
      primeiraAcao: "",
    });
    setEditando(it);
  }

  function fecharForm() {
    setNovoOpen(false);
    setEditando(null);
    setFormState(FORM_VAZIO);
  }

  async function submitNovo() {
    if (!formState.assunto.trim()) {
      toast.error("Assunto é obrigatório");
      return;
    }
    try {
      await criar.mutateAsync({
        ownerId: viewOwnerId,
        tipo: formState.tipo,
        referencia: formState.referencia.trim() || null,
        assunto: formState.assunto.trim(),
        prioridade: formState.prioridade,
        prazo: formState.prazo || null,
        notifyEmail: formState.notifyEmail,
        primeiraAcao: formState.primeiraAcao.trim() || null,
      });
      toast.success("Item criado");
      fecharForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function submitEditar() {
    if (!editando) return;
    if (!formState.assunto.trim()) {
      toast.error("Assunto é obrigatório");
      return;
    }
    try {
      await atualizar.mutateAsync({
        id: editando.id,
        referencia: formState.referencia.trim() || null,
        assunto: formState.assunto.trim(),
        prazo: formState.prazo || null,
        limparPrazo: !formState.prazo,
        prioridade: formState.prioridade,
        notifyEmail: formState.notifyEmail,
      });
      toast.success("Atualizado");
      fecharForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function submitAcao() {
    if (!acaoItem) return;
    if (!acaoTexto.trim()) {
      toast.error("Descreva a ação");
      return;
    }
    try {
      await registrarAcao.mutateAsync({
        itemId: acaoItem.id,
        descricao: acaoTexto.trim(),
      });
      toast.success("Ação registrada");
      setAcaoItem(null);
      setAcaoTexto("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function adiarPrazo(it: MeuItem, dias: number) {
    try {
      const base = it.prazo;
      const novoPrazo = adicionarDias(base, dias);
      await atualizar.mutateAsync({ id: it.id, prazo: novoPrazo });
      toast.success(`Prazo movido para ${formatBR(novoPrazo)}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function togglePin(it: MeuItem) {
    try {
      await atualizar.mutateAsync({ id: it.id, pinned: !it.pinned });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function toggleNotify(it: MeuItem) {
    try {
      await atualizar.mutateAsync({ id: it.id, notifyEmail: !it.notify_email });
      toast.success(it.notify_email ? "Avisos por e-mail desativados" : "Avisos por e-mail ativados");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleConcluir(it: MeuItem) {
    try {
      await concluir.mutateAsync(it.id);
      toast.success("Concluído");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleReabrir(it: MeuItem) {
    try {
      await reabrir.mutateAsync(it.id);
      toast.success("Reaberto");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleExcluir() {
    if (!confirmExcluir) return;
    try {
      await excluir.mutateAsync(confirmExcluir.id);
      toast.success("Item excluído");
      setConfirmExcluir(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  const visualizandoOutro = !!viewOwnerId && viewOwnerId !== profile?.id;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      <MeuPainelNav />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ListChecks className="h-6 w-6 text-primary" />
            Tarefas
          </h1>
          <p className="text-sm text-slate-600">
            Sua agenda pessoal de processos, tarefas e lembretes — com diário cronológico imutável.
          </p>
        </div>
        <Button onClick={abrirNovo} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo item
        </Button>
      </div>

      {podeGerirOutros && subordinados.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-4">
            <Label className="text-sm text-slate-700">Visualizando o painel de:</Label>
            <Select
              value={viewOwnerId ?? "self"}
              onValueChange={(v) => setViewOwnerId(v === "self" ? null : v)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Eu</SelectItem>
                {subordinados.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.display_name}
                    {s.team_code ? ` · ${s.team_code.toUpperCase()}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {visualizandoOutro && owner && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Atenção:</strong> você está editando o painel de{" "}
          <strong>{owner.display_name}</strong>. Toda criação, edição ou exclusão
          aqui será registrada no histórico do servidor.
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-sm flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por assunto, referência ou ação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {TIPOS_TODOS.map((t) => {
                const ativo = tiposFiltro.has(t);
                return (
                  <Button
                    key={t}
                    variant={ativo ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTipoFiltro(t)}
                  >
                    {TIPO_LABEL[t]}
                  </Button>
                );
              })}
            </div>
            <div className="ml-auto">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "abertos" | "concluidos")}>
                <TabsList>
                  <TabsTrigger value="abertos">Abertos</TabsTrigger>
                  <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Carregando...</div>
          ) : itensFiltrados.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              {itens.length === 0 ? (
                <>Nenhum item ainda. Clique em <strong>Novo item</strong> para começar.</>
              ) : (
                <>Nenhum item bate com os filtros.</>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {itensFiltrados.map((it) => (
                <ItemLinha
                  key={it.id}
                  item={it}
                  onAcaoRapida={() => {
                    setAcaoTexto("");
                    setAcaoItem(it);
                  }}
                  onEditar={() => abrirEditar(it)}
                  onHistorico={() => setHistoricoItem(it)}
                  onConcluir={() => handleConcluir(it)}
                  onReabrir={() => handleReabrir(it)}
                  onExcluir={() => setConfirmExcluir(it)}
                  onAdiar={(dias) => adiarPrazo(it, dias)}
                  onTogglePin={() => togglePin(it)}
                  onToggleNotify={() => toggleNotify(it)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Novo item */}
      <Dialog open={novoOpen} onOpenChange={(o) => (o ? null : fecharForm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo item</DialogTitle>
            <DialogDescription>
              {visualizandoOutro && owner
                ? `Será adicionado ao painel de ${owner.display_name}.`
                : "Será adicionado ao seu painel."}
            </DialogDescription>
          </DialogHeader>
          <ItemForm form={formState} onChange={setFormState} novoItem />
          <DialogFooter>
            <Button variant="ghost" onClick={fecharForm}>
              Cancelar
            </Button>
            <Button onClick={submitNovo} disabled={criar.isPending}>
              {criar.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar item */}
      <Dialog open={!!editando} onOpenChange={(o) => (o ? null : fecharForm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
            <DialogDescription>
              Mudanças em prazo e prioridade são registradas automaticamente no histórico.
            </DialogDescription>
          </DialogHeader>
          <ItemForm form={formState} onChange={setFormState} novoItem={false} />
          <DialogFooter>
            <Button variant="ghost" onClick={fecharForm}>
              Cancelar
            </Button>
            <Button onClick={submitEditar} disabled={atualizar.isPending}>
              {atualizar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar ação */}
      <Dialog
        open={!!acaoItem}
        onOpenChange={(o) => {
          if (!o) {
            setAcaoItem(null);
            setAcaoTexto("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar ação</DialogTitle>
            <DialogDescription>
              {acaoItem?.referencia ? `${acaoItem.referencia} — ` : ""}
              {acaoItem?.assunto}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>O que aconteceu?</Label>
            <Textarea
              autoFocus
              rows={4}
              placeholder='Ex: "Pedi parecer ao jurídico", "Aguardando retorno do TI", "Despachado para a chefia"'
              value={acaoTexto}
              onChange={(e) => setAcaoTexto(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Esta ação vira a "última ação" e empurra a anterior para o histórico. O registro é imutável.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAcaoItem(null);
                setAcaoTexto("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={submitAcao} disabled={registrarAcao.isPending}>
              {registrarAcao.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet: Histórico do item */}
      <Sheet open={!!historicoItem} onOpenChange={(o) => (o ? null : setHistoricoItem(null))}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {historicoItem && <HistoricoSheet item={historicoItem} />}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirmExcluir}
        onOpenChange={(o) => (o ? null : setConfirmExcluir(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              O item e seu histórico serão removidos da visualização (soft-delete).
              Esta ação será registrada antes da exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ----------------- Componentes auxiliares -----------------

function ItemForm({
  form,
  onChange,
  novoItem,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  novoItem: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select
            value={form.tipo}
            onValueChange={(v) => onChange({ ...form, tipo: v as MeuItemTipo })}
            disabled={!novoItem}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_TODOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIPO_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Prioridade</Label>
          <Select
            value={form.prioridade}
            onValueChange={(v) => onChange({ ...form, prioridade: v as MeuItemPrioridade })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Referência (opcional)</Label>
        <Input
          placeholder="Ex: SEI 00291, Chamado 34, Ofício 18"
          value={form.referencia}
          onChange={(e) => onChange({ ...form, referencia: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label>Assunto *</Label>
        <Input
          placeholder="Ex: Compra de notebooks"
          value={form.assunto}
          onChange={(e) => onChange({ ...form, assunto: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Prazo (opcional)</Label>
          <Input
            type="date"
            value={form.prazo}
            onChange={(e) => onChange({ ...form, prazo: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Switch
              checked={form.notifyEmail}
              onCheckedChange={(v) => onChange({ ...form, notifyEmail: v })}
            />
            Avisar por e-mail
          </label>
        </div>
      </div>

      {novoItem && (
        <div className="space-y-1">
          <Label>Primeira ação (opcional)</Label>
          <Textarea
            rows={2}
            placeholder='Ex: "Recebido por e-mail", "Aguardando documentos"'
            value={form.primeiraAcao}
            onChange={(e) => onChange({ ...form, primeiraAcao: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

function ItemLinha({
  item,
  onAcaoRapida,
  onEditar,
  onHistorico,
  onConcluir,
  onReabrir,
  onExcluir,
  onAdiar,
  onTogglePin,
  onToggleNotify,
}: {
  item: MeuItem;
  onAcaoRapida: () => void;
  onEditar: () => void;
  onHistorico: () => void;
  onConcluir: () => void;
  onReabrir: () => void;
  onExcluir: () => void;
  onAdiar: (dias: number) => void;
  onTogglePin: () => void;
  onToggleNotify: () => void;
}) {
  const concluido = !!item.concluido_em;
  const status = classificarPrazo(item.prazo);
  const ehCoord = item.origem === "COORDENACAO";

  return (
    <li className="grid grid-cols-1 gap-2 px-4 py-3 hover:bg-slate-50/60 sm:grid-cols-12 sm:items-center sm:px-6">
      {/* Coluna principal: tipo + assunto + última ação */}
      <div className="sm:col-span-6 min-w-0">
        <div className="flex items-center gap-2">
          {item.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
          <TipoBadge tipo={item.tipo} origem={item.origem} />
          {status === "vencido" && (
            <span title="Prazo vencido">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            </span>
          )}
        </div>
        <div className={`mt-1 truncate text-sm font-medium ${concluido ? "text-slate-400 line-through" : "text-slate-900"}`}>
          {item.referencia ? (
            <span className="text-slate-500">{item.referencia} — </span>
          ) : null}
          {item.assunto}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          {item.ultima_acao_descricao ? (
            <>
              {item.ultima_acao_tipo === "SISTEMA" ? (
                <Sparkles className="h-3 w-3 text-blue-500" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="truncate">{item.ultima_acao_descricao}</span>
              {item.ultima_acao_em && (
                <span className="shrink-0 text-slate-400">
                  · {tempoRelativo(item.ultima_acao_em)}
                  {item.ultima_acao_por_self === false && item.ultima_acao_por_nome
                    ? ` por ${item.ultima_acao_por_nome}`
                    : ""}
                </span>
              )}
            </>
          ) : (
            <span className="italic text-slate-400">Sem ações registradas ainda</span>
          )}
        </div>
      </div>

      {/* Prazo + prioridade */}
      <div className="sm:col-span-3 flex items-center gap-3">
        <PrazoBadge prazoISO={item.prazo} />
        <PrioridadeBadge p={item.prioridade} />
      </div>

      {/* Ações */}
      <div className="sm:col-span-3 flex items-center justify-end gap-1">
        {!concluido && (
          <Button size="sm" variant="outline" onClick={onAcaoRapida} title="Registrar ação">
            <Clock className="mr-1 h-3.5 w-3.5" />
            Ação
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onHistorico} title="Histórico">
          <History className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" title="Mais">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {!concluido && (
              <>
                <DropdownMenuItem onClick={onConcluir}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                  Concluir
                </DropdownMenuItem>
                {!ehCoord && (
                  <DropdownMenuItem onClick={onEditar}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAdiar(1)}>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Adiar 1 dia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdiar(7)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Adiar 7 dias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdiar(30)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Adiar 30 dias
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onTogglePin}>
                  {item.pinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      Desafixar
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      Fixar no topo
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleNotify}>
                  {item.notify_email ? (
                    <>
                      <BellOff className="mr-2 h-4 w-4" />
                      Desativar e-mail de prazo
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Ativar e-mail de prazo
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}
            {concluido && (
              <DropdownMenuItem onClick={onReabrir}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reabrir
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onExcluir}
              className="text-red-600 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function HistoricoSheet({ item }: { item: MeuItem }) {
  const { data: historico = [], isLoading } = useHistoricoItem(item.id);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico do item
        </SheetTitle>
        <SheetDescription>
          {item.referencia ? `${item.referencia} — ` : ""}
          {item.assunto}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : historico.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma ação registrada ainda. Use o botão "Ação" no item para começar o diário.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {historico.map((a, idx) => {
              const ehSistema = a.tipo === "SISTEMA";
              return (
                <li key={a.id} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white ${
                      ehSistema ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  >
                    {ehSistema ? (
                      <Sparkles className="h-2.5 w-2.5 text-white" />
                    ) : null}
                  </span>
                  <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                    <div className={`text-sm ${ehSistema ? "text-slate-600 italic" : "text-slate-900"}`}>
                      {a.descricao}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {idx === 0 && <strong className="mr-1 text-emerald-700">Última · </strong>}
                      {formatDateTimeBR(a.created_at)}
                      {!a.autor_self && a.autor_nome && (
                        <span> · por {a.autor_nome}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
