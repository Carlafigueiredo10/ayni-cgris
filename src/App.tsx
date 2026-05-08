import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PrivateLayout from "./layouts/PrivateLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Wellness from "./pages/Wellness";
import Productivity from "./pages/Productivity";
import EmNumeros from "./pages/em_numeros";
import Biblioteca from "./pages/Biblioteca";
import Solicitacoes from "./pages/Solicitacoes";
import Equipe from "./pages/Equipe";
import PGD from "./pages/PGD";
import Admin from "./pages/Admin";
import AdminServidores from "./pages/AdminServidores";
import AdminComunicados from "./pages/AdminComunicados";
import AdminEquipes from "./pages/AdminEquipes";
import Comunicados from "./pages/Comunicados";
import Relatorios from "./pages/Relatorios";
import Perfil from "./pages/Perfil";
import Ferias from "./pages/Ferias";
import Fluxos from "./pages/Fluxos";
import AdminFluxos from "./pages/AdminFluxos";
import MeuPainelHome from "./pages/MeuPainelHome";
import MeuPainelTarefas from "./pages/MeuPainelTarefas";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch quando voltar à aba ou recuperar conexão — evita ver dados velhos
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Considera "fresco" por 10s para evitar refetch demais
      staleTime: 10_000,
    },
  },
});

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<PrivateLayout />}>
                <Route path="/wellness" element={<Wellness />} />
                <Route path="/productivity" element={<Navigate to="/meu-painel/entregas" replace />} />
                <Route path="/meu-painel" element={<MeuPainelHome />} />
                <Route path="/meu-painel/entregas" element={<Productivity />} />
                <Route path="/meu-painel/tarefas" element={<MeuPainelTarefas />} />
                <Route path="/em-numeros" element={<EmNumeros />} />
                <Route path="/pgd" element={<PGD />} />
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/solicitacoes" element={<Solicitacoes />} />
                <Route path="/solicitacao" element={<Solicitacoes />} />
                <Route path="/biblioteca" element={<Biblioteca />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/comunicados" element={<Comunicados />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/servidores" element={<AdminServidores />} />
                <Route path="/admin/comunicados" element={<AdminComunicados />} />
                <Route path="/admin/equipes" element={<AdminEquipes />} />
                <Route path="/admin/fluxos" element={<AdminFluxos />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/ferias" element={<Ferias />} />
                <Route path="/fluxos" element={<Fluxos />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;