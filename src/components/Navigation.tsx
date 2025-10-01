import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, TrendingUp, Coffee, LogIn, ExternalLink, ChevronDown } from "lucide-react";

const Navigation = () => {
  const navItems = [
    { label: "Registro de entregas", icon: TrendingUp, href: "/productivity" },
    { label: "Conheça nossa Equipe", icon: Users, href: "#equipe" },
    { label: "Sala do Café", icon: Coffee, href: "#cafe" },
    { label: "Links Úteis", icon: ExternalLink, href: "#links" },
  ];

  const pgdItems = [
    { label: "Link pro PGD", href: "#pgd-link" },
    { label: "Faça seu plano de trabalho", href: "#plano-trabalho" },
    { label: "Manual de instruções", href: "#manual" },
  ];

  return (
    <nav className="flex items-center gap-6">
      <div className="hidden md:flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary transition-smooth"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">PGD</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {pgdItems.map((item) => (
              <DropdownMenuItem key={item.label} asChild>
                <a href={item.href} className="cursor-pointer">
                  {item.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
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
