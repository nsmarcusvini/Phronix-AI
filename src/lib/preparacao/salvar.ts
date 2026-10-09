import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurriculoExtraido, Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";
import type { Nivel, TipoEntrevista } from "@/lib/domain";
import type { Database } from "@/lib/supabase/database.types";

// Grava currículo, vaga e kit. Roda no navegador com a sessão da pessoa: o
// RLS garante que tudo fica na conta dela.

type Cliente = SupabaseClient<Database>;

export type EntradaCurriculo = { tipo: "arquivo"; arquivo: File } | { tipo: "texto"; texto: string };

export type EntradaVaga = {
  texto: string;
  empresa: string;
  cargo: string;
  data: string;
};

async function usuario(supabase: Cliente) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão");
  return user;
}

// O currículo revisado vira a base de todas as entrevistas. O arquivo já
// foi lido pelo servidor na extração (/api/ia/curriculo) e não é guardado:
// ficam só os dados revisados (LGPD: apagar o arquivo após a leitura).
export async function salvarCurriculo(supabase: Cliente, entrada: EntradaCurriculo, dados: CurriculoExtraido) {
  const user = await usuario(supabase);
  const [consentimento, resume] = await Promise.all([
    supabase.from("profiles").update({ consentimento_lgpd_em: new Date().toISOString() }).eq("id", user.id),
    supabase
      .from("resumes")
      .insert({
        arquivo_path: null,
        texto: entrada.tipo === "texto" ? entrada.texto : null,
        dados_json: dados,
      })
      .select("id")
      .single(),
  ]);
  const erro = consentimento.error ?? resume.error;
  if (erro || !resume.data) throw erro ?? new Error("Falha ao salvar o currículo");
  return resume.data.id;
}

export async function salvarVaga(supabase: Cliente, vaga: EntradaVaga, dados: VagaExtraida) {
  await usuario(supabase);
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      texto: vaga.texto,
      empresa: vaga.empresa.trim() || null,
      cargo: vaga.cargo.trim() || dados.cargo || null,
      dados_json: dados,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao salvar a vaga");
  return data.id;
}

export type BaseDoKit = { resumeId: string; jobId: string; dataEntrevista: string | null };
export type DiagnosticoDoKit = { diagnostico: Diagnostico; nivel: Nivel; ajustado: boolean };

// O insert só aceita as colunas liberadas pelo schema; o diagnóstico entra num
// update logo em seguida (também liberado para o dono).
export async function criarKit(supabase: Cliente, base: BaseDoKit, tipo: TipoEntrevista, diag: DiagnosticoDoKit | null) {
  const { data, error } = await supabase
    .from("kits")
    .insert({
      resume_id: base.resumeId,
      job_id: base.jobId,
      tipo,
      data_entrevista: base.dataEntrevista,
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
