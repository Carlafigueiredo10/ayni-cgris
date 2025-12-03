import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Cadastro
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroPassword, setCadastroPassword] = useState("");
  const [cadastroNome, setCadastroNome] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error("Erro ao entrar: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso!");
    navigate("/");
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: cadastroEmail,
      password: cadastroPassword,
      options: {
        data: {
          nome: cadastroNome,
        },
      },
    });

    if (error) {
      toast.error("Erro ao cadastrar: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Cadastro realizado! Verifique seu email para confirmar.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ayni CGRIS</CardTitle>
          <CardDescription>Entre ou crie sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="cadastro">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cadastro">
              <form onSubmit={handleCadastro} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="cadastro-nome">Nome</Label>
                  <Input
                    id="cadastro-nome"
                    type="text"
                    placeholder="Seu nome"
                    value={cadastroNome}
                    onChange={(e) => setCadastroNome(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cadastro-email">Email</Label>
                  <Input
                    id="cadastro-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={cadastroEmail}
                    onChange={(e) => setCadastroEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cadastro-password">Senha</Label>
                  <Input
                    id="cadastro-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={cadastroPassword}
                    onChange={(e) => setCadastroPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
