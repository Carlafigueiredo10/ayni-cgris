import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Coffee, Heart, FileText, GitBranch } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FeaturesPreview = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, user: "Maria Silva", time: "10:30", message: "Bom dia, pessoal! ☕" },
    { id: 2, user: "João Santos", time: "10:32", message: "Bom dia! Alguém viu os novos procedimentos?" },
    { id: 3, user: "Ana Costa", time: "10:35", message: "Vi sim! Muito bem organizados 👏" },
    { id: 4, user: "Carlos Lima", time: "10:40", message: "Pessoal, alguém disponível para me ajudar com um despacho?" },
    { id: 5, user: "Maria Silva", time: "10:42", message: "Claro, Carlos! Como posso ajudar?" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          user: "Você",
          time: time,
          message: newMessage,
        },
      ]);
      setNewMessage("");
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Biblioteca de Modelos: Notas Técnicas, Despachos e Formulários",
      description: "Acesse modelos prontos de documentos e formulários para agilizar seu trabalho.",
      color: "bg-turquoise",
      textColor: "text-turquoise-foreground",
    },
    {
      icon: GitBranch,
      title: "Fluxos e Procedimentos",
      description: "Consulte os fluxos de trabalho e procedimentos da coordenação.",
      color: "bg-accent",
      textColor: "text-accent-foreground",
    },
    {
      icon: TrendingUp,
      title: "CGRIS em Números",
      description: "Acompanhe métricas, indicadores e resultados da nossa coordenação em tempo real.",
      color: "bg-accent",
      textColor: "text-accent-foreground",
    },
    {
      icon: Users,
      title: "Conheça nossa Equipe",
      description: "Descubra os talentos, habilidades e histórias de cada membro da equipe.",
      color: "bg-turquoise",
      textColor: "text-turquoise-foreground",
    },
    {
      icon: Coffee,
      title: "Sala do Café",
      description: "Um espaço informal para conversas, ideias e conexões entre colegas.",
      color: "bg-highlight",
      textColor: "text-highlight-foreground",
    },
    {
      icon: Heart,
      title: "Bem-estar",
      description: "Recursos e ferramentas para cuidar da saúde física e mental da equipe.",
      color: "bg-primary",
      textColor: "text-primary-foreground",
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Explore os <span className="text-gradient-hero">Módulos</span> da Plataforma
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas criadas para fortalecer a colaboração, transparência e bem-estar da nossa equipe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const isCoffeeRoom = feature.title === "Sala do Café";
            const isWellness = feature.title === "Bem-estar";
            const isEmNumeros = feature.title === "CGRIS em Números";
            const isBiblioteca = feature.title === "Biblioteca de Modelos: Notas Técnicas, Despachos e Formulários";

            const CardWrapper = isCoffeeRoom ? Dialog : "div";
            const cardContent = (
              <Card
                key={feature.title}
                className="shadow-card hover:shadow-glow transition-smooth border-2 border-primary/5 hover:border-primary/20 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={
                  isWellness
                    ? () => navigate("/wellness")
                    : isEmNumeros
                    ? () => navigate("/em-numeros")
                    : isBiblioteca
                    ? () => navigate("/biblioteca")
                    : undefined
                }
              >
                <CardHeader>
                  <div
                    className={`w-14 h-14 ${feature.color} ${feature.textColor} rounded-xl flex items-center justify-center mb-4 shadow-soft`}
                  >
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="text-primary font-semibold hover:underline transition-smooth flex items-center gap-2">
                    {isCoffeeRoom
                      ? "Entrar na sala"
                      : isWellness
                      ? "Acessar recursos"
                      : isEmNumeros
                      ? "Ver métricas"
                      : isBiblioteca
                      ? "Acessar biblioteca"
                      : "Em breve"}
                    {!isCoffeeRoom && !isWellness && !isEmNumeros && !isBiblioteca && (
                      <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                        ✨ Novidade
                      </span>
                    )}
                  </button>
                </CardContent>
              </Card>
            );

            if (isCoffeeRoom) {
              return (
                <Dialog key={feature.title}>
                  <DialogTrigger asChild>{cardContent}</DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Coffee className="w-6 h-6 text-highlight" />
                        Sala do Café
                      </DialogTitle>
                      <DialogDescription>
                        Um espaço informal para conversas, ideias e conexões entre colegas
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col h-[500px]">
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div key={msg.id} className="space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm text-foreground">{msg.user}</span>
                                <span className="text-xs text-muted-foreground">{msg.time}</span>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} className="bg-gradient-hero text-white">
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            }

            return <div key={feature.title}>{cardContent}</div>;
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesPreview;
