import llamaMascot from "@/assets/llama-mascot.jpg";
import mountainBg from "@/assets/mountain-background.jpg";

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
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* Texto principal */}
        <div className="space-y-6 animate-fade-in">
          <div className="inline-block">
            <span className="px-4 py-2 bg-accent/20 text-accent-foreground rounded-full text-sm font-semibold shadow-soft">
              🤝 Reciprocidade Andina
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Como podemos nos{" "}
            <span className="text-gradient-hero">ajudar</span> para sermos mais{" "}
            <span className="text-gradient-hero">fortes e eficientes</span> juntos?
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Ayni é mais que uma plataforma. É uma filosofia de trabalho baseada na reciprocidade andina, 
            onde cada contribuição individual fortalece o coletivo e o sucesso é compartilhado por todos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="px-8 py-4 bg-gradient-hero text-white font-semibold rounded-lg shadow-soft hover:shadow-glow transition-smooth">
              Começar Agora
            </button>
            <button className="px-8 py-4 bg-card text-foreground font-semibold rounded-lg shadow-card hover:shadow-soft transition-smooth border border-border">
              Saiba Mais
            </button>
          </div>
        </div>

        {/* Lhama mascote */}
        <div className="relative animate-float">
          <div className="absolute inset-0 bg-gradient-sunset opacity-20 blur-3xl rounded-full" />
          <img 
            src={llamaMascot} 
            alt="Lhama mascote do Ayni" 
            className="relative rounded-2xl shadow-card w-full max-w-md mx-auto"
          />
          <div className="absolute -bottom-4 -right-4 bg-highlight text-highlight-foreground px-6 py-3 rounded-full shadow-soft font-semibold animate-slide-in-right">
            💪 Juntos somos mais fortes!
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
