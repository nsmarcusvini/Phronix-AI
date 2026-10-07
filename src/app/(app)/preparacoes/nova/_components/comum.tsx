"use client";

import { useEffect, useRef, useState } from "react";

// Rótulo honesto do exemplo: enquanto a IA não está ligada, os resultados
// vêm do candidato de demonstração, não do que a pessoa enviou.
export function RotuloExemplo({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 border-l border-ambar/60 pl-3 text-sm text-cinza-quente">
      <span className="text-ambar">Exemplo.</span>
      <span>{children}</span>
    </p>
  );
}

// Processamento em etapas legíveis, em vez de um spinner mudo. Sem onFim, as
// etapas avançam e a última fica pulsando até o pai trocar de fase (resposta real).
export function Processando({
  etapas,
  onFim,
  duracao = 1800,
}: {
  etapas: string[];
  onFim?: () => void;
  duracao?: number;
}) {
  const [feitas, setFeitas] = useState(0);
  const fim = useRef(onFim);

  useEffect(() => {
    fim.current = onFim;
  });

  useEffect(() => {
    const passo = duracao / etapas.length;
    // Sem onFim, a última etapa nunca é marcada como feita: espera a resposta.
    const total = fim.current ? etapas.length : etapas.length - 1;
    const ids = Array.from({ length: total }, (_, i) => setTimeout(() => setFeitas(i + 1), passo * (i + 1)));
    const encerrar = fim.current ? setTimeout(() => fim.current?.(), duracao + 250) : undefined;
    return () => {
      ids.forEach(clearTimeout);
      clearTimeout(encerrar);
    };
  }, [duracao, etapas.length]);

  return (
    <ol className="space-y-3" role="status" aria-live="polite">
      {etapas.map((etapa, i) => (
        <li
          key={etapa}
          className={`flex items-center gap-3 transition-colors duration-300 ${
            i < feitas ? "text-osso" : i === feitas ? "text-cinza-quente" : "text-fio"
          }`}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full transition-colors duration-300 ${
              i < feitas ? "bg-osso" : i === feitas ? "animate-pulse bg-cinza-quente" : "border border-fio"
            }`}
          />
          {etapa}
        </li>
      ))}
    </ol>
  );
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

export function BotaoSecundario({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
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
