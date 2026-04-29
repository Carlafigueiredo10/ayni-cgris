import { Outlet } from "react-router-dom";
import Navigation from "@/components/Navigation";
import TeamGuard from "@/components/guards/TeamGuard";

export default function PrivateLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-[72px] border-b border-black/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logo-cgris.png"
              alt="CGRIS — Coordenacao-Geral de Riscos e Controle"
              className="h-9 w-auto"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-primary">CGRIS</div>
              <div className="text-xs text-slate-600">Sistema Ayni</div>
            </div>
          </a>

          <Navigation />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <TeamGuard>
          <Outlet />
        </TeamGuard>
      </main>
    </div>
  );
}
