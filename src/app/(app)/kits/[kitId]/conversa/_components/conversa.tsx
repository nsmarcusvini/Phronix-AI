"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import { NOME_TIPO } from "@/lib/hora-do-show/categorias";
import {
  abertura,
  casesDoCurriculo,
  encerramento,
  requisitosConversa,
  respostaPulou,
  respostaSemExemplo,
  turnos,
  type CaseRascunho,
} from "@/lib/demo/preparacao";
import { CartaoCase } from "./cartao-case";
import { Cobertura, META_COBERTURA } from "./cobertura";
import { useDitado } from "./use-ditado";

type Mensagem = { id: number; papel: "ia" | "voce"; texto: string };

const CHIPS = ["Não tenho esse exemplo", "Tenho, mas sem número", "Pular"] as const;
type Chip = (typeof CHIPS)[number];

const PENSANDO_MS = 450;
const CARACTERES_POR_PASSO = 3;
const PASSO_MS = 16;

// Garimpo de cases. Exemplo encenado: as falas da IA são pré-escritas e não
// dependem do que a pessoa responde. Com a IA ligada, os cases saem das respostas.
export function Conversa({ tipo }: { tipo: TipoEntrevista }) {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [cases, setCases] = useState<CaseRascunho[]>(casesDoCurriculo);
  const [turno, setTurno] = useState(0);
  // Falas da IA esperando para entrar, e a que está sendo escrita agora.
  const [fila, setFila] = useState<string[]>(() => [abertura, turnos[0].pergunta]);
  const [escrevendo, setEscrevendo] = useState<{ id: number; texto: string; mostrado: number } | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [gerando, setGerando] = useState(false);
  const proximoId = useRef(0);
  const fim = useRef<HTMLDivElement>(null);
  const ditado = useDitado((texto) => setRascunho((r) => (r ? `${r} ${texto}` : texto)));

  const falando = escrevendo !== null || fila.length > 0;
  const cobertos = new Set(cases.flatMap((c) => c.requisitos));
  const fracao = requisitosConversa.filter((r) => cobertos.has(r)).length / requisitosConversa.length;
  const terminou = turno >= turnos.length;

  // Próxima fala da fila: uma pausa curta ("pensando") e começa a escrever.
  useEffect(() => {
    if (escrevendo || fila.length === 0) return;
    const espera = setTimeout(() => {
      setEscrevendo({ id: proximoId.current++, texto: fila[0], mostrado: 0 });
      setFila((f) => f.slice(1));
    }, PENSANDO_MS);
    return () => clearTimeout(espera);
  }, [escrevendo, fila]);

  // Streaming: alguns caracteres por quadro; no fim, a fala vira mensagem.
  useEffect(() => {
    if (!escrevendo) return;
    const passo = setTimeout(() => {
      if (escrevendo.mostrado >= escrevendo.texto.length) {
        setMensagens((m) => [...m, { id: escrevendo.id, papel: "ia", texto: escrevendo.texto }]);
        setEscrevendo(null);
      } else {
        setEscrevendo({ ...escrevendo, mostrado: escrevendo.mostrado + CARACTERES_POR_PASSO });
      }
    }, PASSO_MS);
    return () => clearTimeout(passo);
  }, [escrevendo]);

  const idEscrevendo = escrevendo?.id;
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [mensagens.length, idEscrevendo]);

  function responder(texto: string, chip?: Chip) {
    if (falando || terminou) return;
    setMensagens((m) => [...m, { id: proximoId.current++, papel: "voce", texto }]);
    setRascunho("");
    const atual = turnos[turno];
    const falas: string[] = [];

    if (chip === "Pular") falas.push(respostaPulou);
    else if (chip === "Não tenho esse exemplo") falas.push(respostaSemExemplo);
    else {
      const resultado = chip === "Tenho, mas sem número" && atual.semNumero ? atual.semNumero : atual.resposta;
      falas.push(resultado.reconhecimento);
      setCases((c) => [...c.filter((x) => x.id !== resultado.case.id), resultado.case]);
    }

    const proximo = turno + 1;
    setTurno(proximo);
    const cobertosDepois =
      chip === "Pular" || chip === "Não tenho esse exemplo" ? cobertos.size : new Set([...cobertos, atual.alvo]).size;
    const coberturaDepois = cobertosDepois / requisitosConversa.length;

    if (proximo < turnos.length) {
      const pergunta = turnos[proximo].pergunta;
      falas.push(coberturaDepois >= META_COBERTURA ? `Já dá para gerar o mapa. Se quiser, mais uma: ${pergunta}` : pergunta);
    } else {
      falas.push(encerramento(cobertosDepois, requisitosConversa.length, coberturaDepois >= META_COBERTURA));
    }
    setFila((f) => [...f, ...falas]);
  }

  function gerarMapa() {
    setGerando(true);
    setTimeout(() => router.push("/kits/demo/mapa"), 1200);
  }

  const pronto = fracao >= META_COBERTURA;

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 pt-8 pb-10 sm:px-8 lg:grid-cols-[1fr_20rem] lg:gap-16">
      <section aria-label="Conversa" className="flex min-h-[70dvh] flex-col">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-rotulo text-cinza-quente">Garimpo de cases · {NOME_TIPO[tipo]}</h1>
          <p className="text-rotulo">
            <span className="text-ambar">Exemplo.</span>{" "}
            <span className="text-cinza-quente">As falas da IA são simuladas e não leem o que você escreve.</span>
          </p>
        </div>

        <div className="mt-4 lg:hidden">
          <Cobertura requisitos={requisitosConversa} cases={cases} compacta />
        </div>

        <ol className="mt-8 flex-1 space-y-8">
          {mensagens.map((m) =>
            m.papel === "ia" ? (
              <li key={m.id} className="max-w-[38rem]">
                <p className="text-lg leading-relaxed text-pretty sm:text-xl">{m.texto}</p>
              </li>
            ) : (
              <li key={m.id} className="ml-auto max-w-[32rem] animate-revelar">
                <p className="rounded-[3px] bg-grafite px-4 py-3 text-osso/90">{m.texto}</p>
              </li>
            ),
          )}
          {escrevendo && (
            <li className="max-w-[38rem]">
              <p className="text-lg leading-relaxed text-pretty sm:text-xl">
                {escrevendo.texto.slice(0, escrevendo.mostrado)}
                <span aria-hidden className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-osso" />
              </p>
            </li>
          )}
          {!escrevendo && fila.length > 0 && (
            <li aria-hidden className="flex gap-1.5">
              {[0, 1, 2].map((k) => (
                <span key={k} className="size-1.5 animate-pulse rounded-full bg-cinza-quente" style={{ animationDelay: `${k * 150}ms` }} />
              ))}
            </li>
          )}
        </ol>
        <div ref={fim} />

        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-fio bg-noite/95 px-4 pt-4 pb-4 backdrop-blur sm:mx-0 sm:px-0">
          {!terminou && (
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={falando}
                  onClick={() => responder(chip, chip)}
                  className="rounded-[3px] border border-fio px-3 py-1.5 text-sm text-cinza-quente transition-colors duration-150 hover:border-cinza-quente hover:text-osso disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (rascunho.trim()) responder(rascunho.trim());
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Sua resposta</span>
              <textarea
                value={rascunho}
                rows={1}
                disabled={terminou}
                onChange={(e) => setRascunho(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (rascunho.trim()) responder(rascunho.trim());
                  }
                }}
                placeholder={terminou ? "Conversa encerrada." : "Conte com suas palavras. Enter envia."}
                className="field-sizing-content block max-h-48 min-h-11 w-full resize-none rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso placeholder:text-cinza-quente focus:border-cinza-quente focus:outline-none disabled:opacity-50"
              />
            </label>
            {ditado.suportado && !terminou && (
              <button
                type="button"
                aria-pressed={ditado.ouvindo}
                onClick={ditado.alternar}
                className={`min-h-11 rounded-[3px] border px-3 text-sm ${
                  ditado.ouvindo ? "border-osso text-osso" : "border-fio text-cinza-quente hover:text-osso"
                }`}
              >
                {ditado.ouvindo ? "Ouvindo…" : "Ditar"}
              </button>
            )}
            <button
              type="submit"
              disabled={falando || terminou || !rascunho.trim()}
              className="min-h-11 rounded-[3px] border border-osso px-4 text-sm text-osso disabled:border-fio disabled:text-fio"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto">
        <div className="hidden lg:block">
          <Cobertura requisitos={requisitosConversa} cases={cases} />
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={gerarMapa}
            disabled={gerando}
            className={`w-full rounded-[3px] px-6 py-3.5 font-semibold transition-[transform,background-color,color] duration-300 ease-brasa ${
              pronto
                ? "bg-fenix text-noite shadow-fenix hover:-translate-y-0.5 focus-visible:outline-osso"
                : "border border-fio text-osso hover:border-cinza-quente"
            }`}
          >
            {gerando ? "Gerando seu mapa…" : "Gerar meu mapa"}
          </button>
          {!pronto && (
            <p className="mt-2 text-rotulo text-cinza-quente">
              Dá para gerar agora; com 80% de cobertura o mapa fica mais forte.
            </p>
          )}
        </div>

        <h2 className="mt-12 text-rotulo text-cinza-quente">
          Cases <span className="tabular-nums">({cases.length})</span>
        </h2>
        <div className="mt-4 space-y-6">
          {cases.map((c) => (
            <CartaoCase
              key={c.id}
              caso={c}
              onTitulo={(titulo) => setCases((lista) => lista.map((x) => (x.id === c.id ? { ...x, titulo } : x)))}
              onDescartar={() => setCases((lista) => lista.filter((x) => x.id !== c.id))}
            />
          ))}
        </div>
      </aside>
    </main>
  );
}
