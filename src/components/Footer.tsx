import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo e descrição */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-secondary-foreground/80">
              Plataforma de colaboração e reciprocidade para a administração pública brasileira.
            </p>
          </div>

          {/* Links rápidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#numeros" className="hover:text-accent transition-smooth">
                  CGRIS em Números
                </a>
              </li>
              <li>
                <a href="#equipe" className="hover:text-accent transition-smooth">
                  Conheça nossa Equipe
                </a>
              </li>
              <li>
                <a href="#cafe" className="hover:text-accent transition-smooth">
                  Sala do Café
                </a>
              </li>
              <li>
                <a href="#login" className="hover:text-accent transition-smooth">
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contato</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li>Ministério da Gestão e Inovação</li>
              <li>CGRIS - Coordenação-Geral</li>
              <li>contato@ayni.mgi.gov.br</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-8 text-center text-sm text-secondary-foreground/60">
          <p>© 2025 Ayni. Desenvolvido com 💛 para a administração pública brasileira.</p>
          <p className="mt-2 italic text-xs">
            "Ayni: O que você dá, você recebe. O que você compartilha, multiplica."
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
