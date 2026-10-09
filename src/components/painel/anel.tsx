// Um anel por entrevista: fecha conforme as respostas chegam ao Palco.
// Osso enquanto avança, Menta quando fecha; tracejado se ainda não há mapa.
export function Anel({ pct, comMapa, className = "size-10" }: { pct: number; comMapa: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden className={`shrink-0 -rotate-90 ${className}`}>
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        strokeWidth={comMapa ? 4 : 1.5}
        strokeDasharray={comMapa ? undefined : "2 3"}
        className={comMapa ? "stroke-fio" : "stroke-cinza-quente/60"}
      />
      {comMapa && pct > 0 && (
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
          className={pct === 100 ? "stroke-menta" : "stroke-osso"}
        />
      )}
    </svg>
  );
}
