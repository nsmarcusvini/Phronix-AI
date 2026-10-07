"use client";

import { useState } from "react";
import type { QaItem } from "@/lib/domain";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import { contarPalavras, fala, pendenciasDeConfirmacao } from "@/lib/mapa/fala";
import { Campo } from "@/components/campo-inline";
import { Regua } from "./regua";

const NOME_CATEGORIA = new Map(CATEGORIAS.map((c) => [c.id, c.nome]));

// Anatomia do PRD para cases: contexto, o que eu fiz, resultado.
// Nas outras categorias (motivação, pretensão...) os pontos não seguem STAR.
const ROTULO_CASE = ["Contexto", "O que eu fiz", "Resultado"];
const ROTULO_PONTO = ["Ponto 1", "Ponto 2", "Ponto 3"];
const CATEGORIAS_CASE = new Set(["experiencia_cases", "perguntas_dificeis"]);
const ACOES = ["Mais curto", "Mais natural", "Mais técnico", "Regerar"];
const EXPANDIDA_MAXIMO = 120;

type Props = {
  item: QaItem;
  posicao: number;
  total: number;
  onAlterar: (alteracao: Partial<QaItem>) => void;
  onVoltar: () => void;
};

export function Editor({ item, posicao, total, onAlterar, onVoltar }: Props) {
  const [avisoIa, setAvisoIa] = useState(false);
  const temResposta = item.gancho !== null;
  const medida = fala(item);
  const pendencias = pendenciasDeConfirmacao(item);
  const palavrasExpandida = contarPalavras(item.expandida ?? "");

  function bullet(i: number, valor: string) {
    const bullets = [...item.bullets];
    while (bullets.length <= i) bullets.push("");
    bullets[i] = valor;
    onAlterar({ bullets });
  }

  function ancora(i: number, valor: string) {
    const ancoras = [...item.ancoras];
    while (ancoras.length <= i) ancoras.push("");
    ancoras[i] = valor;
    onAlterar({ ancoras });
  }

  return (
    <article key={item.id} className="animate-revelar">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="button" onClick={onVoltar} className="text-rotulo text-cinza-quente hover:text-osso lg:hidden">
          ← Mapa
        </button>
        <p className="text-rotulo text-cinza-quente">
          {NOME_CATEGORIA.get(item.categoria)} · <span className="tabular-nums">{posicao} de {total}</span>
        </p>
        <button
          type="button"
          aria-pressed={item.fixado}
          onClick={() => onAlterar({ fixado: !item.fixado })}
          className={`ml-auto rounded-[3px] border px-3 py-1.5 text-sm transition-colors duration-150 ${
            item.fixado ? "border-osso text-osso" : "border-fio text-cinza-quente hover:border-cinza-quente hover:text-osso"
          }`}
        >
          {item.fixado ? "Fixada na Hora do Show" : "Fixar na Hora do Show"}
        </button>
      </div>

      <div className="mt-6">
        <Campo
          rotulo="pergunta"
          valor={item.pergunta}
          onChange={(pergunta) => onAlterar({ pergunta })}
          className="font-display text-display-lg font-medium text-balance"
          linhaUnica
        />
      </div>

      {pendencias.length > 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-ambar">
          <span aria-hidden className="size-1.5 rounded-full bg-ambar" />
          {pendencias.length === 1 ? "1 dado para confirmar" : `${pendencias.length} dados para confirmar`}
          <span className="text-cinza-quente">: troque o marcador pelo dado real ou apague a frase.</span>
        </p>
      )}

      {temResposta ? (
        <>
          <div className="mt-10">
            <Regua {...medida} />
          </div>

          <dl className="mt-12 grid gap-x-8 gap-y-2 sm:grid-cols-[8rem_1fr] sm:gap-y-8">
            <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">Gancho</dt>
            <dd>
              <Campo
                rotulo="gancho"
                valor={item.gancho ?? ""}
                onChange={(gancho) => onAlterar({ gancho })}
                className="text-xl font-medium sm:text-2xl"
              />
            </dd>

            {(CATEGORIAS_CASE.has(item.categoria) ? ROTULO_CASE : ROTULO_PONTO).map((rotulo, i) => (
              <Bloco key={rotulo} rotulo={rotulo}>
                <Campo rotulo={rotulo} valor={item.bullets[i] ?? ""} onChange={(v) => bullet(i, v)} />
              </Bloco>
            ))}

            <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">Âncoras</dt>
            <dd className="flex flex-wrap items-baseline gap-x-4 gap-y-2 pl-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="flex items-baseline gap-x-4">
                  {i > 0 && (
                    <span aria-hidden className="text-fio">
                      ·
                    </span>
                  )}
                  <Campo
                    rotulo={`âncora ${i + 1}`}
                    valor={item.ancoras[i] ?? ""}
                    onChange={(v) => ancora(i, v)}
                    placeholder="âncora"
                    className="text-lg font-medium"
                    linhaUnica
                    compacto
                  />
                </span>
              ))}
            </dd>

            <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">Número de impacto</dt>
            <dd className="max-w-xs">
              <Campo
                rotulo="número de impacto"
                valor={item.numero_impacto ?? ""}
                onChange={(v) => onAlterar({ numero_impacto: v || null })}
                placeholder="Sem número"
                className="text-lg font-medium text-fenix tabular-nums"
                linhaUnica
              />
            </dd>

            <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">
              Follow-up
              <span className={`mt-1 block tabular-nums ${palavrasExpandida > EXPANDIDA_MAXIMO ? "text-ambar" : ""}`}>
                {palavrasExpandida}/{EXPANDIDA_MAXIMO} palavras
              </span>
            </dt>
            <dd>
              <Campo
                rotulo="versão expandida"
                valor={item.expandida ?? ""}
                onChange={(v) => onAlterar({ expandida: v || null })}
                placeholder="Sem versão expandida"
                className="leading-relaxed text-cinza-quente"
              />
            </dd>
          </dl>

          <div className="mt-14 border-t border-fio pt-6">
            <p className="text-rotulo text-cinza-quente">Reescrever com a IA</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ACOES.map((acao) => (
                <button
                  key={acao}
                  type="button"
                  aria-disabled
                  onClick={() => setAvisoIa(true)}
                  className="rounded-[3px] border border-fio px-3 py-1.5 text-sm text-cinza-quente hover:border-cinza-quente"
                >
                  {acao}
                </button>
              ))}
            </div>
            <p className="mt-3 min-h-[1.4em] text-sm text-cinza-quente" aria-live="polite">
              {avisoIa && "Em breve: as reescritas chegam junto com a IA. Por enquanto, edite direto no texto."}
            </p>
          </div>
        </>
      ) : (
        <dl className="mt-10 grid gap-x-8 gap-y-2 sm:grid-cols-[8rem_1fr] sm:gap-y-8">
          <Bloco rotulo="Por que perguntar">
            <Campo
              rotulo="por que perguntar"
              valor={item.bullets[0] ?? ""}
              onChange={(v) => bullet(0, v)}
              placeholder="O que essa pergunta revela"
              className="text-cinza-quente"
            />
          </Bloco>
          <dd className="text-sm text-cinza-quente sm:col-start-2">
            Pergunta para você fazer ao entrevistador. Não há resposta para decorar.
          </dd>
        </dl>
      )}
    </article>
  );
}

function Bloco({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">{rotulo}</dt>
      <dd>{children}</dd>
    </>
  );
}
