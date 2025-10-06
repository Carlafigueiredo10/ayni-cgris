import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, TrendingUp, Users, Coffee, ExternalLink, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/layout/Header";

export default function App() {
  return (
    <div>
      <Header />
      {/* O restante do seu aplicativo */}
    </div>
  );
}

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { name: "PGD", icon: BarChart3, path: "/pgd" },
    { name: "Registro de entregas", icon: TrendingUp, path: "/productivity" },
    { name: "Conheça nossa Equipe", icon: Users, path: "/equipe" },
    { name: "Sala do Café", icon: Coffee, path: "/cafe" },
    { name: "Links Úteis", icon: ExternalLink, path: "/links" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 md:gap-3 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">Ayni</h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                Colaboração • Reciprocidade
              </p>
            </div>
          </div>

          {/* Menu Desktop (horizontal) */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button 
                  key={item.name}
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="gap-2 text-sm"
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Botão Menu Mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Menu Mobile Dropdown */}
        {isMenuOpen && (
          <div className="mt-3 py-3 border-t md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button 
                    key={item.name}
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 text-left"
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};