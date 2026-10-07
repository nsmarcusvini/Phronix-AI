"use client";

import { useState } from "react";
import { CAIXAS, PALCO, type EstadoItem } from "@/lib/pratica/leitner";
import { nomeCaixa, quando } from "@/lib/pratica/formatos";

// As 5 caixas do Leitner como trilha até o Palco. Cada ponto é uma resposta.
export function Trilha({ estados, agora }: { estados: EstadoItem[]; agora: Date }) {
  const [destaque, setDestaque] = useState<EstadoItem | null>(null);

  return (
    <section aria-labelledby="titulo-trilha">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="titulo-trilha" className="text-rotulo text-cinza-quente">
          Trilha
        </h2>
        <Legenda />
      </div>

      <ol className="mt-3 grid grid-cols-5 border-y border-fio">
        {Array.from({ length: CAIXAS }, (_, i) => i + 1).map((caixa) => {
          const daCaixa = estados.filter((e) => e.caixa === caixa);
          const palco = caixa === PALCO;
          return (
            <li
              key={caixa}
              className="min-h-36 border-l border-fio px-2 py-4 first:border-l-0 sm:px-4"
            >
              <div className="flex items-baseline justify-between text-rotulo">
                <span className={palco ? "text-menta" : "text-cinza-quente"}>
                  {palco ? (
                    "Palco"
                  ) : (
                    <>
                      <span className="hidden sm:inline">Caixa </span>
                      {caixa}
                    </>
                  )}
                </span>
                <span className="tabular-nums text-cinza-quente">{daCaixa.length}</span>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {daCaixa.map((e) => (
                  <li key={e.item.id}>
                    <button
                      type="button"
                      aria-label={`${e.item.pergunta}: ${nomeCaixa(e.caixa)}, ${quando(e.proxima, agora)}`}
                      onMouseEnter={() => setDestaque(e)}
                      onMouseLeave={() => setDestaque(null)}
                      onFocus={() => setDestaque(e)}
                      onBlur={() => setDestaque(null)}
                      className={`block size-3.5 rounded-full transition-transform duration-200 ease-brasa hover:scale-125 focus-visible:scale-125 ${classePonto(e, agora)}`}
                    />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 min-h-[1.4em] text-sm text-cinza-quente" aria-hidden>
        {destaque && (
          <>
            <span className="text-osso">{destaque.item.pergunta}</span>
            {" · "}
            {nomeCaixa(destaque.caixa)} · {quando(destaque.proxima, agora)}
          </>
        )}
      </p>
    </section>
  );
}

function classePonto(e: EstadoItem, agora: Date) {
  if (e.caixa === PALCO) return "bg-menta";
  if (e.proxima === null || e.proxima <= agora) return "bg-osso";
  return "border border-cinza-quente";
}

function Legenda() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-rotulo text-cinza-quente">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-osso" /> revisar hoje
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full border border-cinza-quente" /> em dia
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-menta" /> no Palco
      </span>
    </p>
  );
}
