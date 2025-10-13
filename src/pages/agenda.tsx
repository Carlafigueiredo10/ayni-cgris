import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reunioesExemplo = [
  { tipo: "Equipe", data: "2025-10-15", hora: "14:00" },
  { tipo: "Coordenador(a)", data: "2025-10-18", hora: "10:00" },
  { tipo: "Coordenador(a) Geral", data: "2025-10-20", hora: "16:00" },
];

export default function CalendarioReunioes() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Reuniões</CardTitle>
          <CardDescription>Veja as próximas reuniões agendadas. Para agendar ou visualizar no Teams, clique abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {reunioesExemplo.map((r, i) => (
              <div key={i} className="p-3 border rounded-md bg-accent/10 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.tipo}</div>
                  <div className="text-sm text-muted-foreground">{r.data} às {r.hora}</div>
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <a href="https://teams.microsoft.com" target="_blank" rel="noopener noreferrer">
              Abrir agenda no Teams
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
