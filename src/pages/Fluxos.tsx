import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSeiCaixas, type SeiCaixa } from "@/hooks/use-sei-caixas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitBranch, Search, Settings, Inbox } from "lucide-react";

export default function Fluxos() {
  const { isAdmin, isManagerCgris, isManager } = useAuth();
  const canManage = isAdmin || isManagerCgris || isManager;
  const { caixas, loading } = useSeiCaixas({ onlyAtivo: true });
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return caixas;
    return caixas.filter(
      (c) =>
        c.sigla.toLowerCase().includes(q) ||
        c.nome_sistema.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q) ||
        c.gestor_responsavel.toLowerCase().includes(q)
    );
  }, [caixas, busca]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GitBranch className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Fluxos e Procedimentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Para onde enviar cada demanda — caixas SEI da CGRIS
            </p>
          </div>
        </div>
        {canManage && (
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/fluxos">
              <Settings className="mr-1.5 h-4 w-4" />
              Gerenciar
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4 text-primary" />
            SEI CGRIS
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lista das unidades SEI da CGRIS. Use a descrição para identificar
            qual caixa recebe cada tipo de demanda.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por caixa, descrição ou responsável..."
              className="pl-8"
            />
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Carregando...
            </p>
          ) : filtradas.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {caixas.length === 0
                ? "Nenhuma caixa cadastrada."
                : "Nenhuma caixa corresponde à busca."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-black/10">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left w-[28%]">Caixa</th>
                    <th className="px-4 py-2 text-left">Descrição</th>
                    <th className="px-4 py-2 text-left w-[20%]">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((c) => (
                    <CaixaRow key={c.id} caixa={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CaixaRow({ caixa }: { caixa: SeiCaixa }) {
  const responsavel = caixa.gestor_responsavel.trim();
  const descricao = caixa.descricao.trim();
  return (
    <tr className="border-t border-black/5 align-top">
      <td className="px-4 py-3">
        <code className="text-xs font-mono font-semibold text-primary break-all">
          {caixa.sigla}
        </code>
        <p className="mt-1 text-sm font-medium text-foreground">
          {caixa.nome_sistema}
        </p>
      </td>
      <td className="px-4 py-3">
        {descricao ? (
          <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
            {descricao}
          </p>
        ) : (
          <span className="italic text-muted-foreground">
            Descrição ainda não informada.
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {responsavel ? (
          <span className="font-medium text-foreground">{responsavel}</span>
        ) : (
          <span className="italic text-muted-foreground">não definido</span>
        )}
      </td>
    </tr>
  );
}
