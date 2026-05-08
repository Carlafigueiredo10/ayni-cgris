const version = import.meta.env.VITE_APP_VERSION ?? "0.1.0";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Institucional */}
          <div>
            <div className="text-sm font-semibold">CGRIS</div>
            <div className="mt-2 text-sm text-white/80">
              Coordenação-Geral de Riscos e Controle
            </div>
            <div className="mt-4 text-xs text-white/60">
              Ambiente interno — uso institucional
            </div>
          </div>

          {/* Links */}
          <div className="text-sm">
            <div className="font-semibold">Links</div>
            <ul className="mt-3 space-y-2 text-white/80">
              <li>
                <a className="rounded hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary" href="/#inicio">
                  Início
                </a>
              </li>
              <li>
                <a className="rounded hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary" href="/#sistema">
                  O Sistema
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="text-sm">
            <div className="font-semibold">Contato</div>
            <div className="mt-3 text-white/80">
              <p>
                Email:{" "}
                <span className="text-white">cgris@gestao.gov.br</span>
              </p>
              <div className="mt-4 text-xs text-white/60">
                Sistema Ayni v{version} &middot; &copy; {year} CGRIS
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
