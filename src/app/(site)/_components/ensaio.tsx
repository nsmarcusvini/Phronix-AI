"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarraApp,
  ConteudoDiagnostico,
  ConteudoMapa,
  ConteudoPratica,
  ConteudoShow,
  type Tela,
} from "./ensaio-telas";

// Direção "Ensaio": a landing é um ensaio geral em atos. A janela do produto
// fica presa na tela e a rolagem troca a tela real dentro dela; no último ato
// a sala escurece e a janela vira a Hora do Show.
// Celular e prefers-reduced-motion recebem a versão empilhada, sem nada preso.

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

// Cada tela ocupa um quarto da rolagem; as duas primeiras são do passo 01.
const TELAS: { tela: Tela; passo: number }[] = [
  { tela: "diagnostico", passo: 0 },
  { tela: "mapa", passo: 0 },
  { tela: "pratica", passo: 1 },
  { tela: "show", passo: 2 },
];

function Conteudo({ tela }: { tela: Tela }) {
  if (tela === "diagnostico") return <ConteudoDiagnostico />;
  if (tela === "mapa") return <ConteudoMapa />;
  if (tela === "pratica") return <ConteudoPratica />;
  return <ConteudoShow />;
}

export function Ensaio() {
  const palco = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const el = palco.current;
    if (!el) return;
    let quadro = 0;

    function atualizar() {
      quadro = 0;
      if (!el) return;
      const caixa = el.getBoundingClientRect();
      const percurso = caixa.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -caixa.top / percurso));
      el.style.setProperty("--p", p.toFixed(4));
      // O ponto da Prática anda dentro do terceiro quarto da rolagem.
      el.style.setProperty("--pratica", Math.min(1, Math.max(0, (p - 0.52) / 0.2)).toFixed(4));
      setIndice(Math.min(TELAS.length - 1, Math.floor(p * TELAS.length)));
    }

    function agendar() {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    }

    agendar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
    };
  }, []);

  const atual = TELAS[indice];
  const noShow = atual.tela === "show";

  return (
    <>
      {/* Versão em atos, presa à tela: desktop com movimento. */}
      <div
        ref={palco}
        className="relative hidden h-[460vh] lg:block motion-reduce:lg:hidden"
        style={{ "--p": 0, "--pratica": 0 } as React.CSSProperties}
      >
        <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
          {/* A sala escurece no último ato. */}
          <div
            aria-hidden
            className={`absolute inset-0 bg-palco transition-opacity duration-[900ms] ease-brasa ${
              noShow ? "opacity-100" : "opacity-0"
            }`}
          />

          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-[19rem_1fr] items-center gap-14 px-8">
            {/* Texto do ato: troca junto com a tela. */}
            <div className="relative h-[22rem]" aria-live="polite">
              {PASSOS.map((p, i) => (
                <div
                  key={p.numero}
                  aria-hidden={i !== atual.passo}
                  className={`absolute inset-0 transition-[opacity,transform] duration-[700ms] ease-brasa ${
                    i === atual.passo ? "translate-y-0 opacity-100" : i < atual.passo ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                  }`}
                >
                  <p className="font-display text-xl tabular-nums text-cinza-quente">
                    {p.numero} <span className="text-fio">/ 03</span>
                  </p>
                  <h3 className="mt-3 font-display text-[clamp(3rem,2rem+2.4vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
                    {p.nome}
                  </h3>
                  <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-cinza-quente">{p.texto}</p>
                </div>
              ))}
              {/* Progresso dos atos: o fio e os pontos da Trilha. */}
              <div aria-hidden className="absolute bottom-0 left-0 flex w-40 items-center">
                <span className="absolute inset-x-0 top-1/2 h-px bg-fio" />
                <span
                  className="absolute top-1/2 left-0 h-px w-full origin-left bg-osso"
                  style={{ transform: "scaleX(var(--p))" }}
                />
                <span className="relative flex w-full justify-between">
                  {TELAS.map((t, i) => (
                    <span
                      key={t.tela}
                      className={`size-2.5 rounded-full transition-colors duration-500 ${
                        i < indice ? "bg-osso" : i === indice ? "bg-fenix" : "border border-fio bg-noite"
                      }`}
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* A janela: inclinada no começo, endireita com a rolagem. */}
            <div className="[perspective:1600px]">
              <div
                className={`relative h-[31rem] overflow-hidden rounded-xl border bg-noite transition-[border-color,box-shadow] duration-[900ms] ease-brasa ${
                  noShow
                    ? "border-fenix/40 shadow-[0_40px_140px_-30px_rgb(255_90_31/0.55)]"
                    : "border-fio shadow-[0_40px_120px_-40px_rgb(255_90_31/0.25)]"
                }`}
                style={{
                  transform:
                    "rotateX(calc((1 - min(calc(var(--p) * 10), 1)) * 16deg)) scale(calc(0.94 + min(calc(var(--p) * 10), 1) * 0.06))",
                  transformOrigin: "50% 0%",
                }}
              >
                <div className={`transition-opacity duration-500 ${noShow ? "opacity-0" : "opacity-100"}`}>
                  <BarraApp tela={atual.tela === "show" ? "pratica" : atual.tela} />
                </div>
                {TELAS.map((t, i) => (
                  <div
                    key={t.tela}
                    aria-hidden={i !== indice}
                    className={`absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-[700ms] ease-brasa ${
                      t.tela === "show" ? "top-0" : "top-11"
                    } ${i === indice ? "translate-y-0 opacity-100" : i < indice ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0"}`}
                  >
                    <Conteudo tela={t.tela} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Versão empilhada: celular e movimento reduzido. */}
      <ol className="lg:hidden motion-reduce:lg:block">
        {PASSOS.map((p, i) => (
          <li key={p.numero} className="border-t border-fio py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-8">
              <p className="font-display text-xl tabular-nums text-cinza-quente">{p.numero}</p>
              <h3 className="mt-2 font-display text-display-lg font-semibold">{p.nome}</h3>
              <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-cinza-quente">{p.texto}</p>
              <div className="mt-8 space-y-5">
                {TELAS.filter((t) => t.passo === i).map((t) => (
                  <div key={t.tela} className="overflow-hidden rounded-xl border border-fio bg-noite">
                    {t.tela !== "show" && <BarraApp tela={t.tela} />}
                    {t.tela === "pratica" ? <ConteudoPratica estatico /> : <Conteudo tela={t.tela} />}
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
