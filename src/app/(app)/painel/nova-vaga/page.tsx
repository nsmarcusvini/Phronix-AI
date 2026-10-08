import { redirect } from "next/navigation";
import { z } from "zod";
import { diagnostico as esquemaDiagnostico } from "@/lib/ai/esquemas";
import type { TipoEntrevista } from "@/lib/domain";
import { curriculoAtual } from "@/lib/preparacao/curriculo";
import { createClient } from "@/lib/supabase/server";
import { NovaVaga, type VagaExistente } from "./_components/nova-vaga";

export const metadata = { title: "Nova vaga" };

const tipo = z.enum(["rh", "tecnica", "lideranca"]);

// Cadastro de vaga dentro da plataforma: vaga → diagnóstico → o que preparar.
// Com ?vaga=<id>, a vaga já existe e só falta escolher outro kit para ela.
export default async function Page({ searchParams }: PageProps<"/painel/nova-vaga">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel/nova-vaga");

  const curriculo = await curriculoAtual(supabase);
  if (!curriculo) redirect("/comecar");

  const params = await searchParams;
  const vagaId = z.uuid().safeParse(params.vaga);
  const tipoPedido = tipo.safeParse(params.tipo);

  let existente: VagaExistente | null = null;
  if (vagaId.success) {
    const { data } = await supabase
      .from("jobs")
      .select("id, cargo, empresa, kits ( tipo, resume_id, data_entrevista, diagnostico_json, nivel, nivel_ajustado, created_at )")
      .eq("id", vagaId.data)
      .maybeSingle();
    if (!data) redirect("/painel");

    // O diagnóstico e a data vêm do kit mais recente da mesma vaga.
    const kits = [...(data.kits ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const base = kits[0];
    const diag = esquemaDiagnostico.safeParse(base?.diagnostico_json);
    existente = {
      jobId: data.id,
      cargo: data.cargo,
      empresa: data.empresa,
      resumeId: base?.resume_id ?? curriculo.id,
      dataEntrevista: base?.data_entrevista ?? null,
      tipos: kits.map((k) => k.tipo as TipoEntrevista),
      diagnostico:
        diag.success && base?.nivel
          ? { diagnostico: diag.data, nivel: base.nivel, ajustado: base.nivel_ajustado }
          : null,
    };
  }

  return (
    <NovaVaga
      curriculo={curriculo}
      existente={existente}
      tipoInicial={tipoPedido.success ? tipoPedido.data : undefined}
    />
  );
}
