"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import {
  criarKit,
  podeSalvar,
  salvarEntradas,
  type EntradaCurriculo,
  type EntradaVaga,
  type Salvo,
} from "@/lib/preparacao/salvar";
import { createClient } from "@/lib/supabase/client";
import { PassoCurriculo } from "./passo-curriculo";
import { PassoDiagnostico } from "./passo-diagnostico";
import { PassoTipo } from "./passo-tipo";
import { PassoVaga } from "./passo-vaga";

const PASSOS = ["Currículo", "Vaga", "Diagnóstico", "Entrevista"];

type Gravacao = { estado: "parado" | "salvando" | "salvo" | "exemplo" | "erro"; salvo?: Salvo };

// Nova preparação em 4 passos. O login só aparece no diagnóstico:
// o primeiro valor vem antes da conta. Depois do login, currículo e vaga
// vão para a conta; o kit nasce quando o tipo de entrevista é escolhido.
export function Wizard() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [curriculo, setCurriculo] = useState<EntradaCurriculo | null>(null);
  const [vaga, setVaga] = useState<EntradaVaga | null>(null);
  const [logado, setLogado] = useState(false);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: "parado" });
  const [criandoKit, setCriandoKit] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setLogado(data.session !== null))
      .catch(() => setLogado(false));
  }, []);

  function avancar() {
    const proximo = Math.min(PASSOS.length - 1, passo + 1);
    setPasso(proximo);
    window.scrollTo({ top: 0 });
    // Chegou no diagnóstico já com sessão: salva sem pedir login.
    if (proximo === 2 && logado && gravacao.estado === "parado") void salvar();
  }

  async function salvar() {
    if (!podeSalvar(curriculo, vaga) || curriculo?.tipo === "exemplo" || !curriculo || !vaga) {
      setGravacao({ estado: "exemplo" });
      return;
    }
    setGravacao({ estado: "salvando" });
    try {
      const salvo = await salvarEntradas(createClient(), curriculo, vaga);
      setGravacao({ estado: "salvo", salvo });
    } catch {
      setGravacao({ estado: "erro" });
    }
  }

  async function comecarConversa(tipo: TipoEntrevista) {
    if (gravacao.estado !== "salvo" || !gravacao.salvo) {
      router.push(`/kits/demo/conversa?tipo=${tipo}`);
      return;
    }
    setCriandoKit(true);
    try {
      const kitId = await criarKit(createClient(), gravacao.salvo, tipo);
      router.push(`/kits/${kitId}/conversa?tipo=${tipo}`);
    } catch {
      setCriandoKit(false);
      setGravacao({ ...gravacao, estado: "erro" });
    }
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
          <StatusGravacao gravacao={gravacao} onTentar={salvar} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <Passos atual={passo} onVoltar={(i) => setPasso(i)} />

        <div className="mt-14 max-w-3xl">
          {passo === 0 && <PassoCurriculo onEntrada={setCurriculo} onContinuar={avancar} />}
          {passo === 1 && <PassoVaga onEntrada={setVaga} onContinuar={avancar} />}
          {passo === 2 && (
            <PassoDiagnostico
              logado={logado}
              onEntrou={() => {
                setLogado(true);
                void salvar();
              }}
              onContinuar={avancar}
            />
          )}
          {passo === 3 && <PassoTipo onComecar={comecarConversa} ocupado={criandoKit} />}
        </div>
      </main>
    </>
  );
}

function StatusGravacao({ gravacao, onTentar }: { gravacao: Gravacao; onTentar: () => void }) {
  const texto = {
    parado: null,
    salvando: "Salvando na sua conta…",
    salvo: "Salvo na sua conta",
    exemplo: "Exemplo: não é salvo",
    erro: null,
  }[gravacao.estado];

  return (
    <p role="status" className="ml-auto text-rotulo text-cinza-quente">
      {texto}
      {gravacao.estado === "erro" && (
        <span className="text-ambar">
          Não deu para salvar.{" "}
          <button type="button" onClick={onTentar} className="text-osso underline underline-offset-4">
            Tentar de novo
          </button>
        </span>
      )}
    </p>
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
