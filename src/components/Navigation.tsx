import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  FileText,
  Calendar,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const location = useLocation();
  const { isAdmin, isManagerCgris, isManager, signOut } = useAuth();

  const items = [
    { label: "PGD", icon: FileText, href: "/pgd" },
    { label: "Entregas", icon: TrendingUp, href: "/productivity" },
    { label: "Agenda", icon: Calendar, href: "/agenda" },
    { label: "Solicitacao", icon: ClipboardList, href: "/solicitacao" },
    { label: "Equipe", icon: Users, href: "/equipe" },
  ];

  if (isManager || isManagerCgris || isAdmin) {
    items.push({ label: "Relatorios", icon: BarChart3, href: "/relatorios" });
  }

  if (isAdmin || isManagerCgris) {
    items.push({ label: "Admin", icon: Settings, href: "/admin" });
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="flex items-center gap-1">
      <div className="hidden items-center gap-1 md:flex">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className={`text-slate-700 hover:text-primary hover:bg-primary/5 ${
                active ? "bg-primary/5 text-primary" : ""
              }`}
              asChild
            >
              <a href={item.href} className="flex items-center gap-1.5">
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            </Button>
          );
        })}
      </div>

      <Button
        onClick={handleSignOut}
        variant="outline"
        size="sm"
        className="ml-2 border-primary text-primary hover:bg-primary hover:text-white"
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        Sair
      </Button>
    </nav>
  );
};

export default Navigation;
