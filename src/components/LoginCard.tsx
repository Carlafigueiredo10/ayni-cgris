import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

const LoginCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      });
      if (error) {
        toast.error("Erro ao cadastrar: " + error.message);
      } else {
        toast.success("Cadastro realizado! Verifique seu email.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Erro ao entrar: " + error.message);
      } else {
        toast.success("Login realizado!");
        navigate("/productivity");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-card border-2 border-primary/10 animate-fade-in">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo ao Ayni</CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? "Crie sua conta" : "Entre na comunidade colaborativa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="nome"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-10 h-12 border-2"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@mgi.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-2"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-hero text-white font-semibold"
            >
              {loading ? "Aguarde..." : (isSignUp ? "Criar conta" : "Entrar na Plataforma")}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              {isSignUp ? "Já tem conta? " : "Primeiro acesso? "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:underline"
              >
                {isSignUp ? "Entrar" : "Criar conta"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center animate-fade-in">
        <p className="text-sm text-muted-foreground italic">
          "No ayni, todos dão, todos recebem. A força está na união."
        </p>
        <p className="text-xs text-muted-foreground">— Sabedoria Andina</p>
      </div>
    </div>
  );
};

export default LoginCard;
