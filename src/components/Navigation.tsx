import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ExternalLink, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems = [
    { label: "Registro de entregas", icon: TrendingUp, href: "/productivity" },
    { label: "Agenda", icon: ExternalLink, href: "/agenda" },
    { label: "Solicitação", icon: ExternalLink, href: "/solicitacao" },
    { label: "Conheça nossa Equipe", icon: Users, href: "/equipe" },
    { label: "Links Úteis", icon: ExternalLink, href: "/links" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const scrollToLogin = () => {
    const loginCard = document.querySelector('[class*="LoginCard"], [class*="shadow-card"]');
    if (loginCard) {
      loginCard.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="flex items-center gap-6">
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="ghost"
          className="text-foreground hover:text-primary transition-smooth"
          asChild
        >
          <a href="/pgd" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">PGD</span>
          </a>
        </Button>
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="text-foreground hover:text-primary transition-smooth"
            asChild
          >
            <a href={item.href} className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          </Button>
        ))}
      </div>

      {user ? (
        <Button
          onClick={handleSignOut}
          className="bg-gradient-hero text-white hover:shadow-glow transition-smooth font-semibold"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      ) : (
        <Button
          onClick={scrollToLogin}
          className="bg-gradient-hero text-white hover:shadow-glow transition-smooth font-semibold"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Entrar
        </Button>
      )}
    </nav>
  );
};

export default Navigation;
