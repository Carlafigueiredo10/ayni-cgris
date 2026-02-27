import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PrivateLayout from "./layouts/PrivateLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Wellness from "./pages/Wellness";
import Productivity from "./pages/Productivity";
import EmNumeros from "./pages/em_numeros";
import Biblioteca from "./pages/Biblioteca";
import Solicitacoes from "./pages/Solicitacoes";
import Agenda from "./pages/agenda";
import Equipe from "./pages/Equipe";
import PGD from "./pages/PGD";
import Admin from "./pages/Admin";
import Relatorios from "./pages/Relatorios";

const queryClient = new QueryClient();

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

            {/* TODO: restaurar ProtectedRoute depois da demo */}
            <Route element={<PrivateLayout />}>
              <Route path="/wellness" element={<Wellness />} />
              <Route path="/productivity" element={<Productivity />} />
              <Route path="/em-numeros" element={<EmNumeros />} />
              <Route path="/pgd" element={<PGD />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/solicitacoes" element={<Solicitacoes />} />
              <Route path="/solicitacao" element={<Solicitacoes />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;