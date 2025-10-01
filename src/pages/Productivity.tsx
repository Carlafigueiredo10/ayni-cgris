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
import llamaMascot from "@/assets/llama-mascot.jpg";
import mountainBg from "@/assets/mountain-background.jpg";

const MONTHLY_GOAL = 120;

const Productivity = () => {
  const navigate = useNavigate();
  const [myDeliveries, setMyDeliveries] = useState(0);
  const [teamDeliveries, setTeamDeliveries] = useState(0);
  const [codejTotal, setCodejTotal] = useState(0);
  const [coconTotal, setCoconTotal] = useState(0);
  const [deliveryAmount, setDeliveryAmount] = useState("");

  const myProgress = (myDeliveries / MONTHLY_GOAL) * 100;
  const teamProgress = (teamDeliveries / MONTHLY_GOAL) * 100;

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
              <h1 className="text-xl font-bold text-foreground">Demandas Mensais</h1>
              <p className="text-sm text-muted-foreground">Acompanhe métricas e produtividade</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Demandas Overview */}
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
                {/* Input Form */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="individual-delivery">Número de processos</Label>
                    <Input
                      id="individual-delivery"
                      type="number"
                      placeholder="Ex: 5"
                      value={deliveryAmount}
                      onChange={(e) => setDeliveryAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => handleAddDelivery(false)} className="self-end gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>

                {/* Mountain Progress Visualization */}
                <div className="relative h-96 rounded-lg overflow-hidden">
                  <img
                    src={mountainBg}
                    alt="Montanha"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  
                  {/* Llama climbing */}
                  <div
                    className="absolute transition-all duration-700 ease-out"
                    style={{
                      bottom: `${Math.min(myProgress, 100)}%`,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <img
                      src={llamaMascot}
                      alt="Lhama"
                      className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-lg"
                    />
                  </div>

                  {/* Goal marker */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg">
                      <p className="text-sm font-bold text-foreground">Meta: {MONTHLY_GOAL} processos</p>
                    </div>
                  </div>

                  {/* Current progress */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center w-full px-4">
                    <div className="bg-white/90 px-6 py-3 rounded-lg shadow-lg max-w-sm mx-auto">
                      <p className="text-2xl font-bold text-primary mb-2">{myDeliveries} / {MONTHLY_GOAL}</p>
                      <Progress value={myProgress} className="h-3" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {Math.round(myProgress)}% concluído
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Entregas da Equipe</CardTitle>
                <CardDescription>Acompanhe o progresso coletivo da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Form */}
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

                {/* Mountain Progress Visualization - Larger */}
                <div className="relative h-[32rem] rounded-lg overflow-hidden">
                  <img
                    src={mountainBg}
                    alt="Montanha da Equipe"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  
                  {/* Llama climbing */}
                  <div
                    className="absolute transition-all duration-700 ease-out"
                    style={{
                      bottom: `${Math.min(teamProgress, 100)}%`,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <img
                      src={llamaMascot}
                      alt="Lhama da Equipe"
                      className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
                    />
                  </div>

                  {/* Goal marker */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg">
                      <p className="text-sm font-bold text-foreground">Meta: {MONTHLY_GOAL} processos</p>
                    </div>
                  </div>

                  {/* Current progress */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center w-full px-4">
                    <div className="bg-white/90 px-6 py-3 rounded-lg shadow-lg max-w-sm mx-auto">
                      <p className="text-2xl font-bold text-primary mb-2">{teamDeliveries} / {MONTHLY_GOAL}</p>
                      <Progress value={teamProgress} className="h-3" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {Math.round(teamProgress)}% concluído
                      </p>
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
