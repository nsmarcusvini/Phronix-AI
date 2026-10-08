import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

// Contexto de um kit para a conversa e o mapa: currículo, vaga e diagnóstico
// já extraídos, lidos com a sessão da pessoa (RLS garante que o kit é dela).

const NOME_TIPO = { rh: "RH", tecnica: "técnica", lideranca: "liderança" } as const;

export type ContextoKit = {
  kitId: string;
  tipo: Database["public"]["Enums"]["tipo_entrevista"];
  nivel: Database["public"]["Enums"]["nivel"] | null;
  acesso: Database["public"]["Enums"]["acesso_kit"];
  status: Database["public"]["Enums"]["status_kit"];
  curriculo: Json | null;
  vaga: Json | null;
  diagnostico: Json | null;
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

  return {
    kitId: data.id,
    tipo: data.tipo,
    nivel: data.nivel,
    acesso: data.acesso,
    status: data.status,
    curriculo,
    vaga,
    diagnostico: data.diagnostico_json,
    requisitos: requisitosDaVaga(vaga),
  };
}

// Requisitos que a conversa tenta cobrir: obrigatórios e diferenciais da vaga.
function requisitosDaVaga(vaga: Json | null): string[] {
  if (!vaga || typeof vaga !== "object" || Array.isArray(vaga)) return [];
  const lista = (chave: string) => {
    const valor = (vaga as Record<string, Json | undefined>)[chave];
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
  };
  return [...new Set([...lista("obrigatorios"), ...lista("diferenciais")])].slice(0, 8);
}

// Blocos de sistema: as instruções (fixas) e o contexto do kit (fixo durante a
// preparação). O cache_control no último bloco faz o prefixo ser reaproveitado
// entre as chamadas da mesma preparação.
export function sistemaComContexto(instrucoes: string, ctx: ContextoKit): Anthropic.TextBlockParam[] {
  const contexto = [
    `Tipo de entrevista: ${NOME_TIPO[ctx.tipo]}.`,
    ctx.nivel ? `Nível do candidato: ${ctx.nivel}.` : "",
    `<curriculo>\n${JSON.stringify(ctx.curriculo)}\n</curriculo>`,
    `<vaga>\n${JSON.stringify(ctx.vaga)}\n</vaga>`,
    `<diagnostico>\n${JSON.stringify(ctx.diagnostico)}\n</diagnostico>`,
    `<requisitos>\n${ctx.requisitos.map((r) => `- ${r}`).join("\n")}\n</requisitos>`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    { type: "text", text: instrucoes },
    { type: "text", text: contexto, cache_control: { type: "ephemeral" } },
  ];
}
