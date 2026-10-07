import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

type Etapa = Database["public"]["Enums"]["etapa_ia"];

// Preço por milhão de tokens, em dólares (tabela da Anthropic, 2026-09).
// Escrita em cache custa 1,25x a entrada; leitura em cache, 0,1x.
const PRECO: Record<string, { entrada: number; saida: number }> = {
  "claude-sonnet-5-5": { entrada: 2, saida: 10 },
  "claude-haiku-4-5": { entrada: 1, saida: 5 },
};

type Uso = Pick<
  Anthropic.Usage,
  "input_tokens" | "output_tokens" | "cache_read_input_tokens" | "cache_creation_input_tokens"
>;

export function custoEmDolares(modelo: string, uso: Uso) {
  const preco = PRECO[modelo];
  if (!preco) return 0;
  const leitura = uso.cache_read_input_tokens ?? 0;
  const escrita = uso.cache_creation_input_tokens ?? 0;
  return (
    (uso.input_tokens * preco.entrada +
      escrita * preco.entrada * 1.25 +
      leitura * preco.entrada * 0.1 +
      uso.output_tokens * preco.saida) /
    1_000_000
  );
}

// Custo por kit desde o dia 1 (PRD). Só grava com usuário: antes do login a
// extração não tem dono, e a linha de ai_usage exige user_id.
export async function registrarUso(etapa: Etapa, modelo: string, uso: Uso, userId: string | null, kitId?: string) {
  if (!userId) return;
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage").insert({
      user_id: userId,
      kit_id: kitId ?? null,
      etapa,
      modelo,
      tokens_entrada: uso.input_tokens,
      tokens_saida: uso.output_tokens,
      tokens_cache_leitura: uso.cache_read_input_tokens ?? 0,
      tokens_cache_escrita: uso.cache_creation_input_tokens ?? 0,
      custo: custoEmDolares(modelo, uso),
    });
  } catch {
    // Sem chave secreta ou falha ao gravar: o custo não pode derrubar a resposta.
    console.warn(`[ai_usage] não registrado: ${etapa}`);
  }
}
