import "server-only";
import type { GenerateContentResponseUsageMetadata } from "@google/genai";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

type Etapa = Database["public"]["Enums"]["etapa_ia"];

// Preço por milhão de tokens, em dólares (tabela do Gemini, 2026-10). A saída
// inclui os tokens de raciocínio. O 3.8 Flash dobra de preço em 2027-01-01.
const PRECO: Record<string, { entrada: number; saida: number; cache: number }> = {
  "gemini-3.8-flash": { entrada: 0.75, saida: 3.75, cache: 0.075 },
  "gemini-3.5-flash-lite": { entrada: 0.3, saida: 2.5, cache: 0.03 },
};

export type Uso = { entrada: number; saida: number; cacheLeitura: number };

// O Gemini conta o cache dentro do prompt; aqui ele sai da entrada cheia.
export function usoDe(meta: GenerateContentResponseUsageMetadata | undefined): Uso {
  const cache = meta?.cachedContentTokenCount ?? 0;
  return {
    entrada: Math.max(0, (meta?.promptTokenCount ?? 0) - cache),
    saida: (meta?.candidatesTokenCount ?? 0) + (meta?.thoughtsTokenCount ?? 0),
    cacheLeitura: cache,
  };
}

export function somarUso(a: Uso, b: Uso): Uso {
  return { entrada: a.entrada + b.entrada, saida: a.saida + b.saida, cacheLeitura: a.cacheLeitura + b.cacheLeitura };
}

export function custoEmDolares(modelo: string, uso: Uso) {
  const preco = PRECO[modelo];
  if (!preco) return 0;
  return (uso.entrada * preco.entrada + uso.cacheLeitura * preco.cache + uso.saida * preco.saida) / 1_000_000;
}

// Custo por kit desde o dia 1 (PRD). Só grava com usuário: a linha de
// ai_usage exige user_id.
export async function registrarUso(etapa: Etapa, modelo: string, uso: Uso, userId: string | null, kitId?: string) {
  if (!userId) return;
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage").insert({
      user_id: userId,
      kit_id: kitId ?? null,
      etapa,
      modelo,
      tokens_entrada: uso.entrada,
      tokens_saida: uso.saida,
      tokens_cache_leitura: uso.cacheLeitura,
      tokens_cache_escrita: 0,
      custo: custoEmDolares(modelo, uso),
    });
  } catch {
    // Sem chave secreta ou falha ao gravar: o custo não pode derrubar a resposta.
    console.warn(`[ai_usage] não registrado: ${etapa}`);
  }
}
