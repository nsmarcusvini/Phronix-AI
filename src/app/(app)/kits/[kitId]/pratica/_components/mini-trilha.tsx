import { CAIXAS, PALCO } from "@/lib/pratica/leitner";

// O momento da direção: depois da nota, o ponto desliza pela trilha
// (para frente quando acerta, de volta à caixa 1 quando erra).
export function MiniTrilha({ caixa }: { caixa: number }) {
  const posicao = ((caixa - 1) / (CAIXAS - 1)) * 100;

  return (
    <div className="w-full max-w-sm" aria-label={`Caixa atual: ${caixa === PALCO ? "Palco" : caixa}`}>
      <div className="relative h-3">
        <div className="absolute inset-x-0 top-1/2 h-px bg-fio" />
        {Array.from({ length: CAIXAS }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-fio"
            style={{ left: `${(i / (CAIXAS - 1)) * 100}%` }}
          />
        ))}
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-700 ease-trilha"
          style={{ transform: `translateX(${posicao}%)` }}
        >
          <span
            className={`absolute top-1/2 left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-700 ${
              caixa === PALCO ? "bg-menta" : "bg-osso"
            }`}
          />
        </div>
      </div>
      <div aria-hidden className="relative mt-2 h-4 text-rotulo text-cinza-quente">
        {["1", "2", "3", "4", "Palco"].map((rotulo, i) => (
          <span
            key={rotulo}
            className={`absolute top-0 ${
              i === 0 ? "" : i === CAIXAS - 1 ? "-translate-x-full" : "-translate-x-1/2"
            } ${i === CAIXAS - 1 && caixa === PALCO ? "text-menta" : ""}`}
            style={{ left: `${(i / (CAIXAS - 1)) * 100}%` }}
          >
            {rotulo}
          </span>
        ))}
      </div>
    </div>
  );
}
