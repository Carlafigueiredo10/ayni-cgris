import { useEffect, useState } from "react";
import { useAuth, type Regime } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
import { UserCircle } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = {
  admin_global: "Admin Global",
  manager_cgris: "Gestor CGRIS",
  manager_team: "Gestor de Equipe",
  member: "Membro",
};

export default function Perfil() {
  const { profile, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [siape, setSiape] = useState("");
  const [regime, setRegime] = useState<Regime | "">("");
  const [saving, setSaving] = useState(false);
  const [teamLabel, setTeamLabel] = useState<string>("—");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setSiape(profile.siape || "");
      setRegime((profile.regime as Regime | null) || "");
    }
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    async function loadTeam() {
      if (!profile?.team_id) {
        if (mounted) setTeamLabel("—");
        return;
      }
      const { data, error } = await supabase
        .from("teams")
        .select("code, name")
        .eq("id", profile.team_id)
        .single();
      if (!mounted) return;
      if (error || !data) setTeamLabel("—");
      else setTeamLabel(`${data.code.toUpperCase()} — ${data.name}`);
    }
    loadTeam();
    return () => {
      mounted = false;
    };
  }, [profile?.team_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.rpc("update_my_profile", {
      p_display_name: displayName || null,
      p_siape: siape || null,
      p_regime: regime || null,
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Perfil atualizado");
    // Atualiza o profile no contexto pra refletir nos outros lugares
    window.location.reload();
  };

  if (authLoading) return null;
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
          <UserCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Meu perfil</h1>
          <p className="text-sm text-muted-foreground">
            Atualize seus dados pessoais. A coordenação pode sobrescrever quando
            necessário.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados editáveis</CardTitle>
          <CardDescription>
            Nome de exibição, SIAPE e regime de trabalho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome de exibição</Label>
              <Input
                id="nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siape">SIAPE</Label>
              <Input
                id="siape"
                value={siape}
                onChange={(e) => setSiape(e.target.value)}
                placeholder="Sua matrícula SIAPE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regime">Regime de trabalho</Label>
              <select
                id="regime"
                value={regime}
                onChange={(e) => setRegime(e.target.value as Regime | "")}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Não definido</option>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados institucionais</CardTitle>
          <CardDescription>
            Para alterar e-mail, papel ou equipe, fale com a coordenação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">
                E-mail
              </dt>
              <dd className="font-medium">{profile.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">
                Equipe
              </dt>
              <dd className="font-medium">{teamLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Papel</dt>
              <dd className="font-medium">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">
                Status
              </dt>
              <dd className="font-medium">
                {profile.is_active ? "Ativo" : "Inativo"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
