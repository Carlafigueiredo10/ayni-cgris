import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Wellness from "./pages/Wellness";
import Productivity from "./pages/Productivity";
import Login from "./pages/Login";

// 🚀 Importando sua nova página
import EmNumeros from "./pages/em_numeros";
import Biblioteca from "./pages/Biblioteca";
import Solicitacoes from "./pages/Solicitacoes";
import Agenda from "./pages/agenda";
import Equipe from "./pages/Equipe";
import PGD from "./pages/PGD";

const queryClient = new QueryClient();

// Componente para proteger rotas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/wellness" element={<ProtectedRoute><Wellness /></ProtectedRoute>} />
            <Route path="/productivity" element={<ProtectedRoute><Productivity /></ProtectedRoute>} />
            <Route path="/em-numeros" element={<ProtectedRoute><EmNumeros /></ProtectedRoute>} />
            <Route path="/pgd" element={<ProtectedRoute><PGD /></ProtectedRoute>} />
            <Route path="/equipe" element={<ProtectedRoute><Equipe /></ProtectedRoute>} />
            <Route path="/solicitacoes" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
            <Route path="/solicitacao" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
            <Route path="/biblioteca" element={<ProtectedRoute><Biblioteca /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;