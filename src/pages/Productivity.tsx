import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import llamaScene from "@/assets/llama-mountain-scene.png";
import llamaCharacter from "@/assets/llama-character.png";

// --- Novos imports para relatórios e gráficos ---
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Tipos para o novo registro detalhado
type Registro = {
  servidor?: string;
  data: string;
  processo: string;
  status: "Concluído" | "Encaminhado" | "Solicitada informação externa";
  minutos: number; // ✅ MUDANÇA: horas → minutos
};

const MONTHLY_GOAL = 120;

const Productivity = () => {
  const navigate = useNavigate();

  // Estados existentes (mantidos)
  const [myDeliveries, setMyDeliveries] = useState(0);
  const [teamDeliveries, setTeamDeliveries] = useState(0);
  const [codejTotal, setCodejTotal] = useState(0);
  const [coconTotal, setCoconTotal] = useState(0);
  const [deliveryAmount, setDeliveryAmount] = useState("");

  // ✅ Novos estados para o formulário detalhado e relatórios
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [novo, setNovo] = useState<Registro>({
    servidor: "Servidor X",
    data: "",
    processo: "",
    status: "Concluído",
    minutos: 0, // ✅ MUDANÇA: horas → minutos
  });

  const myProgress = (myDeliveries / MONTHLY_GOAL) * 100;
  const teamProgress = (teamDeliveries / MONTHLY_GOAL) * 100;

  // Mantido: adicionar entregas numéricas para aba Equipe
  const handleAddDelivery = (isTeam: boolean = false) => {
    const amount = parseInt(deliveryAmount);
    if (!amount || amount <= 0) {
      toast.error("Por favor, insira um número válido");
      return;
    }

    if (isTeam) {
      setTeamDeliveries((prev) => prev + amount);
      toast.success(`${amount} entregas adicionadas à equipe!`);
    } else {
      setMyDeliveries((prev) => prev + amount);
      toast.success(`${amount} entregas registradas!`);
    }
    setDeliveryAmount("");
  };

  // ✅ Novo: adicionar registro detalhado (aba Individual)
  const adicionarRegistro = () => {
    if (!novo.data || !novo.processo || !novo.minutos) {
      toast.error("Preencha data, processo e minutos."); // ✅ MUDANÇA
      return;
    }
    setRegistros((prev) => [...prev, novo]);
    setMyDeliveries((prev) => prev + 1);
    toast.success("Registro adicionado");
    setNovo({ servidor: "Servidor X", data: "", processo: "", status: "Concluído", minutos: 0 }); // ✅ MUDANÇA
  };

  // ✅ Exportações
  const csvHeaders = [
    { label: "Servidor", key: "servidor" },
    { label: "Data", key: "data" },
    { label: "Processo/Indício", key: "processo" },
    { label: "Status", key: "status" },
    { label: "Minutos", key: "minutos" }, // ✅ MUDANÇA
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Produtividade (Individual)", 14, 15);
    autoTable(doc, {
      head: [["Servidor", "Data", "Processo/Indício", "Status", "Minutos"]], // ✅ MUDANÇA
      body: registros.map((r) => [r.servidor || "-", r.data, r.processo, r.status, r.minutos]), // ✅ MUDANÇA
      startY: 20,
    });
    doc.save("relatorio_produtividade_individual.pdf");
  };

  // ✅ Consolidação por servidor
  const consolidadoPorServidor = Object.values(
    registros.reduce<Record<string, { servidor: string; qtd: number; totalMinutos: number }>>((acc, r) => { // ✅ MUDANÇA
      const key = r.servidor || "(não informado)";
      if (!acc[key]) acc[key] = { servidor: key, qtd: 0, totalMinutos: 0 }; // ✅ MUDANÇA
      acc[key].qtd += 1;
      acc[key].totalMinutos += r.minutos; // ✅ MUDANÇA
      return acc;
    }, {})
  ).map((row) => ({ ...row, mediaMinutos: row.totalMinutos / row.qtd })); // ✅ MUDANÇA

  // ✅ Dados para gráficos
  const minutosPorStatus = registros.reduce<Record<string, number>>((acc, r) => { // ✅ MUDANÇA
    acc[r.status] = (acc[r.status] || 0) + r.minutos; // ✅ MUDANÇA
    return acc;
  }, {});

  const dataBarras = Object.keys(minutosPorStatus).map((status) => ({ status, minutos: minutosPorStatus[status] })); // ✅ MUDANÇA

  const minutosPorData = registros.reduce<Record<string, number>>((acc, r) => { // ✅ MUDANÇA
    acc[r.data] = (acc[r.data] || 0) + r.minutos; // ✅ MUDANÇA
    return acc;
  }, {});
  const dataLinha = Object.keys(minutosPorData)
    .sort()
    .map((data) => ({ data, minutos: minutosPorData[data] })); // ✅ MUDANÇA

  const dataPizza = Object.keys(minutosPorStatus).map((status) => ({ name: status, value: minutosPorStatus[status] })); // ✅ MUDANÇA

  const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Registro de entregas</h1>
              <p className="text-sm text-muted-foreground">Acompanhe métricas e produtividade</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Demandas Overview (mantido) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CODEJ</CardTitle>
              <CardDescription>Demandas do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="0"
                  value={codejTotal}
                  onChange={(e) => setCodejTotal(parseInt(e.target.value) || 0)}
                  className="text-2xl font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">COCON</CardTitle>
              <CardDescription>Demandas do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="0"
                  value={coconTotal}
                  onChange={(e) => setCoconTotal(parseInt(e.target.value) || 0)}
                  className="text-2xl font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Concluído</CardTitle>
              <CardDescription>Equipe no mês</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{codejTotal + coconTotal}</p>
            </CardContent>
          </Card>
        </div>

        {/* Productivity Tabs */}
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="individual">Minhas Entregas</TabsTrigger>
            <TabsTrigger value="team">Entregas da Equipe</TabsTrigger>
          </TabsList>

          {/* Individual Tab */}
          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade Individual</CardTitle>
                <CardDescription>Registre aqui suas entregas e acompanhe seu progresso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ✅ Formulário detalhado com MINUTOS */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Número do processo ou indício</Label>
                    <Input
                      placeholder="Ex: 19975.000000/2025-11"
                      value={novo.processo}
                      onChange={(e) => setNovo({ ...novo, processo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      value={novo.status}
                      onChange={(e) => setNovo({ ...novo, status: e.target.value as Registro["status"] })}
                      className="w-full border rounded-md h-10 px-3 bg-background"
                    >
                      <option>Concluído</option>
                      <option>Encaminhado</option>
                      <option>Solicitada informação externa</option>
                    </select>
                  </div>
                  <div>
                    <Label>Tempo gasto (minutos)</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="Ex: 30, 60, 90..."
                      value={novo.minutos || ""}
                      onChange={(e) => setNovo({ ...novo, minutos: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Jornada: 480 min/dia (8h)
                    </p>
                  </div>
                  <div className="sm:col-span-3 flex items-end">
                    <Button onClick={adicionarRegistro} className="gap-2">
                      <Plus className="w-4 h-4" /> Adicionar registro
                    </Button>
                  </div>
                </div>

                {/* Visualização de progresso (mantida) */}
                <div className="relative bg-gradient-to-b from-sky-100 to-green-50 rounded-xl p-8 overflow-hidden">
                  <div className="absolute inset-0 opacity-50">
                    <div className="absolute top-10 right-20 w-16 h-16 bg-yellow-300 rounded-full shadow-lg"></div>
                    <div className="absolute top-8 left-16 w-12 h-8 bg-white rounded-full opacity-70"></div>
                    <div className="absolute top-12 right-32 w-10 h-6 bg-white rounded-full opacity-60"></div>
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Stats à esquerda */}
                    <div className="space-y-4 md:w-1/3">
                      <div className="bg-white/90 backdrop-blur p-6 rounded-lg shadow-lg">
                        <p className="text-sm text-muted-foreground mb-2">Progresso Atual</p>
                        <p className="text-4xl font-bold text-primary mb-4">{myDeliveries} / {MONTHLY_GOAL}</p>
                        <Progress value={myProgress} className="h-3 mb-2" />
                        <p className="text-sm text-muted-foreground">{Math.round(myProgress)}% concluído</p>
                      </div>

                      <div className="bg-white/90 backdrop-blur p-6 rounded-lg shadow-lg">
                        <p className="text-sm font-semibold text-foreground mb-2">🎯 Meta do Mês</p>
                        <p className="text-2xl font-bold">{MONTHLY_GOAL} processos</p>
                      </div>

                      {/* ✅ Estatísticas de MINUTOS */}
                      {registros.length > 0 && (
                        <div className="bg-white/90 backdrop-blur p-6 rounded-lg shadow-lg">
                          <p className="text-sm font-semibold text-foreground mb-2">⏱️ Tempo Trabalhado</p>
                          <p className="text-2xl font-bold">
                            {registros.reduce((acc, r) => acc + r.minutos, 0)} min
                          </p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>De 480 min/dia ({Math.round((registros.reduce((acc, r) => acc + r.minutos, 0) / 480) * 100)}%)</p>
                            <p>Média: {Math.round(registros.reduce((acc, r) => acc + r.minutos, 0) / registros.length)} min/processo</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cena da montanha à direita */}
                    <div className="md:w-2/3 relative h-[500px]">
                      <img src={llamaScene} alt="Montanha" className="w-full h-full object-contain opacity-90" />
                      <div
                        className="absolute transition-all duration-700 ease-out z-20"
                        style={{
                          bottom: `${Math.min(myProgress * 0.85, 85)}%`,
                          left: `${45 + myProgress * 0.1}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <img src={llamaCharacter} alt="Lhama subindo" className="w-12 h-12 object-contain drop-shadow-lg" />
                      </div>
                      {myProgress >= 100 && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 animate-bounce z-30">
                          <span className="text-4xl">🎉</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabela de registros individuais + exportações */}
                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Relatório Individual</CardTitle>
                    <CardDescription>Histórico do próprio servidor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="p-2">Data</th>
                            <th className="p-2">Processo/Indício</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Minutos</th> {/* ✅ MUDANÇA */}
                          </tr>
                        </thead>
                        <tbody>
                          {registros.map((r, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{r.data}</td>
                              <td className="p-2">{r.processo}</td>
                              <td className="p-2">{r.status}</td>
                              <td className="p-2">{r.minutos} min</td> {/* ✅ MUDANÇA */}
                            </tr>
                          ))}
                          {registros.length === 0 && (
                            <tr>
                              <td className="p-3 text-sm text-muted-foreground" colSpan={4}>
                                Nenhum registro ainda.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <CSVLink data={registros} headers={csvHeaders} filename="relatorio_produtividade.csv">
                        <Button className="bg-green-600 hover:bg-green-700">Exportar CSV</Button>
                      </CSVLink>
                      <Button onClick={exportPDF} className="bg-red-600 hover:bg-red-700">Exportar PDF</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* ✅ Gráficos com MINUTOS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Minutos por status</CardTitle> {/* ✅ MUDANÇA */}
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataBarras}>
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="minutos" fill="#6366F1" /> {/* ✅ MUDANÇA */}
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Evolução (minutos por dia)</CardTitle> {/* ✅ MUDANÇA */}
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataLinha}>
                          <XAxis dataKey="data" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="minutos" stroke="#10B981" /> {/* ✅ MUDANÇA */}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribuição de status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dataPizza} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {dataPizza.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* ✅ Consolidação com MINUTOS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Consolidado por servidor</CardTitle>
                    <CardDescription>Previsto para autenticação futura; hoje usa o campo "servidor" do registro.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="p-2">Servidor</th>
                            <th className="p-2">Qtd. registros</th>
                            <th className="p-2">Total de minutos</th> {/* ✅ MUDANÇA */}
                            <th className="p-2">Média de minutos</th> {/* ✅ MUDANÇA */}
                          </tr>
                        </thead>
                        <tbody>
                          {consolidadoPorServidor.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{row.servidor}</td>
                              <td className="p-2">{row.qtd}</td>
                              <td className="p-2">{row.totalMinutos}</td> {/* ✅ MUDANÇA */}
                              <td className="p-2">{row.mediaMinutos.toFixed(1)}</td> {/* ✅ MUDANÇA */}
                            </tr>
                          ))}
                          {consolidadoPorServidor.length === 0 && (
                            <tr>
                              <td className="p-3 text-sm text-muted-foreground" colSpan={4}>
                                Ainda não há dados para consolidar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab (mantida igual) */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Entregas da Equipe</CardTitle>
                <CardDescription>Acompanhe o progresso coletivo da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input numérico original mantido */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="team-delivery">Número de processos</Label>
                    <Input
                      id="team-delivery"
                      type="number"
                      placeholder="Ex: 10"
                      value={deliveryAmount}
                      onChange={(e) => setDeliveryAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => handleAddDelivery(true)} className="self-end gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>

                {/* Visual da montanha (mantido) */}
                <div className="relative bg-gradient-to-b from-sky-100 to-green-50 rounded-xl p-8 overflow-hidden min-h-[600px]">
                  <div className="absolute inset-0 opacity-50">
                    <div className="absolute top-10 right-20 w-20 h-20 bg-yellow-300 rounded-full shadow-lg"></div>
                    <div className="absolute top-8 left-16 w-16 h-10 bg-white rounded-full opacity-70"></div>
                    <div className="absolute top-12 right-32 w-14 h-8 bg-white rounded-full opacity-60"></div>
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                    {/* Stats à esquerda */}
                    <div className="space-y-4 md:w-1/3">
                      <div className="bg-white/90 backdrop-blur p-6 rounded-lg shadow-lg">
                        <p className="text-sm text-muted-foreground mb-2">Progresso da Equipe</p>
                        <p className="text-4xl font-bold text-primary mb-4">{teamDeliveries} / {MONTHLY_GOAL}</p>
                        <Progress value={teamProgress} className="h-3 mb-2" />
                        <p className="text-sm text-muted-foreground">{Math.round(teamProgress)}% concluído</p>
                      </div>

                      <div className="bg-white/90 backdrop-blur p-6 rounded-lg shadow-lg">
                        <p className="text-sm font-semibold text-foreground mb-2">🎯 Meta do Mês</p>
                        <p className="text-2xl font-bold">{MONTHLY_GOAL} processos</p>
                      </div>
                    </div>

                    {/* Montanha */}
                    <div className="md:w-2/3 relative h-[600px]">
                      <img src={llamaScene} alt="Montanha da equipe" className="w-full h-full object-contain opacity-90" />

                      <div
                        className="absolute transition-all duration-700 ease-out z-20"
                        style={{
                          bottom: `${Math.min(teamProgress * 0.85, 85)}%`,
                          left: `${45 + teamProgress * 0.1}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <img src={llamaCharacter} alt="Lhama da equipe subindo" className="w-16 h-16 object-contain drop-shadow-lg" />
                      </div>

                      {teamProgress >= 100 && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 animate-bounce z-30">
                          <span className="text-5xl">🎉</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Productivity;
