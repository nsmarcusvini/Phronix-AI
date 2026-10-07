"use client";

import { useEffect, useRef, useState } from "react";
import type { Kit } from "@/lib/domain";
import { NOME_NIVEL, NOME_TIPO } from "@/lib/hora-do-show/categorias";
import { MODOS, type Lado, type Modo } from "@/lib/hora-do-show/modo";
import { LinhaDoOlhar } from "./linha-do-olhar";

type Props = {
  kit: Kit;
  total: number;
  demo: boolean;
  modo: Modo;
  modoDetectado: Modo;
  lado: Lado;
  onModo: (modo: Modo) => void;
  onLado: (lado: Lado) => void;
  onEntrar: () => void;
};

// Checklist antes de entrar: kit no aparelho, notificações e tela dividida.
// Nada aqui bloqueia a entrada; é um lembrete.
export function Entrada({
  kit,
  total,
  demo,
  modo,
  modoDetectado,
  lado,
  onModo,
  onLado,
  onEntrar,
}: Props) {
  const [silenciadas, setSilenciadas] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botao.current?.focus();
  }, []);

  const titulo = [NOME_TIPO[kit.tipo], kit.nivel && NOME_NIVEL[kit.nivel]]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="relative mx-auto flex w-full max-w-[40rem] flex-1 flex-col px-6 pb-10">
      <LinhaDoOlhar />

      <header className="pt-6">
        <p className="text-hs-pergunta text-cinza-quente">Hora do Show</p>
        <h1 className="mt-1 text-hs-gancho font-bold">{titulo}</h1>
        {demo && (
          <p className="mt-2 text-hs-sidebar text-cinza-quente">
            Kit de demonstração, com respostas de exemplo.
          </p>
        )}
      </header>

      <ol className="mt-10 space-y-8 text-hs-bullet">
        <li className="flex gap-4">
          <Marca feito />
          <div>
            <p>Kit salvo no aparelho</p>
            <p className="text-hs-sidebar text-cinza-quente">
              {total} respostas. Funciona sem internet.
            </p>
          </div>
        </li>

        <li>
          <label className="flex cursor-pointer gap-4">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={silenciadas}
              onChange={(e) => setSilenciadas(e.target.checked)}
            />
            <Marca feito={silenciadas} focavel />
            <span>
              Notificações silenciadas
              <span className="block text-hs-sidebar text-cinza-quente">
                No sistema e no celular, antes de começar.
              </span>
            </span>
          </label>
        </li>

        <li className="flex gap-4">
          <Marca feito />
          <fieldset className="min-w-0 flex-1">
            <legend>Tela dividida</legend>
            <div className="mt-3 flex flex-wrap gap-2 text-hs-sidebar">
              {MODOS.map((m) => (
                <Opcao
                  key={m.id}
                  nome="modo"
                  marcado={modo === m.id}
                  onEscolher={() => onModo(m.id)}
                >
                  {m.nome}
                  {m.id === modoDetectado && (
                    <span className="text-cinza-quente"> · detectado</span>
                  )}
                </Opcao>
              ))}
            </div>
            {modo === "monitor" && (
              <div className="mt-4">
                <p className="text-hs-sidebar text-cinza-quente">
                  A chamada fica de que lado? A resposta encosta nele.
                </p>
                <div className="mt-2 flex gap-2 text-hs-sidebar">
                  <Opcao nome="lado" marcado={lado === "esquerda"} onEscolher={() => onLado("esquerda")}>
                    À esquerda
                  </Opcao>
                  <Opcao nome="lado" marcado={lado === "direita"} onEscolher={() => onLado("direita")}>
                    À direita
                  </Opcao>
                </div>
              </div>
            )}
          </fieldset>
        </li>
      </ol>

      <p className="mt-12 border-l border-fio pl-4 text-hs-sidebar text-cinza-quente">
        Este é um roteiro pessoal. Respeite as regras do processo: alguns testes técnicos
        proíbem consulta.
      </p>

      <div className="mt-10 flex items-center gap-4">
        <button
          ref={botao}
          type="button"
          onClick={onEntrar}
          className="rounded-[3px] bg-fenix px-7 py-3 text-hs-bullet font-bold text-noite transition-opacity duration-[120ms] hover:opacity-90 focus-visible:outline-osso"
        >
          Entrar
        </button>
        {modo !== "celular" && (
          <span className="text-hs-sidebar text-cinza-quente">ou Enter</span>
        )}
      </div>
    </main>
  );
}

function Marca({ feito, focavel = false }: { feito: boolean; focavel?: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-[3px] border text-sm leading-none ${
        feito ? "border-osso bg-osso text-palco" : "border-cinza-quente"
      } ${focavel ? "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fenix" : ""}`}
    >
      {feito ? "✓" : ""}
    </span>
  );
}

function Opcao({
  nome,
  marcado,
  onEscolher,
  children,
}: {
  nome: string;
  marcado: boolean;
  onEscolher: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`cursor-pointer rounded-[3px] border px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fenix ${
        marcado ? "border-osso text-osso" : "border-fio text-cinza-quente hover:border-cinza-quente"
      }`}
    >
      <input
        type="radio"
        name={nome}
        className="sr-only"
        checked={marcado}
        onChange={onEscolher}
      />
      {children}
    </label>
  );
}
