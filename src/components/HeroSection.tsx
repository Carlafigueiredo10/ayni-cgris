import llamaMascot from "@/assets/llama-mascot.jpg";
import mountainBg from "@/assets/mountain-background.jpg";
import LoginCard from "@/components/LoginCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background com montanhas */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${mountainBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Padrão geométrico sutil */}
      <div className="absolute inset-0 pattern-geo opacity-50" />

      {/* Gradiente overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Banner com Lhama e Notícias */}
        <div className="grid md:grid-cols-2 gap-0 items-stretch rounded-2xl overflow-hidden shadow-card">
          {/* Lhama à esquerda */}
          <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-8 flex items-center justify-center">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-sunset opacity-20 blur-3xl rounded-full" />
              <img 
                src={llamaMascot} 
                alt="Lhama mascote do Ayni" 
                className="relative rounded-2xl shadow-card w-full max-w-sm"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-highlight text-highlight-foreground px-6 py-3 rounded-full shadow-soft font-semibold animate-slide-in-right whitespace-nowrap">
                💪 Juntos somos mais fortes!
              </div>
            </div>
          </div>

          {/* Caixa de Notícias à direita */}
          <div className="bg-gradient-hero p-8 md:p-12 flex flex-col justify-center text-white">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold shadow-soft">
                🤝 Reciprocidade
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Principais Notícias
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Fique por dentro das últimas atualizações, conquistas e iniciativas da nossa equipe. 
              Juntos construímos um ambiente mais colaborativo e eficiente.
            </p>
            <button className="self-start px-6 py-3 bg-white text-primary font-semibold rounded-lg shadow-soft hover:shadow-glow transition-smooth">
              Ver todas as notícias
            </button>
          </div>
        </div>

        {/* Seção de Boas-vindas e Login */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Texto principal */}
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Como podemos nos{" "}
              <span className="text-gradient-hero">ajudar</span> para sermos mais{" "}
              <span className="text-gradient-hero">fortes e eficientes</span> juntos?
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ayni é mais que uma plataforma. É uma filosofia de trabalho baseada na reciprocidade, 
              onde cada contribuição individual fortalece o coletivo e o sucesso é compartilhado por todos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="px-8 py-4 bg-gradient-hero text-white font-semibold rounded-lg shadow-soft hover:shadow-glow transition-smooth">
                    Colaboração é a chave
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gradient-hero">
                      A Filosofia Ayni: Reciprocidade e Colaboração
                    </DialogTitle>
                    <DialogDescription className="text-base leading-relaxed space-y-4 pt-4">
                      <div className="space-y-4">
                        <p>
                          <strong className="text-foreground">Ayni</strong> é uma palavra quéchua que significa "reciprocidade" ou "ajuda mútua". 
                          É um princípio fundamental das culturas andinas que representa a ideia de que todos nós somos 
                          parte de um sistema interconectado onde dar e receber são essenciais para o equilíbrio.
                        </p>
                        
                        <div className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                          <p className="italic text-foreground">
                            "No ayni, todos dão, todos recebem. A força está na união."
                          </p>
                          <p className="text-xs mt-2">— Sabedoria Andina</p>
                        </div>

                        <h3 className="text-lg font-semibold text-foreground pt-2">🤝 Nossos Princípios</h3>
                        
                        <ul className="space-y-3 text-foreground">
                          <li className="flex gap-3">
                            <span className="text-primary font-bold">•</span>
                            <div>
                              <strong>Reciprocidade:</strong> Cada contribuição individual fortalece o coletivo. 
                              Quando ajudamos os outros, também somos ajudados.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <span className="text-primary font-bold">•</span>
                            <div>
                              <strong>Colaboração:</strong> Trabalhamos juntos, compartilhando conhecimentos, 
                              experiências e recursos para alcançar objetivos comuns.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <span className="text-primary font-bold">•</span>
                            <div>
                              <strong>Transparência:</strong> Mantemos uma comunicação aberta e honesta, 
                              compartilhando informações e processos com toda a equipe.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <span className="text-primary font-bold">•</span>
                            <div>
                              <strong>Bem-estar coletivo:</strong> O sucesso individual está ligado ao sucesso 
                              do grupo. Cuidamos uns dos outros.
                            </div>
                          </li>
                        </ul>

                        <h3 className="text-lg font-semibold text-foreground pt-2">💪 Na Prática</h3>
                        
                        <p>
                          Esta plataforma foi criada para facilitar a colaboração entre nossa equipe através de:
                        </p>
                        
                        <ul className="space-y-2 text-foreground">
                          <li className="flex gap-2">
                            <span>📚</span>
                            <span>Biblioteca compartilhada de modelos e documentos</span>
                          </li>
                          <li className="flex gap-2">
                            <span>🔄</span>
                            <span>Processos e fluxos de trabalho transparentes</span>
                          </li>
                          <li className="flex gap-2">
                            <span>📊</span>
                            <span>Métricas e resultados acessíveis a todos</span>
                          </li>
                          <li className="flex gap-2">
                            <span>☕</span>
                            <span>Espaços para conexão e bem-estar da equipe</span>
                          </li>
                        </ul>

                        <div className="bg-primary/10 p-4 rounded-lg mt-4">
                          <p className="text-foreground font-semibold">
                            Juntos somos mais fortes! Cada um de nós traz talentos únicos que, 
                            quando compartilhados, criam algo maior do que a soma das partes.
                          </p>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <button className="px-8 py-4 bg-card text-foreground font-semibold rounded-lg shadow-card hover:shadow-soft transition-smooth border border-border">
                Saiba Mais
              </button>
            </div>
          </div>

          {/* Login Card */}
          <div>
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
