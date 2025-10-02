import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle, Users, Activity } from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// imagens
import llamaMascot from "@/assets/llama-mascot.jpg";
import llamaCharacter from "@/assets/llama-character.png";
import mountainBackground from "@/assets/mountain-background.jpg";

// dados para os gráficos
const evolucaoMensal = [
  { mes: "Jan", recebidos: 900, concluidos: 720 },
  { mes: "Fev", recebidos: 1200, concluidos: 1100 },
  { mes: "Mar", recebidos: 1328, concluidos: 1124 },
];

const eficienciaData = [
  { name: "Concluídos", value: 1124 },
  { name: "Pendentes", value: 204 },
];

const COLORS = ["#22c55e", "#ef4444"]; // verde e vermelho

const EmNumeros = () => {
  return (
    <div
      className="relative min-h-screen overflow-hidden p-8"
      style={{
        backgroundImage: `url(${mountainBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10">
        {/* Mascote lateral */}
        <img
          src={llamaCharacter}
          alt="Lhama mascote"
          className="absolute bottom-0 right-4 w-40 drop-shadow-lg animate-bounce"
        />

        {/* Título principal */}
        <h1 className="text-5xl font-extrabold text-center mb-16 text-white drop-shadow-lg">
          CGRIS em Números 🦙
        </h1>

        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              <CardTitle>Recebidos no mês</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-indigo-600">1.328</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <CardTitle>Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-green-600">1.124</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              <CardTitle>Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-blue-600">16</p>
              <p className="text-sm text-muted-foreground">pessoas</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <Activity className="w-6 h-6 text-orange-500" />
              <CardTitle>Média por pessoa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-orange-600">25</p>
              <p className="text-sm text-muted-foreground">processos</p>
            </CardContent>
          </Card>
        </div>

        {/* Destaques */}
        <div className="relative mt-20 space-y-12">
          <h2 className="text-3xl font-bold text-center text-white mb-8 drop-shadow-lg">
            Destaques do Desempenho 🌟
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-yellow-50 shadow-md hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-yellow-600">Eficiência</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  85% dos processos recebidos foram concluídos este mês.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 shadow-md hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-purple-600">Agilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  Tempo médio de conclusão: <b>3,2 dias</b>.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-pink-50 shadow-md hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-pink-600">Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  98% de conformidade verificada nas análises.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
          {/* Evolução Mensal */}
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-indigo-600">Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="recebidos"
                    stroke="#6366f1"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="concluidos"
                    stroke="#22c55e"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Eficiência */}
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-600">Eficiência</CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={eficienciaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eficienciaData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-4 font-bold text-lg text-green-600">
                Eficiência: 85% ⭐ Meta batida ✅
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mascote central */}
        <div className="flex justify-center mt-16">
          <img
            src={llamaMascot}
            alt="Lhama"
            className="w-60 rounded-xl shadow-2xl border-4 border-white animate-fade-in"
          />
        </div>
      </div>
    </div>
  );
};

export default EmNumeros;