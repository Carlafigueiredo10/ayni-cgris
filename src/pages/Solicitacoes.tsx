import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const sistemas = ["SIAPE", "SIGEPE", "SEI", "SIGRH", "Outro"];
const reuniaoCom = ["Núcleo", "Coordenador(a)", "Coordenador(a) Geral"];

export default function Solicitacoes() {
  const [sistema, setSistema] = useState("");
  const [reuniao, setReuniao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Solicitação de acesso a sistema</CardTitle>
          <CardDescription>
            Escolha o sistema para o qual precisa de acesso. Você receberá o modelo de formulário para preencher no SEI 9.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Sistema</Label>
          <select
            className="w-full border rounded-md h-10 px-3 mb-4"
            value={sistema}
            onChange={e => setSistema(e.target.value)}
          >
            <option value="">Selecione</option>
            {sistemas.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {sistema && (
            <div className="p-3 border rounded-md bg-accent/10">
              <div className="font-semibold mb-1">Modelo de formulário para SEI 9</div>
              <div className="text-sm text-muted-foreground mb-2">
                Baixe o modelo, preencha e envie pelo SEI 9 conforme instruções internas.
              </div>
              <Button asChild>
                <a href="#" download>
                  Baixar modelo para {sistema}
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendar reunião</CardTitle>
          <CardDescription>Solicite uma reunião com o núcleo, coordenador(a) ou coordenador(a) geral.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Com quem deseja se reunir?</Label>
          <select
            className="w-full border rounded-md h-10 px-3 mb-4"
            value={reuniao}
            onChange={e => setReuniao(e.target.value)}
          >
            <option value="">Selecione</option>
            {reuniaoCom.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Data sugerida</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <Label>Horário sugerido</Label>
              <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
          </div>
          <Label>Motivo</Label>
          <Input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Descreva o motivo da reunião" />
          <Button className="mt-4">Solicitar reunião</Button>
        </CardContent>
      </Card>
    </div>
  );
}
