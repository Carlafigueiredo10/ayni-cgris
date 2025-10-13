import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PGD() {
  const pgdLinks = [
    {
      label: "Link pro PGD",
      href: "https://sistema-pgd.exemplo.gov.br",
    },
    {
      label: "Faça seu plano de trabalho",
      href: "https://sistema-pgd.exemplo.gov.br/plano",
    },
    {
      label: "Manual de instruções",
      href: "/downloads/4Planotrabalho2Edio.pdf",
    },
  ];
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Acesso rápido ao PGD</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pgdLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-blue-700 underline font-medium"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que é o PGD?</CardTitle>
          <CardDescription>
            O Plano de Gestão e Desempenho (PGD) é uma ferramenta para organizar, registrar e acompanhar as atividades dos servidores. Ele permite maior flexibilidade, transparência e controle dos resultados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Monte seu plano de trabalho conforme as diretrizes do órgão.</li>
            <li>Registre atividades, metas e entregas previstas.</li>
            <li>Consulte o manual oficial para orientações detalhadas.</li>
          </ul>
          <a
            href="/downloads/4Planotrabalho2Edio.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline font-medium"
          >
            Baixar Manual do Plano de Trabalho (PDF)
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center text-center">
          <img
            src="/src/assets/chatpgd-brain.png"
            alt="ChatPGD e AVP"
            className="w-32 h-32 object-cover rounded mb-4 shadow-md"
          />
          <h2 className="text-xl font-bold mb-2">ChatPGD e AVP</h2>
          <p className="text-muted-foreground mb-4">
            Conte com a ajuda da inteligência artificial para entender melhor o PGD e planejar com mais facilidade as entregas da sua unidade.
          </p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <a href="https://chatgpt.com/g/g-63dRu9vPJ-chat-pgd?model=gpt-4o" target="_blank" rel="noopener noreferrer">
              Acessar Chat PGD
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
