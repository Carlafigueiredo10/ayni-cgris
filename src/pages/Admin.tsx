import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUsers } from "@/hooks/use-admin-users";
import type { Profile } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Settings,
  UserPlus,
  ArrowRight,
  MoreHorizontal,
  Search,
} from "lucide-react";

type RoleValue = "admin_global" | "manager_cgris" | "manager_team" | "member";

const ROLE_LABELS: Record<RoleValue, string> = {
  admin_global: "Admin Global",
  manager_cgris: "Gestor CGRIS",
  manager_team: "Gestor de Equipe",
  member: "Membro",
};

export default function Admin() {
  const {
    isAdmin,
    isManagerCgris,
    isManager,
    profile,
    loading: authLoading,
  } = useAuth();
  const {
    profiles,
    teams,
    loading,
    createUser,
    inactivate,
    reactivate,
    resetPassword,
    updateProfile,
    assignTeam,
    promoteRole,
  } = useAdminUsers();

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>("all");

  // Modais
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (!showInactive && !p.is_active) return false;
      if (teamFilter === "pending" && p.team_id !== null) return false;
      if (
        teamFilter !== "all" &&
        teamFilter !== "pending" &&
        teams.find((t) => t.id === p.team_id)?.code !== teamFilter
      ) {
        return false;
      }
      if (s) {
        const hay = `${p.display_name || ""} ${p.email || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [profiles, teams, search, showInactive, teamFilter]);

  const counts = useMemo(() => {
    const ativos = profiles.filter((p) => p.is_active).length;
    const inativos = profiles.length - ativos;
    const pendentes = profiles.filter((p) => p.team_id === null && p.is_active).length;
    return { ativos, inativos, pendentes };
  }, [profiles]);

  const teamName = (teamId: string | null) =>
    teams.find((t) => t.id === teamId)?.code?.toUpperCase() || "-";

  if (authLoading) return null;
  if (!isAdmin && !isManagerCgris && !isManager) {
    return <Navigate to="/productivity" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Administracao</h1>
            <p className="text-sm text-muted-foreground">
              Gerenciar usuarios, equipes e permissoes
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Novo usuario
          </Button>
        )}
      </div>

      {/* Atalho roster */}
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
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/servidores">
                Gerenciar servidores
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Ativos" value={counts.ativos} />
        <StatCard label="Inativos" value={counts.inativos} />
        <StatCard label="Pendentes" value={counts.pendentes} hint="sem equipe" />
        {teams.map((t) => (
          <StatCard
            key={t.id}
            label={t.code.toUpperCase()}
            value={profiles.filter((p) => p.team_id === t.id && p.is_active).length}
            hint="ativos"
          />
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-5 pb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email"
              className="pl-8"
            />
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border rounded-md h-10 px-3 bg-background text-sm"
          >
            <option value="all">Todas equipes</option>
            <option value="pending">Sem equipe</option>
            {teams.map((t) => (
              <option key={t.id} value={t.code}>
                {t.code.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 px-3">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Mostrar inativos
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuarios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Usuarios ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhum usuario encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nome / Email</th>
                    <th className="pb-2 font-medium">Equipe</th>
                    <th className="pb-2 font-medium">Papel</th>
                    <th className="pb-2 font-medium">Status</th>
                    {isAdmin && <th className="pb-2 font-medium w-12"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isAdmin={isAdmin}
                      currentUserId={profile?.id || null}
                      teams={teams}
                      teamName={teamName}
                      onAssignTeam={(teamCode) =>
                        assignTeam.mutate({ user_id: u.id, team_code: teamCode })
                      }
                      onChangeRole={(newRole) =>
                        promoteRole.mutate({ user_id: u.id, new_role: newRole })
                      }
                      onEdit={() => setEditTarget(u)}
                      onResetPassword={() => setResetTarget(u)}
                      onInactivate={() => inactivate.mutate(u.id)}
                      onReactivate={() => reactivate.mutate(u.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: criar */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        teams={teams}
        onSubmit={(payload) =>
          createUser.mutate(payload, { onSuccess: () => setCreateOpen(false) })
        }
        loading={createUser.isPending}
      />

      {/* Dialog: editar */}
      <EditProfileDialog
        target={editTarget}
        currentUserId={profile?.id || null}
        onClose={() => setEditTarget(null)}
        onSubmit={(payload) =>
          updateProfile.mutate(payload, {
            onSuccess: () => setEditTarget(null),
          })
        }
        loading={updateProfile.isPending}
      />

      {/* Dialog: reset senha */}
      <ResetPasswordDialog
        target={resetTarget}
        onClose={() => setResetTarget(null)}
        onSubmit={(payload) =>
          resetPassword.mutate(payload, {
            onSuccess: () => setResetTarget(null),
          })
        }
        loading={resetPassword.isPending}
      />
    </div>
  );
}

// ============================================================
// StatCard
// ============================================================
function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

// ============================================================
// UserRow
// ============================================================
type UserRowProps = {
  user: Profile;
  isAdmin: boolean;
  currentUserId: string | null;
  teams: { id: string; code: string; name: string }[];
  teamName: (teamId: string | null) => string;
  onAssignTeam: (teamCode: string) => void;
  onChangeRole: (newRole: string) => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onInactivate: () => void;
  onReactivate: () => void;
};

function UserRow({
  user,
  isAdmin,
  currentUserId,
  teams,
  teamName,
  onAssignTeam,
  onChangeRole,
  onEdit,
  onResetPassword,
  onInactivate,
  onReactivate,
}: UserRowProps) {
  const isSelf = currentUserId === user.id;
  const isProtectedAdmin = user.role === "admin_global" && !isSelf;

  return (
    <tr className="border-b last:border-0">
      <td className="py-2">
        <div className="font-medium">{user.display_name || user.email}</div>
        {user.display_name && (
          <div className="text-xs text-muted-foreground">{user.email}</div>
        )}
      </td>
      <td className="py-2">
        {isAdmin ? (
          <select
            value={teams.find((t) => t.id === user.team_id)?.code || ""}
            onChange={(e) => e.target.value && onAssignTeam(e.target.value)}
            className="border rounded-md h-8 px-2 bg-background text-xs"
          >
            <option value="">{user.team_id ? teamName(user.team_id) : "Sem equipe"}</option>
            {teams.map((t) => (
              <option key={t.id} value={t.code}>
                {t.code.toUpperCase()}
              </option>
            ))}
          </select>
        ) : (
          teamName(user.team_id)
        )}
      </td>
      <td className="py-2">
        {isAdmin && !isProtectedAdmin ? (
          <select
            value={user.role}
            onChange={(e) => onChangeRole(e.target.value)}
            className="border rounded-md h-8 px-2 bg-background text-xs"
          >
            <option value="member">Membro</option>
            <option value="manager_team">Gestor Equipe</option>
            <option value="manager_cgris">Gestor CGRIS</option>
            <option value="admin_global">Admin</option>
          </select>
        ) : (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
              user.role === "admin_global"
                ? "bg-primary/10 text-primary"
                : user.role === "manager_team"
                  ? "bg-accent/20 text-accent-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {ROLE_LABELS[user.role]}
          </span>
        )}
      </td>
      <td className="py-2">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            user.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {user.is_active ? "Ativo" : "Inativo"}
        </span>
      </td>
      {isAdmin && (
        <td className="py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Editar perfil</DropdownMenuItem>
              {!isProtectedAdmin && (
                <DropdownMenuItem onClick={onResetPassword}>
                  Resetar senha
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user.is_active ? (
                !isProtectedAdmin && !isSelf ? (
                  <DropdownMenuItem
                    onClick={onInactivate}
                    className="text-destructive focus:text-destructive"
                  >
                    Inativar
                  </DropdownMenuItem>
                ) : null
              ) : (
                <DropdownMenuItem onClick={onReactivate}>
                  Reativar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      )}
    </tr>
  );
}

// ============================================================
// CreateUserDialog
// ============================================================
function CreateUserDialog({
  open,
  onOpenChange,
  teams,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teams: { id: string; code: string; name: string }[];
  onSubmit: (payload: {
    email: string;
    display_name?: string;
    role?: RoleValue;
    team_code?: string;
    password?: string;
  }) => void;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleValue>("member");
  const [teamCode, setTeamCode] = useState<string>("");
  const [password, setPassword] = useState("");

  const reset = () => {
    setEmail("");
    setName("");
    setRole("member");
    setTeamCode("");
    setPassword("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuario</DialogTitle>
          <DialogDescription>
            Senha gerada automaticamente se nao informar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Email *</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="usuario@gestao.gov.br"
            />
          </div>
          <div>
            <Label>Nome de exibicao</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Papel</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleValue)}
                className="w-full border rounded-md h-10 px-3 bg-background text-sm"
              >
                <option value="member">Membro</option>
                <option value="manager_team">Gestor de Equipe</option>
                <option value="manager_cgris">Gestor CGRIS</option>
                <option value="admin_global">Admin Global</option>
              </select>
            </div>
            <div>
              <Label>Equipe</Label>
              <select
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                className="w-full border rounded-md h-10 px-3 bg-background text-sm"
              >
                <option value="">Sem equipe</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Senha (opcional)</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe vazio para gerar automaticamente"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!email || loading}
            onClick={() =>
              onSubmit({
                email,
                display_name: name || undefined,
                role,
                team_code: teamCode || undefined,
                password: password || undefined,
              })
            }
          >
            {loading ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// EditProfileDialog
// ============================================================
function EditProfileDialog({
  target,
  currentUserId,
  onClose,
  onSubmit,
  loading,
}: {
  target: Profile | null;
  currentUserId: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    user_id: string;
    display_name?: string;
    email?: string;
  }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const isOpen = !!target;
  const isProtectedAdmin =
    target?.role === "admin_global" && target?.id !== currentUserId;

  useEffect(() => {
    if (target) {
      setName(target.display_name || "");
      setEmail(target.email || "");
    }
  }, [target]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setName("");
          setEmail("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            {isProtectedAdmin
              ? "Apenas o nome de outro admin pode ser alterado."
              : "Atualizar nome e email."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome de exibicao</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isProtectedAdmin}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!target || loading}
            onClick={() =>
              target &&
              onSubmit({
                user_id: target.id,
                display_name:
                  name && name !== target.display_name ? name : undefined,
                email:
                  email && email !== target.email && !isProtectedAdmin
                    ? email
                    : undefined,
              })
            }
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ResetPasswordDialog
// ============================================================
function ResetPasswordDialog({
  target,
  onClose,
  onSubmit,
  loading,
}: {
  target: Profile | null;
  onClose: () => void;
  onSubmit: (payload: {
    user_id: string;
    mode: "email" | "set_temp";
    new_password?: string;
  }) => void;
  loading: boolean;
}) {
  const [mode, setMode] = useState<"email" | "set_temp">("email");
  const [pwd, setPwd] = useState("");
  const isOpen = !!target;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setMode("email");
          setPwd("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar senha</DialogTitle>
          <DialogDescription>
            {target?.display_name || target?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as "email" | "set_temp")}
          >
            <div className="flex items-start gap-2 py-1">
              <RadioGroupItem value="email" id="mode-email" />
              <div>
                <Label htmlFor="mode-email" className="font-medium">
                  Enviar email de recuperacao
                </Label>
                <p className="text-xs text-muted-foreground">
                  Usuario recebe link e define a propria senha.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 py-1">
              <RadioGroupItem value="set_temp" id="mode-temp" />
              <div>
                <Label htmlFor="mode-temp" className="font-medium">
                  Definir senha temporaria
                </Label>
                <p className="text-xs text-muted-foreground">
                  Voce passa a senha pro usuario manualmente.
                </p>
              </div>
            </div>
          </RadioGroup>

          {mode === "set_temp" && (
            <div>
              <Label>Senha (opcional)</Label>
              <Input
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Vazio = gerada automaticamente"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!target || loading}
            onClick={() =>
              target &&
              onSubmit({
                user_id: target.id,
                mode,
                new_password:
                  mode === "set_temp" && pwd ? pwd : undefined,
              })
            }
          >
            {loading ? "Processando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
