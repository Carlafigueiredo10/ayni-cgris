import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Coffee, ExternalLink, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import llamaHero from "@/assets/llama-hero.png";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "PGD",
      description: "Plano de Gestão de Demandas para organizar o trabalho",
      path: "/pgd",
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      icon: TrendingUp,
      title: "Registro de entregas",
      description: "Acompanhe sua produtividade e registre entregas",
      path: "/productivity",
      color: "bg-green-50 text-green-600 border-green-200"
    },
    {
      icon: Users,
      title: "Conheça nossa Equipe",
      description: "Saiba mais sobre os membros da nossa equipe",
      path: "/equipe",
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      icon: Coffee,
      title: "Sala do Café",
      description: "Espaço para conversas informais e networking",
      path: "/cafe",
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      icon: ExternalLink,
      title: "Links Úteis",
      description: "Acesse recursos e ferramentas importantes",
      path: "/links",
      color: "bg-gray-50 text-gray-600 border-gray-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Sistema em funcionamento
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Juntos somos
                <span className="block text-transparent bg-gradient-hero bg-clip-text">
                  mais fortes!
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Plataforma colaborativa que conecta pessoas, facilita o compartilhamento de conhecimento
                e promove a reciprocidade no ambiente de trabalho.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/productivity")} 
                  className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Começar agora <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate("/equipe")}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Conheça a equipe
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              <img 
                src={llamaHero} 
                alt="Lhama Ayni" 
                className="w-full max-w-md h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explore nossas funcionalidades
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas pensadas para facilitar sua rotina e fortalecer a colaboração em equipe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20"
                  onClick={() => navigate(feature.path)}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-hero rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se à nossa comunidade e descubra como a colaboração pode transformar seu dia a dia
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/productivity")}
            className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Registrar primeira entrega <ArrowRight className="w-4 h-4" />
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Home;