"use client";

import { useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import { BotaoPrimario } from "./comum";

// Texto literal da tabela do PRD (Módulo 3 — Seletor de entrevista).
const TIPOS: {
  id: TipoEntrevista;
  nome: string;
  descobrir: string;
  perguntas: string[];
  tom: string;
}[] = [
  {
    id: "rh",
    nome: "RH",
    descobrir: "motivação, fit cultural, trajetória, expectativas",
    perguntas: ["Fale sobre você", "Por que sair da empresa atual?", "Qual sua pretensão?"],
    tom: "humano, positivo, sem jargão técnico",
  },
  {
    id: "tecnica",
    nome: "Técnica",
    descobrir: "domínio, raciocínio, profundidade",
    perguntas: ["Explique uma arquitetura que você desenhou", "Como resolveu um incidente crítico?"],
    tom: "preciso, com termos corretos e trade-offs",
  },
  {
    id: "lideranca",
    nome: "Liderança",
    descobrir: "impacto, decisão, conflito, visão de negócio",
    perguntas: ["Conte uma decisão difícil", "Como lida com prioridades em conflito?"],
    tom: "resultado de negócio, pessoas, aprendizado",
  },
];

export function PassoTipo({ onComecar }: { onComecar: (tipo: TipoEntrevista) => void }) {
  const [tipo, setTipo] = useState<TipoEntrevista>("tecnica");

  return (
    <section aria-labelledby="titulo-tipo">
      <h1 id="titulo-tipo" className="max-w-[20ch] font-display text-display-lg font-medium text-balance">
        Qual entrevista vem aí?
      </h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Cada tipo muda as perguntas, o tom e os cases em destaque. Dá para criar os três para a mesma vaga depois,
        sem enviar nada de novo.
      </p>

      <div role="radiogroup" aria-labelledby="titulo-tipo" className="mt-12 border-t border-fio">
        {TIPOS.map((t, i) => {
          const escolhido = t.id === tipo;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={escolhido}
              onClick={() => setTipo(t.id)}
              className="group relative block w-full border-b border-fio py-6 text-left"
            >
              {escolhido && <span aria-hidden className="absolute inset-y-6 -left-4 w-0.5 bg-fenix sm:-left-6" />}
              <span className="flex items-baseline gap-5">
                <span className="text-rotulo tabular-nums text-cinza-quente">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={`font-display text-3xl font-medium transition-colors duration-200 sm:text-4xl ${
                    escolhido ? "text-osso" : "text-cinza-quente group-hover:text-osso"
                  }`}
                >
                  {t.nome}
                </span>
                <span className="ml-auto hidden max-w-[22ch] text-right text-sm text-cinza-quente sm:block">
                  {t.descobrir}
                </span>
              </span>

              <span
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-brasa ${
                  escolhido ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <span className="overflow-hidden">
                  <span className="mt-6 grid gap-6 pl-10 sm:grid-cols-3 sm:gap-8">
                    <Detalhe titulo="O que querem descobrir">{t.descobrir}</Detalhe>
                    <Detalhe titulo="Perguntas típicas">
                      {t.perguntas.map((p) => (
                        <span key={p} className="block">
                          “{p}”
                        </span>
                      ))}
                    </Detalhe>
                    <Detalhe titulo="Tom das respostas">{t.tom}</Detalhe>
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-12">
        <BotaoPrimario onClick={() => onComecar(tipo)}>Começar a conversa</BotaoPrimario>
      </div>
    </section>
  );
}

function Detalhe({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <span className="block">
      <span className="block text-rotulo text-cinza-quente">{titulo}</span>
      <span className="mt-2 block text-sm leading-relaxed">{children}</span>
    </span>
  );
}
