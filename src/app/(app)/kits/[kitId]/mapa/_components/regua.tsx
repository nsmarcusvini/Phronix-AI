import { ESCALA_SEGUNDOS, JANELA, PALAVRAS_MAXIMO } from "@/lib/mapa/fala";

type Props = { palavras: number; segundos: number; situacao: "curta" | "ok" | "longa" };

// O momento do Mapa: enquanto você edita, o ponto mostra onde a resposta cai
// na janela de 20 a 40 segundos. Mesma linguagem do ponto da Trilha.
export function Regua({ palavras, segundos, situacao }: Props) {
  const posicao = (Math.min(segundos, ESCALA_SEGUNDOS) / ESCALA_SEGUNDOS) * 100;
  const inicio = (JANELA.minimo / ESCALA_SEGUNDOS) * 100;
  const largura = ((JANELA.maximo - JANELA.minimo) / ESCALA_SEGUNDOS) * 100;
  const longa = situacao === "longa";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-rotulo">
        <span className="text-cinza-quente">Régua da fala</span>
        <span className={`tabular-nums ${longa ? "text-ambar" : "text-osso"}`} aria-live="polite">
          {palavras} palavras · ~{segundos} s
        </span>
      </div>

      <div className="relative mt-3 h-3" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px bg-fio" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-osso/25"
          style={{ left: `${inicio}%`, width: `${largura}%` }}
        />
        <div
          className="absolute inset-0 transition-transform duration-300 ease-brasa"
          style={{ transform: `translateX(${posicao}%)` }}
        >
          <span
            className={`absolute top-1/2 left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${
              longa ? "bg-ambar" : situacao === "ok" ? "bg-osso" : "border border-cinza-quente bg-noite"
            }`}
          />
        </div>
      </div>

      <div className="relative mt-2 h-4 text-rotulo text-cinza-quente" aria-hidden>
        <span className="absolute left-0">0 s</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${inicio}%` }}>
          {JANELA.minimo} s
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${inicio + largura}%` }}>
          {JANELA.maximo} s
        </span>
        <span className="absolute right-0">{ESCALA_SEGUNDOS} s</span>
      </div>

      {longa && (
        <p className="mt-3 text-sm text-ambar">
          Passou de {PALAVRAS_MAXIMO} palavras ou de {JANELA.maximo} s. Vale encurtar.
        </p>
      )}
      {situacao === "curta" && (
        <p className="mt-3 text-sm text-cinza-quente">
          Curta: cabe um contexto ou um número a mais, se fizer sentido.
        </p>
      )}
    </div>
  );
}
