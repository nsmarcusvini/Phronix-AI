"use client";

import { useEffect, useRef, useState } from "react";
import type { QaItem } from "@/lib/domain";
import { ComMarcadores } from "@/components/com-marcadores";
import type { Nota } from "@/lib/pratica/leitner";
import { confere, montarLacunas } from "@/lib/pratica/lacunas";

// Resposta revelada: gancho, âncoras e bullets entram em sequência.
export function RespostaRevelada({ item }: { item: QaItem }) {
  const partes = [
    <p key="g" className="text-xl font-medium text-pretty sm:text-2xl">
      <ComMarcadores texto={item.gancho ?? ""} />
    </p>,
    <Ancoras key="a" item={item} />,
    ...item.bullets.map((b) => (
      <p key={b} className="flex gap-3 text-cinza-quente">
        <span aria-hidden className="mt-[0.75em] h-px w-3 shrink-0 bg-fio" />
        <span>
          <ComMarcadores texto={b} />
        </span>
      </p>
    )),
  ];

  return (
    <div className="space-y-4">
      {partes.map((parte, i) => (
        <div key={i} className="animate-revelar" style={{ animationDelay: `${i * 80}ms` }}>
          {parte}
        </div>
      ))}
    </div>
  );
}

export function Ancoras({ item, grande = false }: { item: QaItem; grande?: boolean }) {
  if (item.ancoras.length === 0 && !item.numero_impacto) return null;
  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 font-medium ${
        grande ? "font-display text-display-lg" : "text-lg"
      }`}
    >
      {item.ancoras.map((ancora, i) => (
        <span key={ancora} className="flex items-baseline gap-x-3">
          {i > 0 && (
            <span aria-hidden className="text-fio">
              ·
            </span>
          )}
          {ancora}
        </span>
      ))}
      {!grande && item.numero_impacto && (
        <span className="ml-2 text-fenix tabular-nums">{item.numero_impacto}</span>
      )}
    </p>
  );
}

// Lacunas: número e âncoras somem; a pessoa completa digitando.
export function Lacunas({
  item,
  onConferido,
}: {
  item: QaItem;
  onConferido: (sugestao: Nota) => void;
}) {
  const [{ linhas, respostas }] = useState(() => montarLacunas(item));
  const [digitado, setDigitado] = useState<string[]>(() => respostas.map(() => ""));
  const [conferido, setConferido] = useState(false);
  const primeiro = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primeiro.current?.focus();
  }, []);

  function conferir() {
    if (conferido) return;
    const acertos = respostas.filter((r, i) => confere(digitado[i], r)).length;
    setConferido(true);
    (document.activeElement as HTMLElement | null)?.blur();
    onConferido(acertos === respostas.length ? "acertei" : acertos > 0 ? "quase" : "errei");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        conferir();
      }}
      className="space-y-4"
    >
      {linhas.map((trechos, l) => (
        <p
          key={l}
          className={l === 0 ? "text-xl leading-loose font-medium sm:text-2xl" : "leading-loose text-cinza-quente"}
        >
          {trechos.map((t, k) => {
            if (t.tipo === "texto") return <span key={k}>{t.texto}</span>;
            const certo = respostas[t.indice];
            const acertou = confere(digitado[t.indice], certo);
            if (conferido) {
              return (
                <span key={k} className={acertou ? "text-menta" : "text-osso"}>
                  {!acertou && digitado[t.indice] && (
                    <s className="mr-1.5 text-cinza-quente">{digitado[t.indice]}</s>
                  )}
                  <span className={acertou ? "" : "underline decoration-cinza-quente underline-offset-4"}>
                    {certo}
                  </span>
                  <span className="sr-only">{acertou ? " (certo)" : " (resposta certa)"}</span>
                </span>
              );
            }
            return (
              <input
                key={k}
                ref={t.indice === 0 ? primeiro : undefined}
                aria-label={`Lacuna ${t.indice + 1}`}
                autoComplete="off"
                spellCheck={false}
                value={digitado[t.indice]}
                onChange={(e) =>
                  setDigitado((d) => d.map((v, i) => (i === t.indice ? e.target.value : v)))
                }
                style={{ width: `${Math.max(3, certo.length + 1)}ch` }}
                className="mx-1 border-b border-cinza-quente bg-transparent text-center text-osso focus:border-osso focus:outline-none"
              />
            );
          })}
        </p>
      ))}
      {!conferido && (
        <button
          type="submit"
          className="mt-4 rounded-[3px] border border-fio px-4 py-2 text-sm hover:border-cinza-quente"
        >
          Conferir <span className="text-cinza-quente">Enter</span>
        </button>
      )}
    </form>
  );
}

// Pergunta-relâmpago: 40 segundos para falar em voz alta.
export function Cronometro({ segundos, onFim }: { segundos: number; onFim: () => void }) {
  const [restante, setRestante] = useState(segundos);
  const fim = useRef(onFim);

  useEffect(() => {
    fim.current = onFim;
  });

  useEffect(() => {
    const inicio = performance.now();
    const id = setInterval(() => {
      const r = Math.max(0, segundos - Math.floor((performance.now() - inicio) / 1000));
      setRestante(r);
      if (r === 0) {
        clearInterval(id);
        fim.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [segundos]);

  return (
    <div>
      <div className="flex items-baseline justify-between text-rotulo text-cinza-quente">
        <span>Fale em voz alta antes do tempo acabar.</span>
        <span className="font-display text-2xl text-osso tabular-nums">{restante}s</span>
      </div>
      <div aria-hidden className="mt-3 h-px w-full bg-fio">
        <div
          className="h-px origin-left bg-osso transition-transform duration-200 ease-linear"
          style={{ transform: `scaleX(${restante / segundos})` }}
        />
      </div>
    </div>
  );
}
