import Logo from "@/components/Logo";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesPreview from "@/components/FeaturesPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection />
        <FeaturesPreview />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
