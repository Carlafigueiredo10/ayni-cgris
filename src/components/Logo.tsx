const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-xl rounded-full"></div>
        <div className="relative w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center shadow-soft">
          <span className="text-2xl font-bold text-white">A</span>
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gradient-hero">Ayni</h1>
        <p className="text-xs text-muted-foreground">Colaboração • Reciprocidade</p>
      </div>
    </div>
  );
};

export default Logo;
