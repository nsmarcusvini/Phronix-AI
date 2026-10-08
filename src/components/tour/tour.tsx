"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PLANOS } from "@/lib/planos";
import { createClient } from "@/lib/supabase/client";

// Tour guiado do primeiro acesso, no painel. Passos com alvo destacam um
// elemento marcado com data-tour (o resto da tela escurece); passos sem alvo
// aparecem no centro e explicam as telas que a pessoa ainda não abriu
// (diagnóstico, conversa, mapa, prática, Hora do Show). Concluir ou pular
// grava profiles.tour_concluido_em, e o tour não volta.

type Passo = { alvo?: string; rotulo: string; titulo: string; texto: string };

const GRATIS = PLANOS.find((p) => p.id === "gratis");

const PASSOS: Passo[] = [
  {
    rotulo: "Boas-vindas",
    titulo: "Seu currículo está salvo.",
    texto:
      "Em um minuto, mostro o caminho do Phronix: da vaga até a hora da entrevista, com um roteiro curto e ensaiado.",
  },
  {
    alvo: "cadastrar-vaga",
    rotulo: "Painel",
    titulo: "Tudo começa por uma vaga.",
    texto:
      "Cole a descrição da vaga da sua próxima entrevista e, se souber, a data. Cada vaga vira uma preparação aqui no painel.",
  },
  {
    rotulo: "Diagnóstico",
    titulo: "A IA compara você com a vaga.",
    texto:
      "Você vê seu nível e o nível que a vaga pede, o match de 0 a 100, pontos fortes, lacunas e uma estratégia de posicionamento. Não concorda com o nível? Ajuste com um toque.",
  },
  {
    alvo: "aneis",
    rotulo: "Entrevistas",
    titulo: "Escolha o que preparar.",
    texto:
      "RH, Técnica ou Liderança: cada tipo muda as perguntas e o tom. Cada um vira um anel aqui, que fecha conforme você fica pronto para o show.",
  },
  {
    rotulo: "Conversa",
    titulo: "As histórias que o currículo não conta.",
    texto:
      "A IA faz uma pergunta por vez sobre os requisitos da vaga e transforma cada história num case: situação, o que você fez e o resultado. Nada é inventado: número que falta fica marcado para você confirmar.",
  },
  {
    rotulo: "Mapa",
    titulo: "Respostas que cabem em 30 segundos.",
    texto:
      "De 12 a 20 perguntas prováveis, cada uma com gancho, três pontos, âncoras para lembrar e o número de impacto. Tudo é editável, e a IA reescreve mais curto, mais natural ou mais técnico.",
  },
  {
    rotulo: "Prática",
    titulo: "Poucos minutos por dia.",
    texto:
      "Flashcards, âncoras, lacunas e pergunta-relâmpago em voz alta. Acertou, a resposta avança; errou, ela volta. Com a data da entrevista, o ritmo se ajusta sozinho até o dia.",
  },
  {
    rotulo: "Hora do Show",
    titulo: "Na entrevista, à mão.",
    texto:
      "Uma tela escura, de leitura rápida, para consultar suas respostas ao vivo sem perder o olhar da câmera. Funciona sem internet depois de aberta uma vez.",
  },
  {
    alvo: "curriculo",
    rotulo: "Currículo",
    titulo: "A base de todas as vagas.",
    texto: "Mudou de emprego ou quer corrigir algo? Atualize aqui. Os kits que você já criou não mudam.",
  },
  {
    alvo: "nav-conta",
    rotulo: "Conta",
    titulo: "Seu plano e seus dados.",
    texto: `No grátis você tem ${GRATIS?.inclui ?? "1 kit com até 8 perguntas"}. Em Conta você vê o plano, troca a senha e pode excluir seus dados.`,
  },
  {
    rotulo: "Pronto",
    titulo: "Vamos à sua próxima entrevista?",
    texto: "Cadastre a vaga agora. Se preferir explorar antes, abra o kit de demonstração.",
  },
];

const LARGURA = 352;
const MARGEM = 16;
const FOLGA = 8;

type Caixa = { top: number; left: number; width: number; height: number };

