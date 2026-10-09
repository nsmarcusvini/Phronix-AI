import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Métricas da Prática para o painel, somando todos os kits da pessoa (RLS).
// Vêm das revisões já sincronizadas: o que foi praticado offline entra assim
// que o aparelho sincroniza.

export type Sessao = {
  kitId: string;
  inicio: string;
  acertos: number;
  quase: number;
  erros: number;
};

export type MetricasPratica = {
  acertos: number;
  quase: number;
  erros: number;
  // Vezes que praticou: sessões, não respostas soltas (ver INTERVALO_SESSAO).
  sessoes: number;
  ultimaEm: string | null;
  // Sessões dos últimos 60 dias, da mais antiga para a mais recente: alimentam
  // a linha do tempo, "como foi" e a sequência de dias (contada no navegador,
  // no fuso da pessoa).
  recentes: Sessao[];
};

// Revisões do mesmo kit com menos de 30 minutos entre si são a mesma sessão.
const INTERVALO_SESSAO = 30 * 60_000;
const JANELA_RECENTES = 60 * 86_400_000;

export async function metricasDePratica(supabase: SupabaseClient<Database>): Promise<MetricasPratica> {
  const { data } = await supabase.from("reviews").select("kit_id, nota, revisado_em").order("revisado_em");
  const revisoes = data ?? [];

  const sessoes: Sessao[] = [];
  const abertaPorKit = new Map<string, { sessao: Sessao; ultima: number }>();
  for (const r of revisoes) {
    const quando = new Date(r.revisado_em).getTime();
    const aberta = abertaPorKit.get(r.kit_id);
    let sessao = aberta?.sessao;
    if (!aberta || quando - aberta.ultima > INTERVALO_SESSAO) {
      sessao = { kitId: r.kit_id, inicio: r.revisado_em, acertos: 0, quase: 0, erros: 0 };
      sessoes.push(sessao);
    }
    if (r.nota === "acertei") sessao!.acertos++;
    else if (r.nota === "quase") sessao!.quase++;
    else sessao!.erros++;
    abertaPorKit.set(r.kit_id, { sessao: sessao!, ultima: quando });
  }

  const desde = Date.now() - JANELA_RECENTES;
  return {
    acertos: revisoes.filter((r) => r.nota === "acertei").length,
    quase: revisoes.filter((r) => r.nota === "quase").length,
    erros: revisoes.filter((r) => r.nota === "errei").length,
    sessoes: sessoes.length,
    ultimaEm: revisoes.at(-1)?.revisado_em ?? null,
    recentes: sessoes.filter((s) => new Date(s.inicio).getTime() >= desde),
  };
}
