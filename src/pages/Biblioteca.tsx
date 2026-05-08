import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function Biblioteca() {
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
    </div>
  );
}
