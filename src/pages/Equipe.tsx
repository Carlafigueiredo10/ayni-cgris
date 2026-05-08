import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Upload } from "lucide-react";
import { useServidores, type Servidor } from "@/hooks/use-servidores";
import { useTeams } from "@/hooks/use-teams";
import { useAuth } from "@/contexts/AuthContext";
import ServidorEditModal, {
  type ServidorEditTarget,
} from "@/components/admin/ServidorEditModal";
import EquipeImportCsvModal from "@/components/equipe/EquipeImportCsvModal";

export default function Equipe() {
  const { servidores, loading, error, save, refresh } = useServidores();
  const { data: teams = [] } = useTeams();
  const { isAdmin, isManagerCgris, isManager, profile } = useAuth();

  const equipesPrincipais = useMemo(
    () =>
      teams
        .filter((t) => t.parent_id === null && t.active)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [teams]
  );

  const [busca, setBusca] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState<string>("");
  const [filtroRegime, setFiltroRegime] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servidor | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const canEditAll = isAdmin || isManagerCgris;
  const canEditOwnTeam = isManager;
  const canEdit = canEditAll || canEditOwnTeam;

  // manager_team: trava o select de equipe na propria equipe
  const lockedTeamCode =
    isManager && !isAdmin && !isManagerCgris
      ? servidores.find((s) => s.team_id === profile?.team_id)?.team_code ?? null
      : null;

  // manager_team: so pode editar servidores da propria equipe
  const canEditServidor = (s: Servidor) => {
    if (canEditAll) return true;
    if (canEditOwnTeam) return s.team_id === profile?.team_id;
    return false;
  };

  const q = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    return servidores.filter((s) => {
      if (q) {
        const hay = `${s.nome} ${s.siape ?? ""} ${s.email ?? ""} ${
          s.team_code ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filtroEquipe) {
        if (filtroEquipe === "__none__") {
          if (s.team_code) return false;
        } else if (s.team_code !== filtroEquipe) {
          return false;
        }
      }
      if (filtroRegime) {
        if (filtroRegime === "__none__") {
          if (s.regime) return false;
        } else if (s.regime !== filtroRegime) {
          return false;
        }
      }
      if (filtroStatus) {
        if (filtroStatus === "ativo" && !s.usuario_ativo) return false;
        if (filtroStatus === "nao_ativado" && s.usuario_ativo) return false;
      }
      return true;
    });
  }, [servidores, q, filtroEquipe, filtroRegime, filtroStatus]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (s: Servidor) => {
    if (!canEditServidor(s)) return;
    setEditing(s);
    setModalOpen(true);
  };

  const editTarget: ServidorEditTarget | null = editing
    ? {
        id: editing.id,
        nome: editing.nome,
        siape: editing.siape,
        email: editing.email,
        team_code: editing.team_code,
        subteam_id: editing.subteam_id,
        regime: editing.regime,
        ativo: editing.ativo,
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-col items-center">
          <CardTitle>Conheça Nossa Equipe</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            Visualize os membros da equipe CGRIS, suas equipes e regime de
            trabalho.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Força de Trabalho CGRIS</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${servidores.length} servidores ativos`}
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {canEditAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Importar CSV
                </Button>
              )}
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar servidor
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Buscar</Label>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, SIAPE, email..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Equipe</Label>
              <select
                value={filtroEquipe}
                onChange={(e) => setFiltroEquipe(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {equipesPrincipais.map((eq) => (
                  <option key={eq.code} value={eq.code}>
                    {eq.code.toUpperCase()}
                  </option>
                ))}
                <option value="__none__">Sem equipe</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Regime</Label>
              <select
                value={filtroRegime}
                onChange={(e) => setFiltroRegime(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
                <option value="__none__">Não definido</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo no sistema</option>
                <option value="nao_ativado">Não ativado</option>
              </select>
            </div>
          </div>

          {error ? (
            <p className="text-destructive py-4">Erro ao carregar: {error}</p>
          ) : loading ? (
            <p className="text-muted-foreground py-4">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs md:text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">SIAPE</th>
                    <th className="text-left p-2">Equipe</th>
                    <th className="text-left p-2">Sub-equipe</th>
                    <th className="text-left p-2">Regime</th>
                    <th className="text-left p-2">E-mail</th>
                    <th className="text-left p-2">Status</th>
                    {canEdit && <th className="text-left p-2 w-20">Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{s.nome}</td>
                      <td className="p-2">{s.siape ?? "—"}</td>
                      <td className="p-2">
                        {s.team_code ? s.team_code.toUpperCase() : "—"}
                      </td>
                      <td className="p-2">
                        {s.subteam_name ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200">
                            {s.subteam_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2 capitalize">{s.regime ?? "—"}</td>
                      <td className="p-2">{s.email ?? "—"}</td>
                      <td className="p-2">
                        {s.usuario_ativo ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            Ativo no sistema
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Não ativado
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="p-2">
                          {canEditServidor(s) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => handleEdit(s)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td
                        className="p-4 text-center text-muted-foreground"
                        colSpan={canEdit ? 8 : 7}
                      >
                        Nenhum servidor encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ServidorEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        servidor={editTarget}
        onSave={save}
        lockedTeamCode={lockedTeamCode}
      />

      <EquipeImportCsvModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refresh}
      />
    </div>
  );
}
