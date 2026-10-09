"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";
import type { Nivel, TipoEntrevista } from "@/lib/domain";
import { PassoCurriculo } from "@/components/preparacao/passo-curriculo";
import { PassoDiagnostico } from "@/components/preparacao/passo-diagnostico";
import { PassoTipo } from "@/components/preparacao/passo-tipo";
import { PassoVaga } from "@/components/preparacao/passo-vaga";
import { Passos } from "@/components/preparacao/passos";
import type { CurriculoAtual } from "@/lib/preparacao/curriculo";
import {
  criarKit,
  salvarCurriculo,
  salvarVaga,
  type DiagnosticoDoKit,
  type EntradaVaga,
} from "@/lib/preparacao/salvar";
import { createClient } from "@/lib/supabase/client";

type Etapa = "curriculo" | "vaga" | "diagnostico" | "entrevista";
const NOME: Record<Etapa, string> = {
  curriculo: "Currículo",
  vaga: "Vaga",
  diagnostico: "Diagnóstico",
  entrevista: "Entrevista",
};

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

// Elaborar entrevista. Sem currículo na conta, ele é o primeiro passo (lido
// aqui, já logado). A vaga é salva assim que é lida, para não se perder se a
// pessoa sair no meio; a entrevista nasce ao escolher o tipo e segue para a
// conversa dos casos. Daí em diante ela aparece no painel.
export function Elaborar({
  curriculoInicial,
  existente,
  tipoInicial,
}: {
  curriculoInicial: CurriculoAtual | null;
  existente: VagaExistente | null;
  tipoInicial?: TipoEntrevista;
}) {
  const router = useRouter();
  const [curriculo, setCurriculo] = useState(curriculoInicial);
  // Os passos ficam fixos desde a abertura: se o currículo foi lido aqui, o
  // passo "Currículo" continua na trilha, já feito.
  const [etapas] = useState<Etapa[]>(() =>
    existente
      ? ["entrevista"]
      : curriculoInicial
        ? ["vaga", "diagnostico", "entrevista"]
        : ["curriculo", "vaga", "diagnostico", "entrevista"],
  );
  const [atual, setAtual] = useState<Etapa>(etapas[0]);
  const entrada = useRef<EntradaVaga | null>(null);
  const vagaSalva = useRef<Promise<string> | null>(null);
  const lida = useRef<VagaExtraida | null>(null);
  const [pedido, setPedido] = useState<VagaExtraida["nivelPedido"] | null>(null);
  const [diagnostico, setDiagnostico] = useState<EstadoDiagnostico>({ dados: null, carregando: false, erro: null });
  const [nivel, setNivel] = useState<{ nivel: Nivel; ajustado: boolean } | null>(null);
  const [salvandoCv, setSalvandoCv] = useState(false);
  const [erroCv, setErroCv] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function irPara(etapa: Etapa) {
    setAtual(etapa);
    window.scrollTo({ top: 0 });
  }

  function guardarVaga(dados: VagaExtraida) {
    const atualEntrada = entrada.current;
    if (!atualEntrada) return;
    const promessa = salvarVaga(createClient(), atualEntrada, dados);
    // Falhou: a próxima tentativa acontece ao criar a entrevista.
    promessa.catch(() => {
      if (vagaSalva.current === promessa) vagaSalva.current = null;
    });
    vagaSalva.current = promessa;
  }

  async function diagnosticar() {
    const vaga = lida.current;
    if (!vaga || !curriculo) return;
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
    try {
      let jobId = existente?.jobId;
      if (!jobId) {
        if (!vagaSalva.current && lida.current) guardarVaga(lida.current);
        if (!vagaSalva.current) throw new Error("Sem vaga");
        jobId = await vagaSalva.current;
      }
      const resumeId = existente?.resumeId ?? curriculo?.id;
      if (!resumeId) throw new Error("Sem currículo");
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
        createClient(),
        { resumeId, jobId, dataEntrevista: existente ? existente.dataEntrevista : entrada.current?.data || null },
        tipo,
        diag,
      );
      router.push(`/kits/${kitId}/conversa?tipo=${tipo}`);
    } catch {
      setErro("Não deu para criar a entrevista agora. Tente de novo.");
      setCriando(false);
    }
  }

  const contexto = existente
    ? `Outra entrevista para ${[existente.cargo ?? "a vaga", existente.empresa].filter(Boolean).join(", na ")}.`
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-12">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-rotulo text-cinza-quente">Elaborar entrevista</p>
        {curriculo && atual !== "curriculo" && !existente && (
          <p className="text-sm text-cinza-quente">
            Usando o currículo de {curriculo.dados.nome.valor || "você"}.{" "}
            <Link href="/curriculo?next=/elaborar" className="text-osso underline-offset-4 hover:underline">
              Trocar currículo
            </Link>
          </p>
        )}
      </div>

      {etapas.length > 1 && (
        <Passos passos={etapas.map((e) => NOME[e])} atual={etapas.indexOf(atual)} onVoltar={(i) => irPara(etapas[i])} />
      )}
      {contexto && <p className="max-w-3xl text-cinza-quente">{contexto}</p>}

      <div className={etapas.length > 1 ? "mt-14 max-w-3xl" : "mt-8 max-w-3xl"}>
        {atual === "curriculo" && (
          <PassoCurriculo
            titulo="Primeiro, seu currículo."
            rotuloConfirmar="Está certo, seguir para a vaga"
            salvando={salvandoCv}
            erroSalvar={erroCv}
            onConfirmado={async (dados, lidaCv) => {
              setSalvandoCv(true);
              setErroCv(null);
              try {
                const id = await salvarCurriculo(createClient(), lidaCv, dados);
                setCurriculo({ id, dados, criadoEm: new Date().toISOString() });
                setSalvandoCv(false);
                irPara("vaga");
              } catch {
                setErroCv("Não deu para salvar o currículo agora. Tente de novo.");
                setSalvandoCv(false);
              }
            }}
          />
        )}
        {atual === "vaga" && (
          <PassoVaga
            onEntrada={(e) => (entrada.current = e)}
            onExtraida={(dados) => {
              lida.current = dados;
              setPedido(dados.nivelPedido);
              setNivel(null);
              guardarVaga(dados);
              void diagnosticar();
            }}
            onContinuar={() => irPara("diagnostico")}
          />
        )}
        {atual === "diagnostico" && pedido && (
          <PassoDiagnostico
            onContinuar={() => irPara("entrevista")}
            diagnostico={diagnostico.dados}
            carregando={diagnostico.carregando}
            erro={diagnostico.erro}
            pedido={pedido}
            onNivel={(n, ajustado) => setNivel({ nivel: n, ajustado })}
            onTentarDeNovo={() => void diagnosticar()}
          />
        )}
        {atual === "entrevista" && (
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
  );
}
