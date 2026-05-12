import { useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useServidoresAdmin,
  type ServidorAdmin,
} from "@/hooks/use-servidores-admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Users } from "lucide-react";
import ServidorEditModal from "@/components/admin/ServidorEditModal";

export default function AdminServidores() {
  const { isAdmin, profile, loading: authLoading } = useAuth();
  const { servidores, loading, save } = useServidoresAdmin();

  const [busca, setBusca] = useState("");
  const [showInativos, setShowInativos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServidorAdmin | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return servidores.filter((s) => {
      if (!showInativos && !s.ativo) return false;
      if (!q) return true;
      return (
        s.nome.toLowerCase().includes(q) ||
        (s.siape ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.team_code ?? "").toLowerCase().includes(q)
      );
    });
  }, [servidores, busca, showInativos]);

  if (authLoading) return null;
  if (profile === null) return null;
  if (!isAdmin) return <Navigate to="/meu-painel" replace />;

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (s: ServidorAdmin) => {
    setEditing(s);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Admin
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Servidores</h1>
          <p className="text-sm text-muted-foreground">
            Roster institucional — {servidores.length} registros (
            {servidores.filter((s) => s.ativo).length} ativos)
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar servidor
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-medium text-muted-foreground">
              Buscar
            </label>
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, SIAPE, email ou equipe..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => setShowInativos(e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar inativos
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-muted-foreground py-4">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">SIAPE</th>
                    <th className="pb-2 font-medium">Equipe</th>
                    <th className="pb-2 font-medium">Sub-equipe</th>
                    <th className="pb-2 font-medium">Regime</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium w-20">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b last:border-0 ${
                        !s.ativo ? "opacity-50" : ""
                      }`}
                    >
                      <td className="py-2">{s.nome}</td>
                      <td className="py-2">{s.siape ?? "—"}</td>
                      <td className="py-2">
                        {s.team_code ? s.team_code.toUpperCase() : "—"}
                      </td>
                      <td className="py-2">
                        {s.subteam_name ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200">
                            {s.subteam_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 capitalize">{s.regime ?? "—"}</td>
                      <td className="py-2">{s.email ?? "—"}</td>
                      <td className="py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs ${
                            s.ativo
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(s)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td
                        className="py-8 text-center text-muted-foreground"
                        colSpan={8}
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
        servidor={editing}
        onSave={save}
      />
    </div>
  );
}
