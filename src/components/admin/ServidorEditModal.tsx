import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ServidorInput } from "@/hooks/use-servidores";
import type { Regime } from "@/contexts/AuthContext";

export type ServidorEditTarget = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_code: string | null;
  regime: Regime | null;
  ativo: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidor: ServidorEditTarget | null;
  onSave: (input: ServidorInput) => Promise<boolean>;
  /**
   * Quando passado, trava o select de equipe nesse code (manager_team).
   * O backend tambem valida — isso e so UX.
   */
  lockedTeamCode?: string | null;
};

const TEAM_OPTIONS = [
  { value: "", label: "— (transversal)" },
  { value: "cocon", label: "COCON" },
  { value: "codej", label: "CODEJ" },
  { value: "natos", label: "NATOS" },
];

export default function ServidorEditModal({
  open,
  onOpenChange,
  servidor,
  onSave,
  lockedTeamCode,
}: Props) {
  const [nome, setNome] = useState("");
  const [siape, setSiape] = useState("");
  const [email, setEmail] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [regime, setRegime] = useState<Regime | "">("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(servidor?.nome ?? "");
      setSiape(servidor?.siape ?? "");
      setEmail(servidor?.email ?? "");
      setTeamCode(
        lockedTeamCode ?? servidor?.team_code ?? ""
      );
      setRegime((servidor?.regime as Regime | null) ?? "");
      setAtivo(servidor?.ativo ?? true);
    }
  }, [open, servidor, lockedTeamCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({
      id: servidor?.id ?? null,
      nome,
      siape,
      email,
      team_code: lockedTeamCode ?? teamCode,
      regime,
      ativo,
    });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {servidor ? "Editar servidor" : "Adicionar servidor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siape">SIAPE</Label>
              <Input
                id="siape"
                value={siape}
                onChange={(e) => setSiape(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Equipe</Label>
              <select
                id="team"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                disabled={!!lockedTeamCode}
                className="w-full border rounded-md h-10 px-3 bg-background text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {TEAM_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {lockedTeamCode && (
                <p className="text-[11px] text-muted-foreground">
                  Gestor de equipe edita apenas a própria coordenação.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@gestao.gov.br"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regime">Regime de trabalho</Label>
            <select
              id="regime"
              value={regime}
              onChange={(e) => setRegime(e.target.value as Regime | "")}
              className="w-full border rounded-md h-10 px-3 bg-background text-sm"
            >
              <option value="">Não definido</option>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={ativo}
                onCheckedChange={(v) => setAtivo(v === true)}
              />
              Ativo
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
