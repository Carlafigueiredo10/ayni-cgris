import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Dumbbell, Armchair, Music, Video, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Wellness = () => {
  const navigate = useNavigate();

  const wellnessFeatures = [
    {
      icon: Dumbbell,
      title: "Ginástica Laboral",
      description: "Exercícios rápidos e práticos para fazer durante o expediente",
      color: "bg-highlight",
      textColor: "text-highlight-foreground",
      content: [
        "Alongamento de pescoço: 30 segundos para cada lado",
        "Rotação de ombros: 10 repetições para frente e para trás",
        "Alongamento de punhos: essencial para quem trabalha no computador",
        "Respiração profunda: 5 minutos de pausa consciente",
      ],
    },
    {
      icon: Armchair,
      title: "Modelos de Cadeiras Ergonômicas",
      description: "Recomendações para melhor postura e conforto no trabalho",
      color: "bg-turquoise",
      textColor: "text-turquoise-foreground",
      content: [
        "Cadeira com apoio lombar ajustável",
        "Altura regulável para alinhamento com a mesa",
        "Apoio de braços na altura dos cotovelos",
        "Assento com profundidade adequada",
        "Material respirável para conforto prolongado",
      ],
    },
    {
      icon: Music,
      title: "Playlists para Foco e Relaxamento",
      description: "Músicas selecionadas para diferentes momentos do dia",
      color: "bg-accent",
      textColor: "text-accent-foreground",
      content: [
        "🎵 Foco Máximo - Lo-fi beats para concentração",
        "🎵 Energia da Manhã - Músicas animadas para começar o dia",
        "🎵 Pausa para o Café - Jazz suave e bossa nova",
        "🎵 Relaxamento - Sons da natureza e música ambiente",
      ],
    },
    {
      icon: Video,
      title: "Organização da Rotina",
      description: "Dicas e vídeos sobre como organizar melhor seu tempo",
      color: "bg-primary",
      textColor: "text-primary-foreground",
      content: [
        "📹 Técnica Pomodoro: trabalhe 25min, descanse 5min",
        "📹 Matriz de Eisenhower: priorize o que é importante",
        "📹 Time blocking: bloqueie horários no calendário",
        "📹 Rotina matinal produtiva: comece o dia com propósito",
      ],
    },
  ];

  return (
    <div>
      <div className="mb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-soft">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Bem-estar</h1>
            <p className="text-lg text-muted-foreground">
              Recursos e ferramentas para cuidar da sua saúde física e mental
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {wellnessFeatures.map((feature, index) => (
          <Card
            key={feature.title}
            className="shadow-card hover:shadow-sm transition-smooth border-2 border-primary/5 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader>
              <div className={`w-14 h-14 ${feature.color} ${feature.textColor} rounded-xl flex items-center justify-center mb-4 shadow-soft`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.content.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">💡 Dicas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base">
            <strong>Faça pausas regulares:</strong> A cada hora, levante-se e movimente-se por 5 minutos.
          </p>
          <p className="text-base">
            <strong>Hidrate-se:</strong> Mantenha uma garrafa de água na sua mesa e beba regularmente.
          </p>
          <p className="text-base">
            <strong>Cuide da postura:</strong> Mantenha os pés apoiados no chão e as costas retas.
          </p>
          <p className="text-base">
            <strong>Regra 20-20-20:</strong> A cada 20 minutos, olhe para algo a 20 pés (6 metros) de distância por 20 segundos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wellness;
