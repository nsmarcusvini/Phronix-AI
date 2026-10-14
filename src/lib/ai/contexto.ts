import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { softSkill, type SoftSkill } from "@/lib/ai/esquemas";
import type { Database, Json } from "@/lib/supabase/database.types";

// Contexto de um kit para a conversa e o mapa: currículo, vaga e diagnóstico
// já extraídos, lidos com a sessão da pessoa (RLS garante que o kit é dela).

const NOME_TIPO = { rh: "RH", tecnica: "técnica", lideranca: "liderança" } as const;

// Quantos requisitos a conversa tenta cobrir: técnicos primeiro, e algumas
// soft skills para a entrevista ter exemplos de comportamento.
const MAX_TECNICOS = 6;
const MAX_SOFT = 3;

export type ContextoKit = {
  kitId: string;
  tipo: Database["public"]["Enums"]["tipo_entrevista"];
  nivel: Database["public"]["Enums"]["nivel"] | null;
  acesso: Database["public"]["Enums"]["acesso_kit"];
  status: Database["public"]["Enums"]["status_kit"];
  curriculo: Json | null;
  vaga: Json | null;
  diagnostico: Json | null;
  softSkills: SoftSkill[];
  requisitos: string[];
};

export async function carregarContexto(supabase: SupabaseClient<Database>, kitId: string): Promise<ContextoKit | null> {
  const { data, error } = await supabase
    .from("kits")
    .select(
      `id, tipo, nivel, acesso, status, diagnostico_json,
       curriculo:resumes!kits_resume_id_user_id_fkey ( dados_json ),
       vaga:jobs!kits_job_id_user_id_fkey ( dados_json )`,
    )
    .eq("id", kitId)
    .maybeSingle();
  if (error || !data) return null;

  const curriculo = (Array.isArray(data.curriculo) ? data.curriculo[0] : data.curriculo)?.dados_json ?? null;
  const vaga = (Array.isArray(data.vaga) ? data.vaga[0] : data.vaga)?.dados_json ?? null;
  const softSkills = softSkillsDaVaga(vaga);

  return {
    kitId: data.id,
    tipo: data.tipo,
    nivel: data.nivel,
    acesso: data.acesso,
    status: data.status,
    curriculo,
    vaga,
    diagnostico: data.diagnostico_json,
    softSkills,
    requisitos: requisitosDaVaga(vaga, softSkills),
  };
}

function campo(vaga: Json | null, chave: string): Json[] {
  if (!vaga || typeof vaga !== "object" || Array.isArray(vaga)) return [];
  const valor = (vaga as Record<string, Json | undefined>)[chave];
  return Array.isArray(valor) ? valor : [];
}

// Vagas lidas antes das soft skills existirem não têm o campo: lista vazia.
function softSkillsDaVaga(vaga: Json | null): SoftSkill[] {
  return campo(vaga, "softSkills").flatMap((s) => {
    const lida = softSkill.safeParse(s);
    return lida.success && lida.data.nome.trim() ? [lida.data] : [];
  });
}

// Requisitos que a conversa tenta cobrir: obrigatórios e diferenciais da vaga
// e as soft skills mais fortes, pelo nome.
function requisitosDaVaga(vaga: Json | null, softSkills: SoftSkill[]): string[] {
  const textos = (chave: string) => campo(vaga, chave).filter((v): v is string => typeof v === "string");
  const tecnicos = [...new Set([...textos("obrigatorios"), ...textos("diferenciais")])].slice(0, MAX_TECNICOS);
  const soft = softSkills
    .map((s) => s.nome)
    .filter((nome) => !tecnicos.includes(nome))
    .slice(0, MAX_SOFT);
  return [...tecnicos, ...soft];
}

// Instrução de sistema: as instruções (fixas) e depois o contexto do kit (fixo
// durante a preparação). O prefixo igual entre chamadas da mesma preparação
// aproveita o cache implícito do Gemini.
export function sistemaComContexto(instrucoes: string, ctx: ContextoKit): string {
  const contexto = [
    `Tipo de entrevista: ${NOME_TIPO[ctx.tipo]}.`,
    ctx.nivel ? `Nível do candidato: ${ctx.nivel}.` : "",
    `<curriculo>\n${JSON.stringify(ctx.curriculo)}\n</curriculo>`,
    `<vaga>\n${JSON.stringify(ctx.vaga)}\n</vaga>`,
    `<diagnostico>\n${JSON.stringify(ctx.diagnostico)}\n</diagnostico>`,
    `<requisitos>\n${ctx.requisitos.map((r) => `- ${r}`).join("\n")}\n</requisitos>`,
    ctx.softSkills.length
      ? `<soft_skills>\n${ctx.softSkills.map((s) => `- ${s.nome}: "${s.evidencia}"`).join("\n")}\n</soft_skills>`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return `${instrucoes}\n\n${contexto}`;
}
