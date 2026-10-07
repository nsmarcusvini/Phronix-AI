"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import { PassoCurriculo } from "./passo-curriculo";
import { PassoDiagnostico } from "./passo-diagnostico";
import { PassoTipo } from "./passo-tipo";
import { PassoVaga } from "./passo-vaga";

const PASSOS = ["Currículo", "Vaga", "Diagnóstico", "Entrevista"];

// Nova preparação em 4 passos. O login só aparece no diagnóstico:
// o primeiro valor vem antes da conta.
export function Wizard() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);

  function avancar() {
    setPasso((p) => Math.min(PASSOS.length - 1, p + 1));
    window.scrollTo({ top: 0 });
  }

  function comecarConversa(tipo: TipoEntrevista) {
    router.push(`/kits/demo/conversa?tipo=${tipo}`);
  }

  return (
    <>
      <header className="border-b border-fio">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
          {/* Logo pendente: wordmark provisório. */}
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Phronix
          </Link>
          <span className="text-rotulo text-cinza-quente">Nova preparação</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <Passos atual={passo} onVoltar={(i) => setPasso(i)} />

        <div className="mt-14 max-w-3xl">
          {passo === 0 && <PassoCurriculo onContinuar={avancar} />}
          {passo === 1 && <PassoVaga onContinuar={avancar} />}
          {passo === 2 && <PassoDiagnostico onContinuar={avancar} />}
          {passo === 3 && <PassoTipo onComecar={comecarConversa} />}
        </div>
      </main>
    </>
  );
}

// Os passos como trilha: o mesmo fio e os mesmos pontos da Prática.
function Passos({ atual, onVoltar }: { atual: number; onVoltar: (passo: number) => void }) {
  return (
    <nav aria-label="Passos da preparação" className="relative max-w-3xl">
        <span aria-hidden className="absolute top-[5px] left-[12.5%] h-px w-3/4 bg-fio" />
        <span
          aria-hidden
          className="absolute top-[5px] left-[12.5%] h-px w-3/4 origin-left bg-osso transition-transform duration-700 ease-trilha"
          style={{ transform: `scaleX(${atual / (PASSOS.length - 1)})` }}
        />
      <ol className="relative grid grid-cols-4">
        {PASSOS.map((nome, i) => {
          const feito = i < atual;
          const ativo = i === atual;
          return (
            <li key={nome} className="relative flex flex-col items-center">
              <span
                aria-hidden
                className={`relative size-3 rounded-full transition-colors duration-500 ${
                  ativo ? "bg-fenix" : feito ? "bg-osso" : "border border-fio bg-noite"
                }`}
              />
              {feito ? (
                <button
                  type="button"
                  onClick={() => onVoltar(i)}
                  className="mt-3 text-rotulo text-osso underline-offset-4 hover:underline"
                >
                  {nome}
                </button>
              ) : (
                <span
                  aria-current={ativo ? "step" : undefined}
                  className={`mt-3 text-rotulo ${ativo ? "text-osso" : "text-cinza-quente"}`}
                >
                  {nome}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
