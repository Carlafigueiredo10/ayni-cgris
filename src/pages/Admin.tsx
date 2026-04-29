import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Users, UserPlus, ArrowRight } from "lucide-react";

export default function Admin() {
  const { isAdmin, isManager, loading: authLoading } = useAuth();
  const {
    pendingUsers,
    teamMembers,
    teams,
    loading,
    assignTeam,
    promoteRole,
    teamName,
  } = useAdmin();

  const [selectedTeam, setSelectedTeam] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});

  if (authLoading) return null;
  if (!isAdmin && !isManager) return <Navigate to="/productivity" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Administracao</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciar equipes e permissoes
          </p>
        </div>
      </div>

      {/* Atalho para roster */}
      {isAdmin && (
        <Card>
          <CardContent className="flex items-center justify-between pt-5 pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Roster institucional
              </p>
              <p className="text-sm text-muted-foreground">
                Editar servidores, equipes, presencial e status
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/admin/servidores">
                Gerenciar servidores
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pendentes
            </p>
            <p className="text-2xl font-bold text-foreground">
              {pendingUsers.length}
            </p>
          </CardContent>
        </Card>
        {teams.map((t) => (
          <Card key={t.id}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.code.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {teamMembers.filter((m) => m.team_id === t.id).length}
              </p>
              <p className="text-xs text-muted-foreground">membros</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pendentes */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Usuarios sem equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nome/Email</th>
                    <th className="pb-2 font-medium">Equipe</th>
                    <th className="pb-2 font-medium w-28">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div>{u.display_name || u.email}</div>
                        {u.display_name && (
                          <div className="text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        )}
                      </td>
                      <td className="py-2">
                        <select
                          value={selectedTeam[u.id] || ""}
                          onChange={(e) =>
                            setSelectedTeam({
                              ...selectedTeam,
                              [u.id]: e.target.value,
                            })
                          }
                          className="border rounded-md h-8 px-2 bg-background text-sm"
                        >
                          <option value="">Selecione</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.code}>
                              {t.code.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          disabled={!selectedTeam[u.id]}
                          onClick={() =>
                            assignTeam(u.id, selectedTeam[u.id])
                          }
                        >
                          Atribuir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membros das equipes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Membros por equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nome/Email</th>
                    <th className="pb-2 font-medium">Equipe</th>
                    <th className="pb-2 font-medium">Papel</th>
                    {isAdmin && (
                      <th className="pb-2 font-medium w-36">Alterar papel</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div>{m.display_name || m.email}</div>
                        {m.display_name && (
                          <div className="text-xs text-muted-foreground">
                            {m.email}
                          </div>
                        )}
                      </td>
                      <td className="py-2">{teamName(m.team_id)}</td>
                      <td className="py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            m.role === "admin_global"
                              ? "bg-primary/10 text-primary"
                              : m.role === "manager_team"
                                ? "bg-accent/20 text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-2">
                          <div className="flex gap-1">
                            <select
                              value={selectedRole[m.id] || m.role}
                              onChange={(e) =>
                                setSelectedRole({
                                  ...selectedRole,
                                  [m.id]: e.target.value,
                                })
                              }
                              className="border rounded-md h-8 px-2 bg-background text-xs"
                            >
                              <option value="member">member</option>
                              <option value="manager_team">manager_team</option>
                              <option value="admin_global">admin_global</option>
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                !selectedRole[m.id] ||
                                selectedRole[m.id] === m.role
                              }
                              onClick={() =>
                                promoteRole(m.id, selectedRole[m.id])
                              }
                            >
                              Salvar
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {teamMembers.length === 0 && (
                    <tr>
                      <td
                        className="py-8 text-center text-muted-foreground"
                        colSpan={4}
                      >
                        Nenhum membro atribuido ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
