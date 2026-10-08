import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { curriculoExtraido, type CurriculoExtraido } from "@/lib/ai/esquemas";
import type { Database } from "@/lib/supabase/database.types";

export type CurriculoAtual = { id: string; dados: CurriculoExtraido; criadoEm: string };

// O currículo mais recente da pessoa é a base de toda vaga nova. Sem ele, o
// painel manda para o onboarding.
export async function curriculoAtual(supabase: SupabaseClient<Database>): Promise<CurriculoAtual | null> {
  const { data } = await supabase
    .from("resumes")
    .select("id, dados_json, created_at")
    .not("dados_json", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const dados = curriculoExtraido.safeParse(data?.dados_json);
  if (!data || !dados.success) return null;
  return { id: data.id, dados: dados.data, criadoEm: data.created_at };
}
