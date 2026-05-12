import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Plus,
  Pencil,
  PowerOff,
  Power,
  Building2,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTeamsHierarchy,
  useCriarEquipe,
  useRenomearEquipe,
  useSetEquipeActive,
  useCriarSubequipe,
  useRenomearSubequipe,
  useInativarSubequipe,
  type Team,
  type TeamWithSubteams,
} from "@/hooks/use-teams";

export default function AdminEquipes() {
  const { profile, isAdmin, isManagerCgris, isManager, loading: authLoading } = useAuth();
  const { hierarchy, isLoading } = useTeamsHierarchy();

  const [novaEquipeOpen, setNovaEquipeOpen] = useState(false);
  const [novoCode, setNovoCode] = useState("");
  const [novoNome, setNovoNome] = useState("");

  const [novaSubOpen, setNovaSubOpen] = useState<TeamWithSubteams | null>(null);
  const [novoSubNome, setNovoSubNome] = useState("");

  const [editando, setEditando] = useState<{ team: Team; isSub: boolean } | null>(null);
  const [editNome, setEditNome] = useState("");

  const [confirmInativar, setConfirmInativar] = useState<{ team: Team; isSub: boolean; ativar: boolean } | null>(null);

  const criar = useCriarEquipe();
  const renomearEq = useRenomearEquipe();
  const setEqActive = useSetEquipeActive();
  const criarSub = useCriarSubequipe();
  const renomearSub = useRenomearSubequipe();
  const inativarSub = useInativarSubequipe();

  // Quem pode criar sub-equipe nesta equipe principal
  const podeGerirEquipe = (eqId: string) => {
    if (isAdmin || isManagerCgris) return true;
    if (isManager && profile?.team_id === eqId) return true;
    return false;
  };

  const equipesVisiveis = useMemo(() => {
    if (isAdmin || isManagerCgris) return hierarchy;
    // Gestor vê só sua própria equipe principal (foco)
    if (isManager) return hierarchy.filter((eq) => eq.id === profile?.team_id);
    // Servidor comum: lista todas em modo somente leitura
    return hierarchy;
  }, [hierarchy, isAdmin, isManagerCgris, isManager, profile?.team_id]);

  if (authLoading) return null;
  if (profile === null) return null;
  if (!isAdmin && !isManagerCgris && !isManager) {
    return <Navigate to="/meu-painel" replace />;
  }

  async function submitCriar() {
    try {
      await criar.mutateAsync({ code: novoCode, name: novoNome });
      toast.success(`Equipe "${novoNome}" criada`);
      setNovaEquipeOpen(false);
      setNovoCode("");
      setNovoNome("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function submitCriarSub() {
    if (!novaSubOpen) return;
    try {
      await criarSub.mutateAsync({
        parentTeamId: novaSubOpen.id,
        name: novoSubNome,
      });
      toast.success(`Sub-equipe "${novoSubNome}" criada`);
      setNovaSubOpen(null);
      setNovoSubNome("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function submitRenomear() {
    if (!editando) return;
    try {
      if (editando.isSub) {
        await renomearSub.mutateAsync({ subteamId: editando.team.id, name: editNome });
      } else {
        await renomearEq.mutateAsync({ teamId: editando.team.id, name: editNome });
      }
      toast.success("Renomeado");
      setEditando(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleToggleAtivo() {
    if (!confirmInativar) return;
    try {
      if (confirmInativar.isSub) {
        await inativarSub.mutateAsync({
          subteamId: confirmInativar.team.id,
          active: confirmInativar.ativar,
        });
      } else {
        await setEqActive.mutateAsync({
          teamId: confirmInativar.team.id,
          active: confirmInativar.ativar,
        });
      }
      toast.success(confirmInativar.ativar ? "Reativada" : "Inativada");
      setConfirmInativar(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/admin">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar ao Admin
        </Link>
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <GitBranch className="h-6 w-6 text-primary" />
            Equipes da CGRIS
          </h1>
          <p className="text-sm text-slate-600">
            Núcleos da CGRIS e seus agrupamentos internos (sub-equipes).
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setNovaEquipeOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova equipe
          </Button>
        )}
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>Sub-equipe é agrupamento operacional</strong> — não gera relatório próprio,
        não tem gestor próprio, e não muda a permissão. Continua tudo agregando pela equipe principal.
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : equipesVisiveis.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma equipe cadastrada.</p>
      ) : (
        <div className="space-y-4">
          {equipesVisiveis.map((eq) => (
            <Card key={eq.id} className={eq.active ? "" : "opacity-60"}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-4 w-4 text-primary" />
                      {eq.code.toUpperCase()}
                      {!eq.active && (
                        <Badge variant="outline" className="font-normal">
                          inativa
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{eq.name}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {podeGerirEquipe(eq.id) && eq.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNovoSubNome("");
                          setNovaSubOpen(eq);
                        }}
                        disabled={eq.subteams.length >= 10}
                        title={
                          eq.subteams.length >= 10
                            ? "Limite de 10 sub-equipes atingido"
                            : "Criar sub-equipe"
                        }
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Sub-equipe
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditNome(eq.name);
                            setEditando({ team: eq, isSub: false });
                          }}
                          title="Renomear"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setConfirmInativar({ team: eq, isSub: false, ativar: !eq.active })
                          }
                          title={eq.active ? "Inativar" : "Ativar"}
                        >
                          {eq.active ? (
                            <PowerOff className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <Power className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {eq.subteams.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Sem sub-equipes.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {eq.subteams.map((sub) => (
                      <li
                        key={sub.id}
                        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm ${
                          sub.active ? "" : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="font-normal">
                            {sub.code}
                          </Badge>
                          <span className="truncate">{sub.name}</span>
                          {!sub.active && (
                            <Badge variant="outline" className="font-normal text-xs">
                              inativa
                            </Badge>
                          )}
                        </div>
                        {podeGerirEquipe(eq.id) && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditNome(sub.name);
                                setEditando({ team: sub, isSub: true });
                              }}
                              title="Renomear"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setConfirmInativar({
                                  team: sub,
                                  isSub: true,
                                  ativar: !sub.active,
                                })
                              }
                              title={sub.active ? "Inativar" : "Ativar"}
                            >
                              {sub.active ? (
                                <PowerOff className="h-3.5 w-3.5 text-red-600" />
                              ) : (
                                <Power className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: nova equipe */}
      <Dialog open={novaEquipeOpen} onOpenChange={setNovaEquipeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova equipe da CGRIS</DialogTitle>
            <DialogDescription>
              Núcleo principal vinculado à coordenação. Aparece nos relatórios e
              dashboards. O código não pode ser alterado depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Código (curto, sem espaços)</Label>
              <Input
                value={novoCode}
                onChange={(e) => setNovoCode(e.target.value)}
                placeholder="ex: npdc"
                maxLength={16}
              />
              <p className="text-xs text-slate-500">
                letras minúsculas, números, _ ou - · até 16 caracteres
              </p>
            </div>
            <div className="space-y-1">
              <Label>Nome completo</Label>
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="ex: NPDC — Núcleo de Produtividade..."
                maxLength={120}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNovaEquipeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitCriar} disabled={criar.isPending}>
              {criar.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: nova sub-equipe */}
      <Dialog open={!!novaSubOpen} onOpenChange={(o) => (o ? null : setNovaSubOpen(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nova sub-equipe de {novaSubOpen?.code.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Agrupamento operacional dentro de {novaSubOpen?.code.toUpperCase()}.
              Não muda relatórios nem permissões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome da sub-equipe</Label>
              <Input
                value={novoSubNome}
                onChange={(e) => setNovoSubNome(e.target.value)}
                placeholder="ex: Subsídios"
                maxLength={120}
              />
              <p className="text-xs text-slate-500">
                Código será gerado automaticamente como{" "}
                <code>{novaSubOpen?.code}-N</code>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNovaSubOpen(null)}>
              Cancelar
            </Button>
            <Button onClick={submitCriarSub} disabled={criarSub.isPending}>
              {criarSub.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: renomear */}
      <Dialog open={!!editando} onOpenChange={(o) => (o ? null : setEditando(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Renomear {editando?.isSub ? "sub-equipe" : "equipe"}
            </DialogTitle>
            <DialogDescription>
              {editando?.team.code.toUpperCase()} — apenas o nome será alterado.
              O código permanece para preservar histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Novo nome</Label>
            <Input
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
              maxLength={120}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitRenomear}
              disabled={renomearEq.isPending || renomearSub.isPending}
            >
              {renomearEq.isPending || renomearSub.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmInativar}
        onOpenChange={(o) => (o ? null : setConfirmInativar(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmInativar?.ativar ? "Reativar" : "Inativar"}{" "}
              {confirmInativar?.isSub ? "sub-equipe" : "equipe"} {confirmInativar?.team.code.toUpperCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmInativar?.ativar
                ? "A equipe volta a aparecer nos selects e relatórios."
                : confirmInativar?.isSub
                  ? "Os servidores vinculados à sub-equipe ficam desvinculados. O histórico é preservado."
                  : "A equipe sai dos selects de novos cadastros. Servidores vinculados continuam onde estão e o histórico é preservado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleAtivo}>
              {confirmInativar?.ativar ? "Reativar" : "Inativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
