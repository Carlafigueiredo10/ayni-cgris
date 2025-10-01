import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Coffee, LogIn } from "lucide-react";

const Navigation = () => {
  const navItems = [
    { label: "CGRIS em Números", icon: TrendingUp, href: "#numeros" },
    { label: "Conheça nossa Equipe", icon: Users, href: "#equipe" },
    { label: "Sala do Café", icon: Coffee, href: "#cafe" },
  ];

  return (
    <nav className="flex items-center gap-6">
      <div className="hidden md:flex items-center gap-2">
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
      <Button
        className="bg-gradient-hero text-white hover:shadow-glow transition-smooth font-semibold"
        asChild
      >
        <a href="#login" className="flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          Entrar
        </a>
      </Button>
    </nav>
  );
};

export default Navigation;
