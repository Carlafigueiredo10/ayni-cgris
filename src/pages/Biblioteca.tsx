import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Comunicado } from "@/lib/comunicado";

const modelos = [
  { tipo: "Nota Técnica", link: "#" },
  { tipo: "Ofício", link: "#" },
  { tipo: "Despacho", link: "#" },
];

const comunicadosExemplo: Comunicado[] = [
  {
    id: "1",
    titulo: "Novo modelo de despacho disponível",
    mensagem: "Confira o novo modelo de despacho para processos judiciais.",
    data: "2025-10-12",
    autor: "Equipe CGRIS",
  },
  {
    id: "2",
    titulo: "Atualização nos formulários",
    mensagem: "Os formulários de controle foram atualizados.",
    data: "2025-10-10",
    autor: "Equipe CGRIS",
  },
];

export default function Biblioteca() {
  const [comunicados] = useState<Comunicado[]>(comunicadosExemplo);
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex items-center gap-4">
          <div className="bg-cyan-400 rounded-lg p-3">
            <ExternalLink className="w-7 h-7 text-white" />
          </div>
          <CardTitle>Biblioteca de Modelos: Notas Técnicas, Despachos e Formulários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-muted-foreground">
            Acesse modelos prontos de documentos e formulários para agilizar seu trabalho.
          </p>
          <Button asChild className="mt-4 bg-cyan-500 text-white font-semibold">
            <a href="/biblioteca">Acessar Biblioteca de Modelos</a>
          </Button>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-rose-600 font-semibold">Em breve</span>
            <span className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <span>🪄</span> Novidade
            </span>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4 mt-8">
        {comunicados.map((c) => (
          <div key={c.id} className="p-3 border rounded-md bg-accent/10">
            <div className="font-semibold">{c.titulo}</div>
            <div className="text-sm text-muted-foreground">{c.mensagem}</div>
            <div className="text-xs mt-1">{c.data} {c.autor && `- ${c.autor}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
