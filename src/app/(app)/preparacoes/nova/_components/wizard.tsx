"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CurriculoExtraido, Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";
import { vagaExtraida as vagaExemplo } from "@/lib/demo/preparacao";
import type { Nivel, TipoEntrevista } from "@/lib/domain";
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
type EstadoDiagnostico = { dados: Diagnostico | null; carregando: boolean; erro: string | null };

// O que cada passo produziu. Fica em ref para ler o valor mais recente no
// mesmo clique em que o passo grava e avança.
type Producao = {
  curriculo: EntradaCurriculo | null;
  vaga: EntradaVaga | null;
  cv: { dados: CurriculoExtraido; exemplo: boolean } | null;
  vagaLida: { dados: VagaExtraida; exemplo: boolean } | null;
};

// Nova preparação em 4 passos. O login só aparece no diagnóstico: o primeiro
// valor vem antes da conta. Depois do login, currículo e vaga vão para a conta
// e o diagnóstico é pedido à IA; o kit nasce quando o tipo é escolhido.
export function Wizard() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const producao = useRef<Producao>({ curriculo: null, vaga: null, cv: null, vagaLida: null });
  const [pedido, setPedido] = useState(vagaExemplo.nivelPedido);
  const [logado, setLogado] = useState(false);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: "parado" });
  const [diagnostico, setDiagnostico] = useState<EstadoDiagnostico>({ dados: null, carregando: false, erro: null });
  const [nivelEscolhido, setNivelEscolhido] = useState<{ nivel: Nivel; ajustado: boolean } | null>(null);
  const [criandoKit, setCriandoKit] = useState(false);
  // Algum passo usou o exemplo rotulado: o diagnóstico também é de exemplo.
  const [comExemplo, setComExemplo] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setLogado(data.session !== null))
      .catch(() => setLogado(false));
  }, []);

  const usandoExemplo = () => Boolean(producao.current.cv?.exemplo || producao.current.vagaLida?.exemplo);

  function avancar() {
    const proximo = Math.min(PASSOS.length - 1, passo + 1);
    setPasso(proximo);
    window.scrollTo({ top: 0 });
    // Chegou no diagnóstico já com sessão: salva e diagnostica sem pedir login.
    if (proximo === 2 && logado) depoisDoLogin();
  }

  function depoisDoLogin() {
    if (gravacao.estado === "parado") void salvar();
    if (!diagnostico.dados && !diagnostico.carregando) void diagnosticar();
  }

  async function salvar() {
    const { curriculo, vaga, cv, vagaLida } = producao.current;
    if (!podeSalvar(curriculo, vaga) || !curriculo || curriculo.tipo === "exemplo" || !vaga) {
      setGravacao({ estado: "exemplo" });
      return;
    }
    setGravacao({ estado: "salvando" });
    try {
      const salvo = await salvarEntradas(createClient(), curriculo, vaga, {
        curriculo: cv?.dados ?? null,
        vaga: vagaLida?.dados ?? null,
      });
      setGravacao({ estado: "salvo", salvo });
    } catch {
      setGravacao({ estado: "erro" });
    }
  }

  async function diagnosticar() {
    const { cv, vagaLida } = producao.current;
    if (!cv || !vagaLida || usandoExemplo()) return;
    setDiagnostico({ dados: null, carregando: true, erro: null });
    const resposta = await fetch("/api/ia/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculo: cv.dados, vaga: vagaLida.dados }),
    }).catch(() => null);
    const corpo = await resposta?.json().catch(() => null);
    if (!resposta?.ok || !corpo?.diagnostico) {
      setDiagnostico({ dados: null, carregando: false, erro: corpo?.erro ?? "Não deu para gerar o diagnóstico agora." });
      return;
    }
    setDiagnostico({ dados: corpo.diagnostico as Diagnostico, carregando: false, erro: null });
  }

  async function comecarConversa(tipo: TipoEntrevista) {
    if (gravacao.estado !== "salvo" || !gravacao.salvo) {
      router.push(`/kits/demo/conversa?tipo=${tipo}`);
      return;
    }
    setCriandoKit(true);
    try {
      const diag = diagnostico.dados
        ? {
            diagnostico: diagnostico.dados,
            nivel: nivelEscolhido?.nivel ?? diagnostico.dados.nivel,
            ajustado: nivelEscolhido?.ajustado ?? false,
          }
        : null;
      const kitId = await criarKit(createClient(), gravacao.salvo, tipo, diag);
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
          {passo === 0 && (
            <PassoCurriculo
              onEntrada={(e) => (producao.current.curriculo = e)}
              onConfirmado={(dados, exemplo) => {
                producao.current.cv = { dados, exemplo };
                setComExemplo(exemplo);
              }}
              onContinuar={avancar}
            />
          )}
          {passo === 1 && (
            <PassoVaga
              onEntrada={(e) => (producao.current.vaga = e)}
              onExtraida={(dados, exemplo) => {
                producao.current.vagaLida = { dados, exemplo };
                setPedido(dados.nivelPedido);
                if (exemplo) setComExemplo(true);
              }}
              onContinuar={avancar}
            />
          )}
          {passo === 2 && (
            <PassoDiagnostico
              logado={logado}
              onEntrou={() => {
                setLogado(true);
                depoisDoLogin();
              }}
              onContinuar={avancar}
              diagnostico={diagnostico.dados}
              carregando={diagnostico.carregando}
              erro={diagnostico.erro}
              exemplo={comExemplo}
              pedido={pedido}
              onNivel={(nivel, ajustado) => setNivelEscolhido({ nivel, ajustado })}
              onTentarDeNovo={() => void diagnosticar()}
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
