import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  TrendingUp,
  Calendar,
  ClipboardList,
  Users,
  LogIn,
  LayoutDashboard,
} from "lucide-react";

const linkClass =
  "rounded text-sm text-slate-700 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const internalLinks = [
  { label: "PGD", icon: FileText, href: "/pgd" },
  { label: "Entregas", icon: TrendingUp, href: "/productivity" },
  { label: "Agenda", icon: Calendar, href: "/agenda" },
  { label: "Solicitação", icon: ClipboardList, href: "/solicitacao" },
  { label: "Equipe", icon: Users, href: "/equipe" },
];

export function Header() {
  const { user } = useAuth();
  const loggedIn = !!user;

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-black/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <a href="/#inicio" className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <img
            src="/logo-cgris.png"
            alt="CGRIS — Coordenação-Geral de Riscos e Controle"
            className="h-9 w-auto"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-primary">CGRIS</div>
            <div className="text-xs text-slate-600">Sistema Ayni</div>
          </div>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <a className={linkClass} href="/#inicio">Início</a>
          <a className={linkClass} href="/#sistema">O Sistema</a>
          <a className={linkClass} href="/#atuacao">Atuação</a>

          <span className="mx-2 h-5 w-px bg-slate-200" aria-hidden="true" />

          {internalLinks.map((item) => (
            <a
              key={item.label}
              href={loggedIn ? item.href : `/login?next=${item.href}`}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-slate-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              title={loggedIn ? item.label : `${item.label} — requer login`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </a>
          ))}

          <Button
            className="ml-2 bg-accent text-accent-foreground font-semibold hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            asChild
          >
            {loggedIn ? (
              <a href="/productivity" className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Meu Painel
              </a>
            ) : (
              <a href="/login" className="flex items-center gap-1.5">
                <LogIn className="h-4 w-4" />
                Acessar
              </a>
            )}
          </Button>
        </nav>

        {/* Mobile */}
        <div className="md:hidden">
          <Button
            size="sm"
            className="bg-accent text-accent-foreground font-semibold hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            asChild
          >
            {loggedIn ? (
              <a href="/productivity">Meu Painel</a>
            ) : (
              <a href="/login">Acessar</a>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