// O primeiro elemento visível com o data-tour (alguns existem em duas versões,
// uma para celular e outra para desktop).
function alvoVisivel(nome: string) {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${nome}"]`)].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

export function Tour({ nome }: { nome: string | null }) {
  const [aberto, setAberto] = useState(true);
  const [i, setI] = useState(0);
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [celular, setCelular] = useState(false);
  const cartao = useRef<HTMLDivElement>(null);
  const passo = PASSOS[i];
  const ultimo = i === PASSOS.length - 1;

  const medir = useCallback(() => {
    setCelular(window.innerWidth < 640);
    const el = passo.alvo ? alvoVisivel(passo.alvo) : undefined;
    if (!el) return setCaixa(null);
    const r = el.getBoundingClientRect();
    // Não deixa o destaque sair pelo topo (ex.: links do cabeçalho).
    const top = Math.max(4, r.top - FOLGA);
    const nova = { top, left: r.left - FOLGA, width: r.width + FOLGA * 2, height: r.bottom + FOLGA - top };
    // Mesma posição: devolve o estado anterior e o React não renderiza de novo.
    setCaixa((atual) =>
      atual &&
      Math.abs(atual.top - nova.top) < 0.5 &&
      Math.abs(atual.left - nova.left) < 0.5 &&
      Math.abs(atual.width - nova.width) < 0.5 &&
      Math.abs(atual.height - nova.height) < 0.5
        ? atual
        : nova,
    );
  }, [passo.alvo]);

  // Leva o alvo para a tela antes de medir; no celular, para o alto, porque
  // o cartão ocupa a parte de baixo.
  useLayoutEffect(() => {
    if (!aberto) return;
    const el = passo.alvo ? alvoVisivel(passo.alvo) : undefined;
    if (el) {
      const r = el.getBoundingClientRect();
      const destino =
        window.innerWidth < 640 ? r.top + window.scrollY - 80 : r.top + window.scrollY - window.innerHeight / 3;
      window.scrollTo({ top: Math.max(0, destino) });
    }
    cartao.current?.focus();
    // Mede no próximo quadro, já com a rolagem aplicada.
    const quadro = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(quadro);
  }, [aberto, passo.alvo, medir]);

  // Acompanha o alvo a cada quadro enquanto o tour está aberto: rolagem,
  // janela e fontes que terminam de carregar mexem no layout sem avisar.
  // Só renderiza de novo quando a posição muda (ver medir).
  useEffect(() => {
    if (!aberto) return;
    let quadro = requestAnimationFrame(function seguir() {
      medir();
      quadro = requestAnimationFrame(seguir);
    });
    return () => cancelAnimationFrame(quadro);
  }, [aberto, medir]);

  async function encerrar() {
    setAberto(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ tour_concluido_em: new Date().toISOString() }).eq("id", user.id);
  }

  function avancar() {
    if (ultimo) void encerrar();
    else setI((n) => n + 1);
  }

  if (!aberto) return null;

  // Posição do cartão: ao lado do alvo no desktop, embaixo no celular,
  // centralizado quando o passo não tem alvo.
  let estilo: React.CSSProperties | undefined;
  if (caixa && !celular) {
    const abaixo = caixa.top + caixa.height + 280 < window.innerHeight;
    estilo = {
      left: Math.min(Math.max(caixa.left, MARGEM), window.innerWidth - LARGURA - MARGEM),
      ...(abaixo ? { top: caixa.top + caixa.height + 12 } : { bottom: window.innerHeight - caixa.top + 12 }),
    };
  }
  const primeiro = nome?.trim().split(/\s+/)[0];

  return (
    <div className="fixed inset-0 z-50">
      {/* Fundo: escurece tudo; com alvo, a sombra da caixa faz o recorte. */}
      {caixa ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[4px] border border-osso/70 shadow-[0_0_0_9999px_rgb(10_10_11/0.78)] transition-[top,left,width,height] duration-300 ease-brasa"
          style={caixa}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-noite/85 backdrop-blur-[2px]" />
      )}
      {/* Bloqueia cliques na página durante o tour. */}
      <div aria-hidden className="fixed inset-0" />

      <div
        ref={cartao}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        aria-describedby="tour-texto"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") void encerrar();
          else if (e.key === "ArrowRight") avancar();
          else if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
        }}
        style={estilo}
        className={`fixed rounded-[3px] border border-fio bg-grafite p-6 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.9)] outline-none ${
          caixa && !celular
            ? "w-[22rem]"
            : celular
              ? "inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
              : "top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-8"
        }`}
      >
        <div key={i} className="animate-revelar">
          <p className="text-rotulo text-cinza-quente">
            {passo.rotulo}{" "}
            <span className="tabular-nums">
              · {i + 1} de {PASSOS.length}
            </span>
          </p>
          <h2 id="tour-titulo" className="mt-2 font-display text-2xl font-medium text-balance">
            {i === 0 && primeiro ? `${primeiro}, seu currículo está salvo.` : passo.titulo}
          </h2>
          <p id="tour-texto" className="mt-3 text-pretty text-cinza-quente">
            {passo.texto}
          </p>
        </div>

        {/* O progresso como a trilha dos passos do app. */}
        <ol aria-hidden className="mt-6 flex items-center gap-1.5">
          {PASSOS.map((p, n) => (
            <li
              key={p.rotulo}
              className={`h-1 rounded-full transition-all duration-300 ease-brasa ${
                n === i ? "w-5 bg-fenix" : n < i ? "w-1.5 bg-osso" : "w-1.5 bg-fio"
              }`}
            />
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          {ultimo ? (
            <>
              <Link
                href="/painel/nova-vaga"
                onClick={() => void encerrar()}
                className="rounded-[3px] bg-fenix px-6 py-3 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
              >
                Cadastrar minha primeira vaga
              </Link>
              <Link
                href="/kits/demo/pratica"
                onClick={() => void encerrar()}
                className="text-sm text-osso underline-offset-4 hover:underline"
              >
                Ver o kit de demonstração
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={avancar}
                className="rounded-[3px] bg-fenix px-6 py-3 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
              >
                {i === 0 ? "Começar o tour" : "Próximo"}
              </button>
              {i > 0 && (
                <button type="button" onClick={() => setI(i - 1)} className="text-sm text-osso hover:underline">
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={() => void encerrar()}
                className="ml-auto text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
              >
                Pular tour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
