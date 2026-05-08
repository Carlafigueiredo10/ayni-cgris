import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, TrendingUp, ListChecks } from "lucide-react";

const ITENS = [
  { label: "Painel", href: "/meu-painel", icon: LayoutDashboard, end: true },
  { label: "Entregas", href: "/meu-painel/entregas", icon: TrendingUp, end: false },
  { label: "Tarefas", href: "/meu-painel/tarefas", icon: ListChecks, end: false },
];

// Segmented control leve — Link comuns, sem componente Tabs.
// Mobile: rola horizontalmente se faltar largura.
export function MeuPainelNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Navegação do Meu Painel"
      className="sticky top-[72px] z-30 -mx-1 mb-4 flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-white/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      {ITENS.map((item) => {
        const ativo = item.end
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              ativo
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            aria-current={ativo ? "page" : undefined}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
