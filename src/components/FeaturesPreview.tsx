import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Coffee, Heart, FileText, GitBranch } from "lucide-react";

const FeaturesPreview = () => {
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
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="shadow-card hover:shadow-glow transition-smooth border-2 border-primary/5 hover:border-primary/20 animate-fade-in"
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
                <button className="text-primary font-semibold hover:underline transition-smooth flex items-center gap-2">
                  Em breve
                  <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                    ✨ Novidade
                  </span>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesPreview;
