import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PGD_URL = "https://www.gov.br/servidor/pt-br/assuntos/programa-de-gestao";
const CHAT_PGD_URL = "https://chatpgd.gestao.gov.br/";

export default function PGD() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Acesso rápido ao PGD</CardTitle>
          <CardDescription>
            Página oficial do Programa de Gestão e Desempenho no portal gov.br
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a
              href={PGD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Acessar página do PGD
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que é o PGD?</CardTitle>
          <CardDescription>
            O Plano de Gestão e Desempenho (PGD) é uma ferramenta para
            organizar, registrar e acompanhar as atividades dos servidores. Ele
            permite maior flexibilidade, transparência e controle dos
            resultados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Monte seu plano de trabalho conforme as diretrizes do órgão.</li>
            <li>Registre atividades, metas e entregas previstas.</li>
            <li>
              Manuais e orientações oficiais ficam disponíveis na{" "}
              <a
                href={PGD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-medium"
              >
                página do PGD
              </a>
              .
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ChatPGD</CardTitle>
          <CardDescription>
            Assistente oficial do PGD para tirar dúvidas e ajudar a planejar
            entregas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <a
              href={CHAT_PGD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Acessar ChatPGD
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
