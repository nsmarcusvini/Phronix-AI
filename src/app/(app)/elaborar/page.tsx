import { redirect } from "next/navigation";
import { z } from "zod";
import { diagnostico as esquemaDiagnostico } from "@/lib/ai/esquemas";
import type { TipoEntrevista } from "@/lib/domain";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { curriculoAtual } from "@/lib/preparacao/curriculo";
import { createClient } from "@/lib/supabase/server";
import { Elaborar, type VagaExistente } from "./_components/elaborar";

export const metadata = { title: "Elaborar entrevista" };

const tipo = z.enum(["rh", "tecnica", "lideranca"]);

// Elaborar entrevista: (currículo, se ainda não houver) → vaga → diagnóstico →
// escolher a entrevista → conversa dos casos → mapa. Com ?vaga=<id>, a vaga já
// existe e só falta escolher outra entrevista para ela.
export default async function Page({ searchParams }: PageProps<"/elaborar">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/elaborar");

  const curriculo = await curriculoAtual(supabase);
  const params = await searchParams;
  const vagaId = z.uuid().safeParse(params.vaga);
  const tipoPedido = tipo.safeParse(params.tipo);

  let existente: VagaExistente | null = null;
  if (vagaId.success) {
    const { data } = await supabase
      .from("jobs")
      .select(
        "id, cargo, empresa, kits ( tipo, resume_id, data_entrevista, diagnostico_json, nivel, nivel_ajustado, created_at )",
      )
      .eq("id", vagaId.data)
      .maybeSingle();
    if (!data) redirect("/painel");

    // O diagnóstico, o currículo e a data vêm da entrevista mais recente da mesma vaga.
    const kits = [...(data.kits ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const base = kits[0];
    const resumeId = base?.resume_id ?? curriculo?.id;
    if (!resumeId) redirect("/elaborar");
    const diag = esquemaDiagnostico.safeParse(base?.diagnostico_json);
    existente = {
      jobId: data.id,
      cargo: data.cargo,
      empresa: data.empresa,
      resumeId,
      dataEntrevista: base?.data_entrevista ?? null,
      tipos: kits.map((k) => k.tipo as TipoEntrevista),
      diagnostico:
        diag.success && base?.nivel
          ? { diagnostico: diag.data, nivel: base.nivel, ajustado: base.nivel_ajustado }
          : null,
    };
  }

  return (
    <>
      <CabecalhoApp />
      <Elaborar
        curriculoInicial={curriculo}
        existente={existente}
        tipoInicial={tipoPedido.success ? tipoPedido.data : undefined}
      />
    </>
  );
}
