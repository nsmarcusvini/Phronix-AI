"use client";

import { useEffect, useRef, useState } from "react";

const TIQUE_MS = 250;

// Carregamento explícito enquanto a IA trabalha: barra de progresso, segundos
// decorridos, etapas legíveis (a atual com indicador girando) e um aviso se
// passar muito do normal. Sem onFim, espera a resposta real: a barra avança
// devagar sem chegar ao fim e a última etapa fica ativa até o pai trocar de
// fase. Com onFim (caminhos de exemplo), tudo completa em `duracao`.
// `duracao` é quanto a etapa costuma levar, em ms.
export function Processando({
  etapas,
  onFim,
  duracao = 1800,
}: {
  etapas: string[];
  onFim?: () => void;
  duracao?: number;
}) {
  const [decorrido, setDecorrido] = useState(0);
  const fim = useRef(onFim);
  // Decidido na montagem: o modo não muda enquanto o carregamento está na tela.
  const [esperaResposta] = useState(!onFim);

  useEffect(() => {
    fim.current = onFim;
  });

  useEffect(() => {
    const inicio = Date.now();
    const relogio = setInterval(() => setDecorrido(Date.now() - inicio), TIQUE_MS);
    const encerrar = fim.current ? setTimeout(() => fim.current?.(), duracao + 250) : undefined;
    return () => {
      clearInterval(relogio);
      clearTimeout(encerrar);
    };
  }, [duracao]);

  const passo = duracao / etapas.length;
  // Esperando a resposta, a última etapa nunca é dada como feita.
  const feitas = Math.min(esperaResposta ? etapas.length - 1 : etapas.length, Math.floor(decorrido / passo));
  // Esperando a resposta: sobe rápido no começo e se aproxima de 92% sem chegar.
  const progresso = esperaResposta
    ? 92 * (1 - Math.exp(-decorrido / (duracao / 2)))
    : Math.min(100, (decorrido / duracao) * 100);
  const segundos = Math.floor(decorrido / 1000);
  const demorando = esperaResposta && decorrido > duracao * 1.8;

  return (
    <div className="max-w-xl">
      <div
        role="progressbar"
        aria-label="Progresso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progresso)}
        className="relative h-1.5 overflow-hidden rounded-full bg-fio"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-osso transition-[width] duration-300 ease-trilha"
          style={{ width: `${progresso}%` }}
        />
        {/* Brilho que corre pela barra: mostra que está vivo mesmo quando ela quase para. */}
        <span
          aria-hidden
          className="absolute inset-y-0 w-1/4 animate-correr bg-gradient-to-r from-transparent via-osso/50 to-transparent motion-reduce:hidden"
        />
      </div>
      <p className="mt-3 flex justify-between gap-4 text-sm text-cinza-quente">
        <span>Costuma levar uns {Math.round(duracao / 1000)} segundos.</span>
        <span className="tabular-nums" aria-hidden>
          {segundos} s
        </span>
      </p>

      <ol className="mt-8 space-y-4" aria-live="polite">
        {etapas.map((etapa, i) => {
          const feita = i < feitas;
          const atual = i === feitas;
          return (
            <li
              key={etapa}
              aria-current={atual ? "step" : undefined}
              className={`flex items-center gap-3 transition-colors duration-300 ${
                feita ? "text-cinza-quente" : atual ? "text-osso" : "text-cinza-quente/50"
              }`}
            >
              <MarcaEtapa estado={feita ? "feita" : atual ? "atual" : "pendente"} />
              {etapa}
              {feita && <span className="sr-only"> (feito)</span>}
              {atual && <span className="sr-only"> (em andamento)</span>}
            </li>
          );
        })}
      </ol>

      <p role="status" className="mt-8 min-h-[3em] text-sm text-ambar">
        {demorando &&
          "Está levando mais que o normal: a IA está com muita procura agora. Seguimos tentando, não precisa recarregar a página."}
      </p>
    </div>
  );
}

function MarcaEtapa({ estado }: { estado: "feita" | "atual" | "pendente" }) {
  if (estado === "feita") {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-menta">
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (estado === "atual") {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 animate-spin motion-reduce:animate-none">
        <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2" className="stroke-fio" />
        <path d="M8 2a6 6 0 0 1 6 6" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-fenix" />
      </svg>
    );
  }
  return <span aria-hidden className="mx-[5px] size-1.5 shrink-0 rounded-full border border-cinza-quente/50" />;
}

export function BotaoPrimario({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-[transform,opacity] duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

export function BotaoSecundario({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[3px] border border-fio px-5 py-3 text-osso transition-colors duration-150 hover:border-cinza-quente"
    >
      {children}
    </button>
  );
}
