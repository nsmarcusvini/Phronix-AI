import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Métricas da Prática para o painel, somando todos os kits da pessoa (RLS).
// Vêm das revisões já sincronizadas: o que foi praticado offline entra assim
// que o aparelho sincroniza.

export type MetricasPratica = {
  acertos: number;
  quase: number;
  erros: number;
  // Vezes que praticou: sessões, não respostas soltas (ver INTERVALO_SESSAO).
  sessoes: number;
  ultimaEm: string | null;
  // Datas das revisões dos últimos 60 dias: a sequência de dias é contada no
  // navegador, no fuso da pessoa.
  recentes: { revisado_em: string }[];
};

// Revisões do mesmo kit com menos de 30 minutos entre si são a mesma sessão.
const INTERVALO_SESSAO = 30 * 60_000;
const JANELA_RECENTES = 60 * 86_400_000;

export async function metricasDePratica(supabase: SupabaseClient<Database>): Promise<MetricasPratica> {
  const { data } = await supabase.from("reviews").select("kit_id, nota, revisado_em").order("revisado_em");
  const revisoes = data ?? [];

  let sessoes = 0;
  const ultimaPorKit = new Map<string, number>();
  for (const r of revisoes) {
    const quando = new Date(r.revisado_em).getTime();
    const anterior = ultimaPorKit.get(r.kit_id);
    if (anterior === undefined || quando - anterior > INTERVALO_SESSAO) sessoes++;
    ultimaPorKit.set(r.kit_id, quando);
  }

  const desde = Date.now() - JANELA_RECENTES;
  return {
    acertos: revisoes.filter((r) => r.nota === "acertei").length,
    quase: revisoes.filter((r) => r.nota === "quase").length,
    erros: revisoes.filter((r) => r.nota === "errei").length,
    sessoes,
    ultimaEm: revisoes.at(-1)?.revisado_em ?? null,
    recentes: revisoes
      .filter((r) => new Date(r.revisado_em).getTime() >= desde)
      .map((r) => ({ revisado_em: r.revisado_em })),
  };
}
