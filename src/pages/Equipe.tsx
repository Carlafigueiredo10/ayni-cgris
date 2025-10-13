import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Equipe() {
  const equipeExemplo = [
    { nome: "ADRIANO VICENTE MONTEIRO DA SILVA", siape: "1159975", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ALESSANDRO RODRIGUES RAMOS", siape: "3289683", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ALEXANDRE CESAR MONTEIRO DE OLIVEIRA", siape: "3417724", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ALEX BARBOSA DOS SANTOS LIMA", siape: "3411238", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ALEX BEZERRA DE MENESES", siape: "3410714", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "AMANDA DOS SANTOS SILVA", siape: "10472", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ANA PAULA DO MONTE ANUNCIACAO", siape: "1287637", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ANA PAULA LUZ NAVES CARNEIRO", siape: "1145898", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ANA VITÓRIA SOUZA JARDIM", siape: "12906", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ANDRE CAMBUY AVILA", siape: "1744812", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "AUDI PEDRO DE SOUZA", siape: "1109788", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "CAMILA ADRIELE CARVALHO BRANCO DE OLIVEIRA SANCHES", siape: "1638009", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "CARLA CRISTINE GONCALVES SOARES FIGUEIREDO", siape: "1759798", coordenacao: "Coordenação CGRIS", presencial: "Sim", email: "carla.figueiredo@cgris.gov.br", sei: "1234567" },
    { nome: "CARLOS ALBERTO FERNANDES DE ALENCAR", siape: "66622", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "CARLOS ALBERTO MENEZES DA COSTA", siape: "3376959", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "CAROLINE CORREA MACHADO", siape: "3744691", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "CLEYCIANE DOS SANTOS SOUZA", siape: "3411904", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "CRISTIANE BINOTO VIDAL RODRIGUES", siape: "1100137", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "DANIELLE CRISTINE DA SILVA", siape: "1164779", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "DANILO LIMA ALVES", siape: "3307385", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "DEBORAH LORRANE SALUSTINO DA SILVA", siape: "12549", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "EDNALVA PURCINO DOS SANTOS", siape: "10586", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "EDNILCE MARINHO SOUTO", siape: "701938", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ERICA PEREIRA VIANA", siape: "1797740", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "FÁBIO LUCAS MARTINS FERRAZ", siape: "10621", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "FREDERICO DIAS VASCONCELOS", siape: "1549738", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "GABRIELA LINS BARBOSA", siape: "2136681", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "GEDEÃO GRANGEIRO FERNANDES DE MENEZES", siape: "1289903", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "GENESIO DE FATIMA FERREIRA", siape: "1770146", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "GERALDA APARECIDA TEIXEIRA", siape: "810086", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "GILSON MARQUES GOMES DA SILVA", siape: "1098022", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "GLEICIMARA LIMA MARTINS", siape: "10657", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "HANIEL RODRIGUES FELICIANO", siape: "", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "HERISON PERDIGÃO LUCAS DA COSTA", siape: "1896893", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ICARO LEITE DA LUZ VICENTE", siape: "10677", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ISABELLE DOS SANTOS BERTO", siape: "10688", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "JAEZER DE LIMA DANTAS", siape: "250604", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "JEFFERSON DEMENEZES MELO FILHO", siape: "1947531", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "JOÃO VICTOR LOPES DE MEDEIROS", siape: "10720", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "JORDELINO SERAFIM DOS REIS", siape: "94504", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "JORDY DANTAS DA SILVA", siape: "3400371", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "JUVENAL GASTAO LOPES", siape: "3297467", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "KLEBER DRUMOND DA SILVA JUNIOR", siape: "1771704", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "LEANDRO ESTEVES DE FREITAS", siape: "1577798", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "LIANA ABIORANA DIAS FERREIRA", siape: "1781424", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "LILIANE PINHEIRO DA CONCEIÇÃO", siape: "3402166", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "LUIS FERNANDO DE SOUZA", siape: "1551067", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "LUIZ ANTONIO MARINHO DA SILVA FILHO", siape: "3477789", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MAIRA CRISTINA DA SILVA PIMENTA", siape: "1352563", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MARCELA DA SILVA RIBEIRO", siape: "10836", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MARCELO DE ARAUJO ANTONIO", siape: "3298544", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MARCIA DORNELES AMANCIO DA SILVA", siape: "1798279", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MÁRCIO GUSHIKEN GARCIA", siape: "3409894", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MARIA LUIZA DE MENDONÇA PEDROSA", siape: "1157300", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MARTA ANDRADE DA COSTA CANDIDO", siape: "1204402", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MATHEUS LUCAS CARVALHO DE SOUZA", siape: "10874", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MAYKON RIBEIRO DA SILVA", siape: "1279210", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MICHELLE MARTINS SOUZA", siape: "1039967", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "MOANE GOMES DOS SANTOS", siape: "24236", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "NACTA CALDAS CARDOSO SOARES", siape: "1061799", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "NARA ÂNGELA DOS ANJOS", siape: "1045721", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ODAIR JOSÉ MENDES LISBOA", siape: "10912", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "PAULA TEREZA DE CARVALHO PENHA", siape: "1745394", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "PAULO DE MELO SILVA", siape: "3418139", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "PAULO TADEU SANTIAGO DE ALENCAR BARROS FILHO", siape: "1271699", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "RAINIERY LIMEIRA LIMA", siape: "1745098", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "RAPHAEL MARCOS MIRANDA DOS SANTOS", siape: "3285125", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "RICARDO DE ARAÚJO SILVA", siape: "3408635", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ROGÉRIO DE SOUZA MEDINA", siape: "", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "SANDRO CARDOSO PEIXOTO", siape: "1732795", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "SELMA MOREIRA SOARES", siape: "3287463", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "SILVIA CARLA LINS E BARROS", siape: "1103137", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "THAÍS WEIL NADER MOTTA", siape: "1784990", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "THAYS DE OLIVEIRA SOARES", siape: "3408969", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "VALDICENA SILVA DE ARAUJO", siape: "1190023", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "VALÉRIA MENDONÇA ESTEVES", siape: "1940854", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "VERA LÚCIA ANDRADE DA FONSECA", siape: "3404857", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "WALASCE DE OLIVEIRA", siape: "3413844", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ZENI CERQUEIRA MOREIRA SALVADOR", siape: "1745128", coordenacao: "", presencial: "", email: "", sei: "" },
    { nome: "ZILMA CARLOS ANDRADE", siape: "19882", coordenacao: "", presencial: "", email: "", sei: "" },
  ];
  const [busca, setBusca] = useState("");
  const equipeFiltrada = equipeExemplo.filter(e =>
  e.nome.toLowerCase().includes(busca.toLowerCase()) ||
  (e.coordenacao && e.coordenacao.toLowerCase().includes(busca.toLowerCase())) ||
  (e.presencial && e.presencial.toLowerCase().includes(busca.toLowerCase())) ||
  (e.email && e.email.toLowerCase().includes(busca.toLowerCase())) ||
  (e.sei && e.sei.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-col items-center">
          {/* Adicione o ícone desejado aqui */}
          <CardTitle>Conheça Nossa Equipe</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            Aqui você pode visualizar os membros da equipe CGRIS, seus dados e períodos de férias homologados.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Força de Trabalho CGRIS</CardTitle>
          <CardDescription>Lista dos servidores e colaboradores da CGRIS.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Buscar por nome, coordenação ou cidade</Label>
            <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Digite para buscar..." />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs md:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th>Nome</th>
                  <th>Matrícula (SIAPE)</th>
                  <th>Coordenação</th>
                  <th>Comparecimento Presencial</th>
                  <th>E-mail</th>
                  <th>Processo de acesso (SEI)</th>
                </tr>
              </thead>
              <tbody>
                {equipeFiltrada.map((e, idx) => (
                  <tr key={idx}>
                    <td>{e.nome}</td>
                    <td>{e.siape}</td>
                    <td>{e.coordenacao || ""}</td>
                    <td>{e.presencial || ""}</td>
                    <td>{e.email || ""}</td>
                    <td>{e.sei || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
