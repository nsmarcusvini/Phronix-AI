"use client";

import { useState } from "react";
import type { Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";
import type { Nivel } from "@/lib/domain";
import { NOME_NIVEL } from "@/lib/hora-do-show/categorias";
import { diagnosticoExemplo, vagaExtraida } from "@/lib/demo/preparacao";
import { BotaoPrimario, Processando, RotuloExemplo } from "./comum";
import { PortaoLogin } from "./portao-login";

const NIVEIS: Nivel[] = ["junior", "pleno", "senior"];

function titulo(nivel: Nivel) {
  const nome = NOME_NIVEL[nivel];
  return nome[0].toUpperCase() + nome.slice(1);
}
const POSICAO: Record<Nivel, number> = { junior: 0, pleno: 50, senior: 100 };

type Props = {
  logado: boolean;
  onEntrou: () => void;
  onContinuar: () => void;
  // Diagnóstico real (null enquanto carrega ou no caminho de exemplo).
  diagnostico: Diagnostico | null;
  carregando: boolean;
  erro: string | null;
  exemplo: boolean;
  pedido: VagaExtraida["nivelPedido"];
  onNivel: (nivel: Nivel, ajustado: boolean) => void;
  onTentarDeNovo: () => void;
};

export function PassoDiagnostico({
  logado,
  onEntrou,
  onContinuar,
  diagnostico,
  carregando,
  erro,
  exemplo,
  pedido,
  onNivel,
  onTentarDeNovo,
}: Props) {
  const [semConta, setSemConta] = useState(false);
  const liberado = logado || semConta;
  // Sem conta ou com dados de exemplo, mostra o diagnóstico de demonstração.
  const demonstracao = exemplo || semConta || !logado;
  const d = demonstracao ? diagnosticoExemplo : diagnostico;
  const regua = demonstracao ? vagaExtraida.nivelPedido : pedido;
  const [escolhido, setEscolhido] = useState<Nivel | null>(null);

  if (liberado && !demonstracao && (carregando || erro || !d)) {
    return (
      <section aria-labelledby="titulo-diagnostico-carregando">
        <h1 id="titulo-diagnostico-carregando" className="font-display text-display-lg font-medium">
          {erro ? "O diagnóstico não saiu." : "Comparando você com a vaga"}
        </h1>
        <div className="mt-10">
          {erro ? (
            <div className="space-y-6">
              <p role="alert" className="text-ambar">
                {erro}
              </p>
              <BotaoPrimario onClick={onTentarDeNovo}>Tentar de novo</BotaoPrimario>
            </div>
          ) : (
            <Processando
              etapas={["Lendo escopo, autonomia e impacto", "Comparando com o nível pedido", "Montando a estratégia"]}
              duracao={9000}
            />
          )}
        </div>
      </section>
    );
  }

  const base = d ?? diagnosticoExemplo;
  const nivel = escolhido ?? base.nivel;
  const ajustado = nivel !== base.nivel;

  function escolher(n: Nivel) {
    setEscolhido(n);
    onNivel(n, n !== base.nivel);
  }

  return (
    <section aria-labelledby="titulo-diagnostico" className="relative">
      {!liberado && (
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-4 sm:pt-16">
          <PortaoLogin onEntrou={onEntrou} onSemConta={() => setSemConta(true)} />
        </div>
      )}

      <div
        aria-hidden={!liberado}
        inert={!liberado}
        className={`transition-[filter,opacity] duration-700 ease-brasa ${
          liberado ? "" : "pointer-events-none max-h-[46rem] overflow-hidden opacity-50 blur-md select-none"
        }`}
      >
        <p className="text-rotulo text-cinza-quente">Diagnóstico</p>
        <h1 id="titulo-diagnostico" className="mt-2 font-display text-display-lg font-medium text-balance">
          Você está no nível {NOME_NIVEL[nivel]}.
        </h1>
        <p className="mt-3 text-cinza-quente">
          Confiança {base.confianca}
          {ajustado && <span className="text-osso"> · ajustado por você</span>}
        </p>
        {liberado && demonstracao && (
          <div className="mt-6">
            <RotuloExemplo>Este diagnóstico é do candidato de demonstração.</RotuloExemplo>
          </div>
        )}

        <ReguaSenioridade nivel={nivel} pedido={regua} />

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-cinza-quente">Não concorda? Ajuste:</span>
          <div role="radiogroup" aria-label="Seu nível" className="flex rounded-[3px] border border-fio p-0.5">
            {NIVEIS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nivel === n}
                onClick={() => escolher(n)}
                className={`rounded-[2px] px-3 py-1.5 transition-colors duration-150 ${
                  nivel === n ? "bg-osso text-noite" : "text-cinza-quente hover:text-osso"
                }`}
              >
                {titulo(n)}
              </button>
            ))}
          </div>
        </div>

        <h2 className="mt-14 text-rotulo text-cinza-quente">Por quê</h2>
        <ul className="mt-4 space-y-5">
          {base.justificativa.map((j) => (
            <li key={j.trecho} className="grid gap-1 sm:grid-cols-[1fr_1fr] sm:gap-8">
              <p>{j.texto}</p>
              <p className="text-sm text-cinza-quente">
                <span aria-hidden>“</span>
                {j.trecho}
                <span aria-hidden>”</span>
                <span className="sr-only"> (trecho do currículo)</span>
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-10 border-t border-fio pt-10 sm:grid-cols-[auto_1fr] sm:gap-14">
          <div>
            <p className="text-rotulo text-cinza-quente">Match com a vaga</p>
            <p className="mt-1 font-display text-display-xl font-semibold tabular-nums">
              {base.match}
              <span className="ml-1 align-top text-display-lg text-cinza-quente">/100</span>
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 sm:self-end">
            <Lista titulo="Pontos fortes" itens={base.fortes} />
            <Lista titulo="Lacunas" itens={base.lacunas} suave />
          </div>
        </div>

        <div className="mt-14 border-l border-osso/40 pl-5">
          <p className="text-rotulo text-cinza-quente">Estratégia</p>
          <p className="mt-2 max-w-prose text-lg text-pretty">{base.estrategia}</p>
        </div>

        <div className="mt-12">
          <BotaoPrimario onClick={onContinuar}>Escolher a entrevista</BotaoPrimario>
        </div>
      </div>
    </section>
  );
}

// O momento do diagnóstico: o ponto do candidato e a faixa que a vaga pede,
// na mesma régua. A distância entre os dois é a estratégia.
export function ReguaSenioridade({
  nivel,
  pedido = vagaExtraida.nivelPedido,
  className = "mt-12",
}: {
  nivel: Nivel;
  pedido?: VagaExtraida["nivelPedido"];
  className?: string;
}) {
  const { de, ate } = pedido;

  return (
    <div className={`${className} max-w-xl`} aria-label={`Você: ${NOME_NIVEL[nivel]}. A vaga pede ${pedido.texto}.`}>
      <div aria-hidden className="relative h-6">
        <span
          className="absolute -top-1 h-2 border-x border-t border-cinza-quente"
          style={{ left: `${POSICAO[de]}%`, width: `${POSICAO[ate] - POSICAO[de]}%` }}
        />
        <span
          className="absolute -top-6 -translate-x-1/2 text-rotulo whitespace-nowrap text-cinza-quente"
          style={{ left: `${(POSICAO[de] + POSICAO[ate]) / 2}%` }}
        >
          a vaga pede
        </span>
        <span className="absolute inset-x-0 top-3 h-px bg-fio" />
        {NIVEIS.map((n) => (
          <span
            key={n}
            className="absolute top-3 h-2 w-px -translate-y-1/2 bg-fio"
            style={{ left: `${POSICAO[n]}%` }}
          />
        ))}
        <span
          className="absolute inset-x-0 top-3 transition-transform duration-700 ease-trilha"
          style={{ transform: `translateX(${POSICAO[nivel]}%)` }}
        >
          <span className="absolute left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-osso" />
        </span>
      </div>
      <div aria-hidden className="relative mt-2 h-5 text-sm">
        {NIVEIS.map((n, i) => (
          <span
            key={n}
            className={`absolute ${i === 0 ? "" : i === 2 ? "-translate-x-full" : "-translate-x-1/2"} ${
              n === nivel ? "text-osso" : "text-cinza-quente"
            }`}
            style={{ left: `${POSICAO[n]}%` }}
          >
            {titulo(n)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Lista({ titulo, itens, suave = false }: { titulo: string; itens: string[]; suave?: boolean }) {
  return (
    <div>
      <p className="text-rotulo text-cinza-quente">{titulo}</p>
      <ul className="mt-3 space-y-2">
        {itens.map((item) => (
          <li key={item} className={`flex gap-3 ${suave ? "text-cinza-quente" : ""}`}>
            <span aria-hidden className={`mt-[0.6em] size-1.5 shrink-0 rounded-full ${suave ? "border border-cinza-quente" : "bg-osso"}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
