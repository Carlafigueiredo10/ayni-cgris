import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Wellness from "./pages/Wellness";
import Productivity from "./pages/Productivity";

// 🚀 Importando sua nova página
import EmNumeros from "./pages/em_numeros";
import Biblioteca from "./pages/Biblioteca";
import Solicitacoes from "./pages/Solicitacoes";
import Agenda from "./pages/agenda";
// import ForcaTrabalho from "./pages/ForcaTrabalho";
// import ConhecaNossaEquipe from "./pages/ConhecaNossaEquipe";
import Equipe from "./pages/Equipe";
import PGD from "./pages/PGD";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/productivity" element={<Productivity />} />
          {/* 🚀 Nova rota para CGRIS em Números */}
          <Route path="/em-numeros" element={<EmNumeros />} />
          <Route path="/pgd" element={<PGD />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/solicitacoes" element={<Solicitacoes />} />
          <Route path="/solicitacao" element={<Solicitacoes />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/agenda" element={<Agenda />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
// 🚀 Importando sua nova página