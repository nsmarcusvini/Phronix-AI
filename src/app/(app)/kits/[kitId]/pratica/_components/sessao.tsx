"use client";

import { useEffect, useState } from "react";
import { aplicarNota, type EstadoItem, type Exercicio, type Nota } from "@/lib/pratica/leitner";
import { Ancoras, Cronometro, Lacunas, RespostaRevelada } from "./exercicios";
import { MiniTrilha } from "./mini-trilha";

export type ItemDaFila = { estado: EstadoItem; exercicio: Exercicio };
export type Resultado = { estado: EstadoItem; nota: Nota; antes: number; depois: number };

const NOME_EXERCICIO: Record<Exercicio, string> = {
  flashcard: "Flashcard",
  ancoras: "Âncoras",
  lacunas: "Lacunas",
  ordenar: "Ordenar",
  relampago: "Pergunta-relâmpago",
  ensaio_geral: "Ensaio geral",
};

const INSTRUCAO: Partial<Record<Exercicio, string>> = {
  flashcard: "Responda de cabeça ou em voz alta. Depois revele e se avalie.",
  ancoras: "Fale a resposta completa a partir das três âncoras.",
};

const NOTAS: { nota: Nota; tecla: string; nome: string }[] = [
  { nota: "errei", tecla: "1", nome: "Errei" },
  { nota: "quase", tecla: "2", nome: "Quase" },
  { nota: "acertei", tecla: "3", nome: "Acertei" },
];

type Props = {
  fila: ItemDaFila[];
  onNota: (item: ItemDaFila, nota: Nota) => Promise<void>;
  onFim: (resultados: Resultado[]) => void;
  onSair: () => void;
};

export function Sessao({ fila, onNota, onFim, onSair }: Props) {
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [sugestao, setSugestao] = useState<Nota | null>(null);
  const [caixaVisual, setCaixaVisual] = useState(fila[0].estado.caixa);
  const [avaliando, setAvaliando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  const atual = fila[indice];
  const { item } = atual.estado;
  const lacunas = atual.exercicio === "lacunas";

  async function avaliar(nota: Nota) {
    if (!revelado || avaliando) return;
    setAvaliando(true);
    const antes = atual.estado.caixa;
    const depois = aplicarNota(antes, nota);
    await onNota(atual, nota);
    setCaixaVisual(depois);
    const novos = [...resultados, { estado: atual.estado, nota, antes, depois }];
    setResultados(novos);

    // Deixa o ponto terminar de deslizar antes do próximo card.
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      if (indice + 1 >= fila.length) {
        onFim(novos);
        return;
      }
      const proximo = fila[indice + 1];
      setIndice(indice + 1);
      setCaixaVisual(proximo.estado.caixa);
      setRevelado(false);
      setSugestao(null);
      setAvaliando(false);
    }, reduzido ? 250 : 900);
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT") return;
      if (e.key === "Escape") onSair();
      else if (e.key === " " && !revelado && !lacunas) {
        e.preventDefault();
        setRevelado(true);
      } else if (revelado) {
        const escolhida = NOTAS.find((n) => n.tecla === e.key);
        if (escolhida) void avaliar(escolhida.nota);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-8 pb-12 sm:px-8 sm:pt-12">
      <div className="flex items-center gap-4 text-rotulo text-cinza-quente">
        <span>
          {NOME_EXERCICIO[atual.exercicio]} · <span className="tabular-nums">{indice + 1}/{fila.length}</span>
        </span>
        <div aria-hidden className="h-px flex-1 bg-fio">
          <div
            className="h-px origin-left bg-osso transition-transform duration-500 ease-brasa"
            style={{ transform: `scaleX(${(indice + (avaliando ? 1 : 0)) / fila.length})` }}
          />
        </div>
        <button type="button" onClick={onSair} className="hover:text-osso">
          Sair <span className="hidden sm:inline">· Esc</span>
        </button>
      </div>

      <div className="mt-12">
        <MiniTrilha caixa={caixaVisual} />
      </div>

      <h1
        key={item.id}
        className="mt-8 max-w-[22ch] animate-revelar font-display text-display-lg font-medium text-balance"
      >
        {item.pergunta}
      </h1>

      <div key={`corpo-${item.id}`} className="mt-10 flex-1">
        {atual.exercicio === "relampago" && !revelado && (
          <Cronometro segundos={40} onFim={() => setRevelado(true)} />
        )}

        {atual.exercicio === "ancoras" && !revelado && <Ancoras item={item} grande />}

        {INSTRUCAO[atual.exercicio] && !revelado && (
          <p className="mt-6 text-cinza-quente">{INSTRUCAO[atual.exercicio]}</p>
        )}

        {lacunas && (
          <Lacunas
            item={item}
            onConferido={(nota) => {
              setSugestao(nota);
              setRevelado(true);
            }}
          />
        )}

        {!lacunas && revelado && <RespostaRevelada item={item} />}

        {!lacunas && !revelado && (
          <button
            type="button"
            onClick={() => setRevelado(true)}
            className="mt-10 rounded-[3px] border border-fio px-5 py-2.5 hover:border-cinza-quente"
          >
            Revelar <span className="hidden text-cinza-quente sm:inline">· Espaço</span>
          </button>
        )}
      </div>

      {revelado && (
        <div className="mt-12 animate-revelar">
          <p className="text-rotulo text-cinza-quente">Como foi?</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {NOTAS.map((n) => (
              <button
                key={n.nota}
                type="button"
                disabled={avaliando}
                onClick={() => void avaliar(n.nota)}
                className={`flex min-h-14 items-baseline justify-between rounded-[3px] border px-4 py-3 text-left transition-[transform,border-color] duration-200 ease-brasa hover:-translate-y-0.5 disabled:hover:translate-y-0 ${
                  sugestao === n.nota ? "border-osso" : "border-fio hover:border-cinza-quente"
                }`}
              >
                <span className="font-medium">{n.nome}</span>
                <span className="hidden text-rotulo text-cinza-quente sm:inline">{n.tecla}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
