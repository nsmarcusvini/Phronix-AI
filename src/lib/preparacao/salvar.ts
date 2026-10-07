import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurriculoExtraido, Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";
import type { Nivel, TipoEntrevista } from "@/lib/domain";
import type { Database } from "@/lib/supabase/database.types";

// Grava a preparação depois do login. Roda no navegador com a sessão da
// pessoa: o RLS garante que tudo fica na conta dela.

type Cliente = SupabaseClient<Database>;

export type EntradaCurriculo =
  | { tipo: "arquivo"; arquivo: File }
  | { tipo: "texto"; texto: string }
  | { tipo: "exemplo" };

export type EntradaVaga = {
  texto: string;
  empresa: string;
  cargo: string;
  data: string;
  exemplo: boolean;
};

export type Salvo = { resumeId: string; jobId: string; dataEntrevista: string | null };

// O exemplo rotulado nunca vai para a conta.
export function podeSalvar(curriculo: EntradaCurriculo | null, vaga: EntradaVaga | null) {
  return curriculo !== null && curriculo.tipo !== "exemplo" && vaga !== null && !vaga.exemplo;
}

export async function salvarEntradas(
  supabase: Cliente,
  curriculo: Exclude<EntradaCurriculo, { tipo: "exemplo" }>,
  vaga: EntradaVaga,
  extraidos: { curriculo: CurriculoExtraido | null; vaga: VagaExtraida | null },
): Promise<Salvo> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão");

  // O arquivo já foi lido pelo servidor na extração (/api/ia/curriculo) e não é
  // guardado: ficam só os dados revisados (LGPD: apagar o arquivo após a leitura).
  const arquivoPath: string | null = null;

  const [consentimento, resume, job] = await Promise.all([
    supabase.from("profiles").update({ consentimento_lgpd_em: new Date().toISOString() }).eq("id", user.id),
    supabase
      .from("resumes")
      .insert({
        arquivo_path: arquivoPath,
        texto: curriculo.tipo === "texto" ? curriculo.texto : null,
        dados_json: extraidos.curriculo,
      })
      .select("id")
      .single(),
    supabase
      .from("jobs")
      .insert({
        texto: vaga.texto,
        empresa: vaga.empresa.trim() || null,
        cargo: vaga.cargo.trim() || extraidos.vaga?.cargo || null,
        dados_json: extraidos.vaga,
      })
      .select("id")
      .single(),
  ]);

  const erro = consentimento.error ?? resume.error ?? job.error;
  if (erro || !resume.data || !job.data) throw erro ?? new Error("Falha ao salvar");

  return { resumeId: resume.data.id, jobId: job.data.id, dataEntrevista: vaga.data || null };
}

export type DiagnosticoDoKit = { diagnostico: Diagnostico; nivel: Nivel; ajustado: boolean };

// O insert só aceita as colunas liberadas pelo schema; o diagnóstico entra num
// update logo em seguida (também liberado para o dono).
export async function criarKit(supabase: Cliente, salvo: Salvo, tipo: TipoEntrevista, diag: DiagnosticoDoKit | null) {
  const { data, error } = await supabase
    .from("kits")
    .insert({
      resume_id: salvo.resumeId,
      job_id: salvo.jobId,
      tipo,
      data_entrevista: salvo.dataEntrevista,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar o kit");

  if (diag) {
    const { error: erroDiag } = await supabase
      .from("kits")
      .update({
        nivel: diag.nivel,
        nivel_ajustado: diag.ajustado,
        nivel_confianca: diag.diagnostico.confianca,
        match_score: diag.diagnostico.match,
        diagnostico_json: diag.diagnostico,
        status: "diagnosticado",
      })
      .eq("id", data.id);
    if (erroDiag) throw erroDiag;
  }
  return data.id;
}
