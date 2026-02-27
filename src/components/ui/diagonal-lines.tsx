export default function DiagonalLines({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 40px, hsl(var(--primary) / 0.05) 40px, hsl(var(--primary) / 0.05) 41px)",
      }}
    />
  );
}
