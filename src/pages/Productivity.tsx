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
import cartoonMountain from "@/assets/cartoon-mountain.png";

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
              <h1 className="text-xl font-bold text-foreground">Registro de entregas</h1>
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
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  {/* Left side - Stats */}
                  <div className="space-y-4">
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                      <p className="text-sm text-muted-foreground mb-2">Progresso Atual</p>
                      <p className="text-4xl font-bold text-primary mb-4">{myDeliveries} / {MONTHLY_GOAL}</p>
                      <Progress value={myProgress} className="h-3 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {Math.round(myProgress)}% concluído
                      </p>
                    </div>
                    
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                      <p className="text-sm font-semibold text-foreground mb-2">🎯 Meta do Mês</p>
                      <p className="text-2xl font-bold">{MONTHLY_GOAL} processos</p>
                    </div>
                  </div>

                  {/* Right side - Mountain with climbing llama */}
                  <div className="relative h-[500px] flex items-end justify-center">
                    <img
                      src={cartoonMountain}
                      alt="Montanha"
                      className="absolute bottom-0 right-0 h-full w-auto object-contain"
                    />
                    
                    {/* Llama climbing */}
                    <div
                      className="absolute transition-all duration-700 ease-out z-10"
                      style={{
                        bottom: `${Math.min(myProgress, 95)}%`,
                        right: "35%",
                      }}
                    >
                      <img
                        src={llamaMascot}
                        alt="Lhama"
                        className="w-16 h-16 object-cover rounded-full border-4 border-white shadow-lg"
                      />
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
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  {/* Left side - Stats */}
                  <div className="space-y-4">
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                      <p className="text-sm text-muted-foreground mb-2">Progresso da Equipe</p>
                      <p className="text-4xl font-bold text-primary mb-4">{teamDeliveries} / {MONTHLY_GOAL}</p>
                      <Progress value={teamProgress} className="h-3 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {Math.round(teamProgress)}% concluído
                      </p>
                    </div>
                    
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                      <p className="text-sm font-semibold text-foreground mb-2">🎯 Meta do Mês</p>
                      <p className="text-2xl font-bold">{MONTHLY_GOAL} processos</p>
                    </div>
                  </div>

                  {/* Right side - Mountain with climbing llama */}
                  <div className="relative h-[600px] flex items-end justify-center">
                    <img
                      src={cartoonMountain}
                      alt="Montanha da Equipe"
                      className="absolute bottom-0 right-0 h-full w-auto object-contain"
                    />
                    
                    {/* Llama climbing */}
                    <div
                      className="absolute transition-all duration-700 ease-out z-10"
                      style={{
                        bottom: `${Math.min(teamProgress, 95)}%`,
                        right: "35%",
                      }}
                    >
                      <img
                        src={llamaMascot}
                        alt="Lhama da Equipe"
                        className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-lg"
                      />
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
