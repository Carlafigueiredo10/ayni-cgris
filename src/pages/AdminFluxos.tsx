import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSeiCaixas, type SeiCaixa } from "@/hooks/use-sei-caixas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GitBranch, Save } from "lucide-react";

export default function AdminFluxos() {
  const { isAdmin, isManagerCgris, isManager, loading: authLoading } = useAuth();
  const canEdit = isAdmin || isManagerCgris || isManager;
  const { caixas, loading, updateCaixa } = useSeiCaixas({ onlyAtivo: false });

  if (authLoading) return null;
  if (!canEdit) return <Navigate to="/fluxos" replace />;

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
          <GitBranch className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Gerenciar fluxos — Caixas SEI
          </h1>
          <p className="text-sm text-muted-foreground">
            Edite a descrição de cada caixa para deixar visível o que cada uma
            trata.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SEI CGRIS</CardTitle>
          <p className="text-sm text-muted-foreground">
            {caixas.length} caixa{caixas.length === 1 ? "" : "s"} cadastrada
            {caixas.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Carregando...
            </p>
          ) : (
            <div className="space-y-4">
              {caixas.map((c) => (
                <CaixaEditor
                  key={c.id}
                  caixa={c}
                  onSave={(patch) => updateCaixa(c.id, patch)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CaixaEditor({
  caixa,
  onSave,
}: {
  caixa: SeiCaixa;
  onSave: (patch: {
    descricao?: string;
    gestor_responsavel?: string;
  }) => Promise<boolean>;
}) {
  const [descricao, setDescricao] = useState(caixa.descricao);
  const [gestor, setGestor] = useState(caixa.gestor_responsavel);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescricao(caixa.descricao);
    setGestor(caixa.gestor_responsavel);
  }, [caixa.descricao, caixa.gestor_responsavel]);

  const dirty =
    descricao !== caixa.descricao || gestor !== caixa.gestor_responsavel;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      descricao,
      gestor_responsavel: gestor,
    });
    setSaving(false);
  };

  return (
    <div className="rounded-md border border-black/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <code className="text-xs font-mono font-semibold text-primary break-all">
            {caixa.sigla}
          </code>
          <p className="mt-1 text-sm font-medium text-foreground">
            {caixa.nome_sistema}
          </p>
        </div>
        {!caixa.ativo && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            inativa
          </span>
        )}
      </div>
      <div className="mt-3 space-y-3">
        <div>
          <Label className="text-xs">Responsável</Label>
          <Input
            value={gestor}
            onChange={(e) => setGestor(e.target.value)}
            placeholder="Nome do responsável pela caixa"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Descrição / fluxo</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que é tratado nesta caixa — assuntos, fluxo, quem encaminha..."
            rows={3}
            className="text-sm"
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
