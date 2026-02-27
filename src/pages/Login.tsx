import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoginCard from "@/components/LoginCard";
import { useAuth } from "@/contexts/AuthContext";

function useNextParam() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get("next") || "/productivity";
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const next = useNextParam();

  useEffect(() => {
    if (!loading && user) {
      navigate(next, { replace: true });
    }
  }, [user, loading, navigate, next]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-[72px] border-b border-black/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logo-cgris.png"
              alt="CGRIS — Coordenação-Geral de Riscos e Controle"
              className="h-9 w-auto"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-primary">CGRIS</div>
              <div className="text-xs text-slate-600">Sistema Ayni</div>
            </div>
          </a>

          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            asChild
          >
            <a href="/">Voltar</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-primary">
            Acessar o sistema
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Acesso restrito a usuários autorizados. Autenticação via Supabase.
          </p>

          <div className="mt-8">
            <LoginCard />
          </div>
        </div>
      </main>
    </div>
  );
}
