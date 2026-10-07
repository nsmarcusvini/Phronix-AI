"use client";

import { useEffect, useRef } from "react";

const PASSOS = [
  {
    numero: "01",
    nome: "Prepare",
    texto:
      "Envie o currículo e cole a vaga. Você vê seu nível, o match com a vaga e responde uma conversa curta que encontra os casos que o currículo não conta.",
  },
  {
    numero: "02",
    nome: "Pratique",
    texto:
      "Sessões de 5 minutos com flashcards, âncoras e lacunas. A agenda se ajusta à data da entrevista: faltando três dias, as revisões acontecem em horas.",
  },
  {
    numero: "03",
    nome: "Use ao vivo",
    texto:
      "Na Hora do Show, uma tela preta mostra só o que você vai falar. Busca por poucas letras, atalhos de teclado e funciona sem internet.",
  },
];

// O momento da landing: um fio desce pelos passos e o ponto acompanha a
// rolagem até o Palco, que é a demo logo abaixo. Ligado à rolagem, não ao tempo.
export function Passos() {
  const trilha = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trilha.current;
    if (!el) return;
    let quadro = 0;

    function atualizar() {
      quadro = 0;
      if (!el) return;
      const caixa = el.getBoundingClientRect();
      const meio = window.innerHeight * 0.55;
      const progresso = Math.min(1, Math.max(0, (meio - caixa.top) / caixa.height));
      el.style.setProperty("--progresso", String(progresso));
      el.querySelectorAll<HTMLElement>("[data-passo]").forEach((passo) => {
        if (passo.getBoundingClientRect().top < meio) passo.dataset.ativo = "";
        else delete passo.dataset.ativo;
      });
    }

    function agendar() {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    }

    atualizar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
    };
  }, []);

  return (
    <div ref={trilha} className="relative mt-16 sm:mt-24" style={{ "--progresso": 0 } as React.CSSProperties}>
      {/* Fio, trecho percorrido e o ponto. */}
      <div aria-hidden className="absolute top-2 bottom-0 left-[5px] w-px bg-fio sm:left-[7px]">
        <div className="absolute inset-x-0 top-0 h-full origin-top scale-y-[var(--progresso)] bg-osso" />
        <div
          className="absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-osso shadow-[0_0_24px_rgb(242_239_232/0.35)] sm:size-4"
          style={{ top: "calc(var(--progresso) * 100%)" }}
        />
      </div>

      <ol>
        {PASSOS.map((p) => (
          <li
            key={p.numero}
            data-passo
            className="group relative grid grid-cols-[2rem_1fr] gap-x-4 pb-24 sm:grid-cols-[4rem_1fr] sm:pb-40 lg:grid-cols-[4rem_14rem_1fr] lg:gap-x-10"
          >
            <span
              aria-hidden
              className="relative top-2 size-3 rounded-full border border-fio bg-noite transition-colors duration-500 group-data-[ativo]:border-osso group-data-[ativo]:bg-osso sm:size-4"
            />
            <p className="font-display text-display-lg font-semibold tabular-nums text-fio transition-colors duration-500 group-data-[ativo]:text-cinza-quente">
              {p.numero}
            </p>
            <div className="col-start-2 lg:col-start-3">
              <h3 className="font-display text-display-lg font-medium text-cinza-quente transition-colors duration-500 group-data-[ativo]:text-osso">
                {p.nome}
              </h3>
              <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-cinza-quente">{p.texto}</p>
            </div>
          </li>
        ))}
        <li className="relative grid grid-cols-[2rem_1fr] gap-x-4 sm:grid-cols-[4rem_1fr] lg:grid-cols-[4rem_14rem_1fr] lg:gap-x-10">
          <span aria-hidden className="relative top-1 size-3 rounded-full bg-fenix sm:size-4" />
          <p className="text-rotulo text-cinza-quente lg:col-span-2">Palco</p>
        </li>
      </ol>
    </div>
  );
}
