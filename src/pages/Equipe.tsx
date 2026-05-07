import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServidores } from "@/hooks/use-servidores";

export default function Equipe() {
  const { servidores, loading, error } = useServidores();
  const [busca, setBusca] = useState("");

  const q = busca.trim().toLowerCase();
  const filtrados = q
    ? servidores.filter(
        (s) =>
          s.nome.toLowerCase().includes(q) ||
          (s.siape ?? "").toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q) ||
          (s.team_code ?? "").toLowerCase().includes(q)
      )
    : servidores;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-col items-center">
          <CardTitle>Conheça Nossa Equipe</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            Visualize os membros da equipe CGRIS, suas equipes e formato de
            trabalho.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Força de Trabalho CGRIS</CardTitle>
          <CardDescription>
            {loading
              ? "Carregando..."
              : `${servidores.length} servidores ativos`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Buscar por nome, SIAPE, email ou equipe</Label>
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite para buscar..."
            />
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
                    <th className="text-left p-2">Presencial</th>
                    <th className="text-left p-2">E-mail</th>
                    <th className="text-left p-2">Status</th>
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
                      <td className="p-2">{s.presencial ? "Sim" : "Não"}</td>
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
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td
                        className="p-4 text-center text-muted-foreground"
                        colSpan={6}
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
    </div>
  );
}
