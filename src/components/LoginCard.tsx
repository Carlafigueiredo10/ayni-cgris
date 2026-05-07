import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, Users } from "lucide-react";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";

const LoginCard = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const nextParam = new URLSearchParams(search).get("next") || "/productivity";
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const ALLOWED_DOMAIN = "@gestao.gov.br";

  const TEAM_OPTIONS = [
    { code: "cocon", label: "COCON — Coordenação de Controle" },
    { code: "codej", label: "CODEJ — Coordenação de Demandas Judiciais" },
    { code: "natos", label: "NATOS — Núcleo de Atos" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
        toast.error(`Cadastro permitido apenas para emails ${ALLOWED_DOMAIN}`);
        setLoading(false);
        return;
      }
      if (!teamCode) {
        toast.error("Selecione sua equipe");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome, team_code: teamCode } },
      });
      if (error) {
        toast.error("Erro ao cadastrar: " + error.message);
      } else {
        toast.success("Cadastro realizado!");
        setMode("signin");
      }
    } else if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Erro ao entrar: " + error.message);
      } else {
        toast.success("Login realizado!");
        navigate(nextParam);
      }
    } else if (mode === "forgot") {
      if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
        toast.error(`Recuperacao disponivel apenas para emails ${ALLOWED_DOMAIN}`);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error("Erro ao enviar email: " + error.message);
      } else {
        // Mensagem neutra: nao confirma se o email existe (anti-enumeracao)
        toast.success("Se a conta existir, voce recebera um email com instrucoes.");
        setMode("signin");
      }
    }
    setLoading(false);
  };

  const title =
    mode === "signup" ? "Crie sua conta" :
    mode === "forgot" ? "Recuperar senha" :
    "Entre na comunidade colaborativa";

  const submitLabel = loading ? "Aguarde..." :
    mode === "signup" ? "Criar conta" :
    mode === "forgot" ? "Enviar email de recuperacao" :
    "Entrar na Plataforma";

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-card border-2 border-primary/10 animate-fade-in">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo ao Ayni</CardTitle>
          <CardDescription className="text-base">{title}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
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

                <div className="space-y-2">
                  <Label htmlFor="team">Equipe</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                    <select
                      id="team"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value)}
                      required
                      className="w-full pl-10 h-12 border-2 rounded-md bg-background text-sm appearance-none"
                    >
                      <option value="">Selecione sua equipe</option>
                      {TEAM_OPTIONS.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@gestao.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-2"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
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
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-hero text-white font-semibold"
            >
              {submitLabel}
            </Button>

            {mode === "signin" && (
              <div className="space-y-1 text-center text-sm">
                <p className="text-muted-foreground">
                  Primeiro acesso?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Criar conta
                  </button>
                </p>
                <p className="text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </p>
              </div>
            )}

            {mode === "signup" && (
              <p className="text-sm text-center text-muted-foreground">
                Ja tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary font-semibold hover:underline"
                >
                  Entrar
                </button>
              </p>
            )}

            {mode === "forgot" && (
              <p className="text-sm text-center text-muted-foreground">
                Lembrou a senha?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary font-semibold hover:underline"
                >
                  Voltar ao login
                </button>
              </p>
            )}
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
