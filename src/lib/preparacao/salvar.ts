import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoEntrevista } from "@/lib/domain";
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

const EXTENSAO: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// O exemplo rotulado nunca vai para a conta.
export function podeSalvar(curriculo: EntradaCurriculo | null, vaga: EntradaVaga | null) {
  return curriculo !== null && curriculo.tipo !== "exemplo" && vaga !== null && !vaga.exemplo;
}

export async function salvarEntradas(
  supabase: Cliente,
  curriculo: Exclude<EntradaCurriculo, { tipo: "exemplo" }>,
  vaga: EntradaVaga,
): Promise<Salvo> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão");

  // Arquivo no bucket privado, numa pasta com o id da pessoa (exigido pelo RLS).
  // Ele é apagado depois da extração, quando a IA estiver ligada.
  let arquivoPath: string | null = null;
  if (curriculo.tipo === "arquivo") {
    const extensao = EXTENSAO[curriculo.arquivo.type] ?? "bin";
    arquivoPath = `${user.id}/${crypto.randomUUID()}.${extensao}`;
    const { error } = await supabase.storage
      .from("curriculos")
      .upload(arquivoPath, curriculo.arquivo, { contentType: curriculo.arquivo.type });
    if (error) throw error;
  }

  const [consentimento, resume, job] = await Promise.all([
    supabase.from("profiles").update({ consentimento_lgpd_em: new Date().toISOString() }).eq("id", user.id),
    supabase
      .from("resumes")
      .insert({ arquivo_path: arquivoPath, texto: curriculo.tipo === "texto" ? curriculo.texto : null })
      .select("id")
      .single(),
    supabase
      .from("jobs")
      .insert({ texto: vaga.texto, empresa: vaga.empresa.trim() || null, cargo: vaga.cargo.trim() || null })
      .select("id")
      .single(),
  ]);

  const erro = consentimento.error ?? resume.error ?? job.error;
  if (erro || !resume.data || !job.data) throw erro ?? new Error("Falha ao salvar");

  return { resumeId: resume.data.id, jobId: job.data.id, dataEntrevista: vaga.data || null };
}

export async function criarKit(supabase: Cliente, salvo: Salvo, tipo: TipoEntrevista) {
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
  return data.id;
}
