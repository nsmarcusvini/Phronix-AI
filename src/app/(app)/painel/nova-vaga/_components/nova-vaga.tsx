"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";
import type { Nivel, TipoEntrevista } from "@/lib/domain";
import { PassoDiagnostico } from "@/components/preparacao/passo-diagnostico";
import { PassoTipo } from "@/components/preparacao/passo-tipo";
import { PassoVaga } from "@/components/preparacao/passo-vaga";
import { Passos } from "@/components/preparacao/passos";
import type { CurriculoAtual } from "@/lib/preparacao/curriculo";
import { criarKit, salvarVaga, type DiagnosticoDoKit, type EntradaVaga } from "@/lib/preparacao/salvar";
import { createClient } from "@/lib/supabase/client";

const PASSOS = ["Vaga", "Diagnóstico", "Preparar"];

export type VagaExistente = {
  jobId: string;
  cargo: string | null;
  empresa: string | null;
  resumeId: string;
  dataEntrevista: string | null;
  tipos: TipoEntrevista[];
  diagnostico: DiagnosticoDoKit | null;
};

type EstadoDiagnostico = { dados: Diagnostico | null; carregando: boolean; erro: string | null };

// Vaga nova dentro do painel. O currículo já está na conta: a pessoa cola a
// vaga, vê o diagnóstico e escolhe o que preparar. A vaga é salva assim que
// é lida, para não se perder se a pessoa sair no meio.
export function NovaVaga({
  curriculo,
  existente,
  tipoInicial,
}: {
  curriculo: CurriculoAtual;
  existente: VagaExistente | null;
  tipoInicial?: TipoEntrevista;
}) {
  const router = useRouter();
  const [passo, setPasso] = useState(existente ? 2 : 0);
  const entrada = useRef<EntradaVaga | null>(null);
  const vagaSalva = useRef<Promise<string> | null>(null);
  const [pedido, setPedido] = useState<VagaExtraida["nivelPedido"] | null>(null);
  const [diagnostico, setDiagnostico] = useState<EstadoDiagnostico>({ dados: null, carregando: false, erro: null });
  const lida = useRef<VagaExtraida | null>(null);
  const [nivel, setNivel] = useState<{ nivel: Nivel; ajustado: boolean } | null>(null);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function irPara(i: number) {
    setPasso(i);
    window.scrollTo({ top: 0 });
  }

  function guardarVaga(dados: VagaExtraida) {
    const atual = entrada.current;
    if (!atual) return;
    const promessa = salvarVaga(createClient(), atual, dados);
    // Falhou: a próxima tentativa acontece ao criar o kit.
    promessa.catch(() => {
      if (vagaSalva.current === promessa) vagaSalva.current = null;
    });
    vagaSalva.current = promessa;
  }

  async function diagnosticar() {
    const vaga = lida.current;
    if (!vaga) return;
    setDiagnostico({ dados: null, carregando: true, erro: null });
    const resposta = await fetch("/api/ia/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculo: curriculo.dados, vaga }),
    }).catch(() => null);
    const corpo = await resposta?.json().catch(() => null);
    if (!resposta?.ok || !corpo?.diagnostico) {
      setDiagnostico({
        dados: null,
        carregando: false,
        erro: corpo?.erro ?? "Não deu para gerar o diagnóstico agora.",
      });
      return;
    }
    setDiagnostico({ dados: corpo.diagnostico as Diagnostico, carregando: false, erro: null });
  }

  async function comecar(tipo: TipoEntrevista) {
    setCriando(true);
    setErro(null);
    const supabase = createClient();
    try {
      let jobId = existente?.jobId;
      if (!jobId) {
        if (!vagaSalva.current && lida.current) guardarVaga(lida.current);
        if (!vagaSalva.current) throw new Error("Sem vaga");
        jobId = await vagaSalva.current;
      }
      const diag: DiagnosticoDoKit | null = existente
        ? existente.diagnostico
        : diagnostico.dados
          ? {
              diagnostico: diagnostico.dados,
              nivel: nivel?.nivel ?? diagnostico.dados.nivel,
              ajustado: nivel?.ajustado ?? false,
            }
          : null;
      const kitId = await criarKit(
        supabase,
        {
          resumeId: existente?.resumeId ?? curriculo.id,
          jobId,
          dataEntrevista: existente ? existente.dataEntrevista : entrada.current?.data || null,
        },
        tipo,
        diag,
      );
      router.push(`/kits/${kitId}/conversa?tipo=${tipo}`);
    } catch {
      setErro("Não deu para criar o kit agora. Tente de novo.");
      setCriando(false);
    }
  }

  const titulo = existente
    ? [existente.cargo ?? "Vaga sem cargo", existente.empresa].filter(Boolean).join(" · ")
    : "Nova vaga";

  return (
    <>
      <header className="border-b border-fio">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
          {/* Logo pendente: wordmark provisório. */}
          <Link href="/painel" className="font-display text-lg font-semibold tracking-tight">
            Phronix
          </Link>
          <span className="truncate text-rotulo text-cinza-quente">{titulo}</span>
          <Link href="/painel" className="ml-auto shrink-0 text-sm text-cinza-quente hover:text-osso">
            Voltar ao painel
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        {!existente && <Passos passos={PASSOS} atual={passo} onVoltar={irPara} />}

        <div className={existente ? "max-w-3xl" : "mt-14 max-w-3xl"}>
          {passo === 0 && (
            <PassoVaga
              onEntrada={(e) => (entrada.current = e)}
              onExtraida={(dados) => {
                lida.current = dados;
                setPedido(dados.nivelPedido);
                setNivel(null);
                guardarVaga(dados);
                void diagnosticar();
              }}
              onContinuar={() => irPara(1)}
            />
          )}
          {passo === 1 && pedido && (
            <PassoDiagnostico
              onContinuar={() => irPara(2)}
              diagnostico={diagnostico.dados}
              carregando={diagnostico.carregando}
              erro={diagnostico.erro}
              pedido={pedido}
              onNivel={(n, ajustado) => setNivel({ nivel: n, ajustado })}
              onTentarDeNovo={() => void diagnosticar()}
            />
          )}
          {passo === 2 && (
            <>
              <PassoTipo
                onComecar={comecar}
                ocupado={criando}
                inicial={tipoInicial}
                existentes={existente?.tipos ?? []}
              />
              {erro && (
                <p role="alert" className="mt-4 text-sm text-ambar">
                  {erro}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
