type Props = {
  className?: string;
};

// Lhama em line-art — referencia o mascote da estetica antiga, em
// tracado moderno e monocromatico. Cor controlada via currentColor.
export function LlamaOutline({ className }: Props) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Orelhas */}
      <path d="M118 28 L124 62 L138 36 Z" />
      <path d="M150 22 L156 58 L172 32 Z" />

      {/* Topete */}
      <path d="M128 38 Q138 30 152 36" />

      {/* Cabeca */}
      <path d="M118 70 Q118 50 138 46 Q165 44 168 70 Q172 92 158 100 Q140 106 128 100 Q116 92 118 70 Z" />

      {/* Olho */}
      <circle cx="148" cy="68" r="2.2" fill="currentColor" />

      {/* Sorriso */}
      <path d="M156 88 Q161 92 164 88" />

      {/* Pescoco — duas curvas */}
      <path d="M128 100 Q108 116 100 152" />
      <path d="M158 102 Q146 124 142 152" />

      {/* Corpo */}
      <path d="M70 158 Q60 142 78 134 Q94 130 132 132 Q172 134 178 152 Q182 178 160 184 Q120 188 92 186 Q66 184 64 170 Z" />

      {/* La do lombo (tufo) */}
      <path d="M104 142 Q116 138 130 142" />
      <path d="M108 150 Q120 146 134 150" />

      {/* Pernas */}
      <path d="M88 184 L86 208" />
      <path d="M108 186 L108 208" />
      <path d="M148 186 L150 208" />
      <path d="M168 184 L172 208" />

      {/* Cauda */}
      <path d="M68 156 Q56 152 60 168" />
    </svg>
  );
}
