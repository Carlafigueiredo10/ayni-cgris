import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Atuacao } from "@/components/landing/Atuacao";
import { Sistema } from "@/components/landing/Sistema";
import { Modules } from "@/components/landing/Modules";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Atuacao />
        <Sistema />
        <Modules />
        <ComoFunciona />
      </main>
      <Footer />
    </div>
  );
}
