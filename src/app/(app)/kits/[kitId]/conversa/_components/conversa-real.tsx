"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import { NOME_TIPO } from "@/lib/hora-do-show/categorias";
import { createClient } from "@/lib/supabase/client";
import { Processando } from "@/app/(app)/preparacoes/nova/_components/comum";
import { CartaoCase, type CaseVisivel } from "./cartao-case";
import { Cobertura, META_COBERTURA } from "./cobertura";
import { useDitado } from "./use-ditado";

type Mensagem = { id: string; papel: "ia" | "voce"; texto: string };

const CHIPS = ["Não tenho esse exemplo", "Tenho, mas sem número", "Pular"] as const;

type Props = {
  kitId: string;
  tipo: TipoEntrevista;
  requisitos: string[];
  mensagensIniciais: Mensagem[];
  casesIniciais: CaseVisivel[];
};

// Garimpo de cases com a IA (Sonnet 5.5) em streaming. Cada mensagem vai para
// /api/ia/conversa; a resposta chega em linhas NDJSON (texto, case, cobertura).
export function ConversaReal({ kitId, tipo, requisitos, mensagensIniciais, casesIniciais }: Props) {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>(mensagensIniciais);
  const [cases, setCases] = useState<CaseVisivel[]>(casesIniciais);
  const [escrevendo, setEscrevendo] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erroMapa, setErroMapa] = useState<string | null>(null);
  const iniciou = useRef(false);
  const fim = useRef<HTMLDivElement>(null);
  const ditado = useDitado((texto) => setRascunho((r) => (r ? `${r} ${texto}` : texto)));

  const ocupado = escrevendo !== null;
  const cobertos = new Set(cases.flatMap((c) => c.requisitos));
  const fracao = requisitos.length ? requisitos.filter((r) => cobertos.has(r)).length / requisitos.length : 0;
  const pronto = fracao >= META_COBERTURA;

  async function enviar(texto: string | null) {
    if (ocupado) return;
    setErro(null);
    if (texto) setMensagens((m) => [...m, { id: crypto.randomUUID(), papel: "voce", texto }]);
    setRascunho("");
    setEscrevendo("");

    let acumulado = "";
    try {
      const resposta = await fetch("/api/ia/conversa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId, mensagem: texto }),
      });
      if (!resposta.ok || !resposta.body) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.erro ?? "A conversa não respondeu agora.");
      }
      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      let sobra = "";
      for (;;) {
        const { value, done } = await leitor.read();
        if (done) break;
        sobra += decodificador.decode(value, { stream: true });
        const linhas = sobra.split("\n");
        sobra = linhas.pop() ?? "";
        for (const linha of linhas) {
          if (!linha.trim()) continue;
          const evento = JSON.parse(linha);
          if (evento.t === "texto") {
            acumulado += evento.d;
            setEscrevendo(acumulado);
          } else if (evento.t === "case") {
            setCases((c) => [...c, evento.case as CaseVisivel]);
          } else if (evento.t === "erro") {
            throw new Error(evento.erro);
          }
        }
      }
      if (acumulado.trim()) setMensagens((m) => [...m, { id: crypto.randomUUID(), papel: "ia", texto: acumulado }]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "A conversa travou agora. Tente mandar de novo.");
    } finally {
      setEscrevendo(null);
    }
  }

  // Primeira visita: a IA abre a conversa (registra os cases do currículo e pergunta).
  useEffect(() => {
    if (iniciou.current || mensagensIniciais.length > 0) return;
    iniciou.current = true;
    void enviar(null);
    // Roda uma vez ao montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tamanhoEscrevendo = escrevendo?.length ?? 0;
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [mensagens.length, tamanhoEscrevendo]);

  async function renomear(id: string, titulo: string) {
    setCases((lista) => lista.map((c) => (c.id === id ? { ...c, titulo } : c)));
    await createClient().from("cases").update({ titulo }).eq("id", id);
  }

  async function descartar(id: string) {
    setCases((lista) => lista.filter((c) => c.id !== id));
    await createClient().from("cases").delete().eq("id", id);
  }

  async function gerarMapa() {
    setGerando(true);
    setErroMapa(null);
    const resposta = await fetch("/api/ia/mapa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kitId }),
    }).catch(() => null);
    const corpo = await resposta?.json().catch(() => null);
    if (resposta?.ok || resposta?.status === 409) {
      router.push(`/kits/${kitId}/mapa`);
      return;
    }
    setErroMapa(corpo?.erro ?? "O mapa não saiu agora. Tente de novo.");
    setGerando(false);
  }

  if (gerando) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-14 sm:px-8">
        <h1 className="font-display text-display-lg font-medium">Escrevendo seu mapa</h1>
        <p className="mt-4 max-w-prose text-cinza-quente">
          De 12 a 20 respostas curtas, ligadas aos seus cases. Leva menos de um minuto.
        </p>
        <div className="mt-10">
          <Processando
            etapas={[
              "Escolhendo as perguntas prováveis",
              "Ligando cada resposta a um case",
              "Cortando para caber em 30 segundos",
              "Marcando o que falta confirmar",
            ]}
            duracao={40000}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 pt-8 pb-10 sm:px-8 lg:grid-cols-[1fr_20rem] lg:gap-16">
      <section aria-label="Conversa" className="flex min-h-[70dvh] flex-col">
        <h1 className="text-rotulo text-cinza-quente">Garimpo de cases · {NOME_TIPO[tipo]}</h1>

        <div className="mt-4 lg:hidden">
          <Cobertura requisitos={requisitos} cases={cases} compacta />
        </div>

        <ol className="mt-8 flex-1 space-y-8">
          {mensagens.map((m) =>
            m.papel === "ia" ? (
              <li key={m.id} className="max-w-[38rem]">
                <p className="text-lg leading-relaxed whitespace-pre-line text-pretty sm:text-xl">{m.texto}</p>
              </li>
            ) : (
              <li key={m.id} className="ml-auto max-w-[32rem] animate-revelar">
                <p className="rounded-[3px] bg-grafite px-4 py-3 whitespace-pre-line text-osso/90">{m.texto}</p>
              </li>
            ),
          )}
          {escrevendo !== null &&
            (escrevendo ? (
              <li className="max-w-[38rem]">
                <p className="text-lg leading-relaxed whitespace-pre-line text-pretty sm:text-xl">
                  {escrevendo}
                  <span aria-hidden className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-osso" />
                </p>
              </li>
            ) : (
              <li aria-hidden className="flex gap-1.5">
                {[0, 1, 2].map((k) => (
                  <span key={k} className="size-1.5 animate-pulse rounded-full bg-cinza-quente" style={{ animationDelay: `${k * 150}ms` }} />
                ))}
              </li>
            ))}
          {erro && (
            <li role="alert" className="text-sm text-ambar">
              {erro}{" "}
              <button type="button" onClick={() => void enviar(null)} className="text-osso underline underline-offset-4">
                Tentar de novo
              </button>
            </li>
          )}
        </ol>
        <div ref={fim} />

        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-fio bg-noite/95 px-4 pt-4 pb-4 backdrop-blur sm:mx-0 sm:px-0">
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={ocupado}
                onClick={() => void enviar(chip)}
                className="rounded-[3px] border border-fio px-3 py-1.5 text-sm text-cinza-quente transition-colors duration-150 hover:border-cinza-quente hover:text-osso disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (rascunho.trim()) void enviar(rascunho.trim());
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Sua resposta</span>
              <textarea
                value={rascunho}
                rows={1}
                onChange={(e) => setRascunho(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (rascunho.trim()) void enviar(rascunho.trim());
                  }
                }}
                placeholder="Conte com suas palavras. Enter envia."
                className="field-sizing-content block max-h-48 min-h-11 w-full resize-none rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso placeholder:text-cinza-quente focus:border-cinza-quente focus:outline-none"
              />
            </label>
            {ditado.suportado && (
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
              disabled={ocupado || !rascunho.trim()}
              className="min-h-11 rounded-[3px] border border-osso px-4 text-sm text-osso disabled:border-fio disabled:text-fio"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto">
        <div className="hidden lg:block">
          <Cobertura requisitos={requisitos} cases={cases} />
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={gerarMapa}
            disabled={ocupado}
            className={`w-full rounded-[3px] px-6 py-3.5 font-semibold transition-[transform,background-color,color] duration-300 ease-brasa disabled:opacity-50 ${
              pronto
                ? "bg-fenix text-noite shadow-fenix hover:-translate-y-0.5 focus-visible:outline-osso"
                : "border border-fio text-osso hover:border-cinza-quente"
            }`}
          >
            Gerar meu mapa
          </button>
          {erroMapa ? (
            <p role="alert" className="mt-2 text-sm text-ambar">
              {erroMapa}
            </p>
          ) : (
            !pronto && (
              <p className="mt-2 text-rotulo text-cinza-quente">
                Dá para gerar agora; com 80% de cobertura o mapa fica mais forte.
              </p>
            )
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
              onTitulo={(titulo) => void renomear(c.id, titulo)}
              onDescartar={() => void descartar(c.id)}
            />
          ))}
        </div>
      </aside>
    </main>
  );
}
