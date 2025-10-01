import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";

const LoginCard = () => {
  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-card border-2 border-primary/10 animate-fade-in">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Bem-vindo ao Ayni</CardTitle>
            <CardDescription className="text-base">
              Entre para fazer parte da nossa comunidade colaborativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@mgi.gov.br"
                  className="pl-10 h-12 border-2 focus:border-primary transition-smooth"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 border-2 focus:border-primary transition-smooth"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 bg-gradient-hero text-white font-semibold hover:shadow-glow transition-smooth"
            >
              Entrar na Plataforma
            </Button>

            <div className="text-center space-y-2">
              <button className="text-sm text-primary hover:underline transition-smooth">
                Esqueci minha senha
              </button>
              <p className="text-sm text-muted-foreground">
                Primeiro acesso?{" "}
                <button className="text-primary font-semibold hover:underline transition-smooth">
                  Criar conta
                </button>
              </p>
            </div>
          </CardContent>
      </Card>

      {/* Mensagem inspiradora */}
      <div className="mt-8 text-center space-y-2 animate-fade-in">
        <p className="text-sm text-muted-foreground italic">
          "No ayni, todos dão, todos recebem. A força está na união."
        </p>
        <p className="text-xs text-muted-foreground">
          — Sabedoria Andina
        </p>
      </div>
    </div>
  );
};

export default LoginCard;
