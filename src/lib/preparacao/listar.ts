import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoEntrevista } from "@/lib/domain";
import { PALCO, diasAte } from "@/lib/pratica/leitner";
import type { Database } from "@/lib/supabase/database.types";

// Monta "Minhas preparações" no servidor, com a sessão da pessoa (RLS):
// kits agrupados por vaga, com o progresso calculado das revisões.

type Status = Database["public"]["Enums"]["status_kit"];
export type Ponto = "palco" | "revisar" | "em-dia";

export type ResumoKit = {
  id: string;
  tipo: TipoEntrevista;
  status: Status;
  total: number;
  prontas: number;
  aRevisar: number;
  pontos: Ponto[];
  acesso: string;
  proxima: { texto: string; href: string };
};

export type ResumoVaga = {
  id: string;
  empresa: string | null;
  cargo: string | null;
  // Data da entrevista (aaaa-mm-dd), do kit mais recente que tiver uma.
  data: string | null;
  dias: number | null;
  kits: Partial<Record<TipoEntrevista, ResumoKit>>;
};

const SELECT = `
  id, tipo, status, data_entrevista, acesso, acesso_expira_em, created_at,
  vaga:jobs!kits_job_id_user_id_fkey ( id, empresa, cargo ),
  respostas:qa_items ( id, gancho, revisoes:reviews ( caixa, proxima_revisao, revisado_em ) )
`;

export async function listarPreparacoes(supabase: SupabaseClient<Database>): Promise<ResumoVaga[]> {
  const { data, error } = await supabase.from("kits").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;

  const agora = new Date();
  const vagas = new Map<string, ResumoVaga>();

  for (const kit of data ?? []) {
    const vaga = Array.isArray(kit.vaga) ? kit.vaga[0] : kit.vaga;
    if (!vaga) continue;

    const praticaveis = (kit.respostas ?? []).filter((r) => r.gancho !== null);
    const pontos: Ponto[] = praticaveis.map((r) => {
      const ultima = [...(r.revisoes ?? [])].sort((a, b) => b.revisado_em.localeCompare(a.revisado_em))[0];
      if (ultima?.caixa === PALCO) return "palco";
      if (!ultima || new Date(ultima.proxima_revisao) <= agora) return "revisar";
      return "em-dia";
    });
    const aRevisar = pontos.filter((p) => p === "revisar").length;

    const resumo: ResumoKit = {
      id: kit.id,
      tipo: kit.tipo,
      status: kit.status,
      total: pontos.length,
      prontas: pontos.filter((p) => p === "palco").length,
      aRevisar,
      pontos,
      acesso:
        kit.acesso === "avulso" && kit.acesso_expira_em
          ? `Avulso · vale até ${new Date(kit.acesso_expira_em).toLocaleDateString("pt-BR")}`
          : kit.acesso === "pro"
            ? "Pro"
            : "Grátis",
      proxima: proximaAcao(kit.id, kit.tipo, kit.status, pontos.length, aRevisar),
    };

    const atual: ResumoVaga = vagas.get(vaga.id) ?? {
      id: vaga.id,
      empresa: vaga.empresa,
      cargo: vaga.cargo,
      data: kit.data_entrevista,
      dias: diasAte(kit.data_entrevista, agora),
      kits: {},
    };
    // Mais de um kit do mesmo tipo: fica o mais recente (a lista já vem ordenada).
    if (!atual.kits[kit.tipo]) atual.kits[kit.tipo] = resumo;
    if (atual.dias === null && kit.data_entrevista) {
      atual.dias = diasAte(kit.data_entrevista, agora);
      atual.data = kit.data_entrevista;
    }
    vagas.set(vaga.id, atual);
  }

  // Próximas primeiro (da mais perto para a mais longe), depois as sem data,
  // e por último as que já passaram (da mais recente para a mais antiga).
  const ordem = (dias: number | null) => (dias === null ? 10_000 : dias < 0 ? 20_000 - dias : dias);
  return [...vagas.values()].sort((a, b) => ordem(a.dias) - ordem(b.dias));
}

function proximaAcao(id: string, tipo: TipoEntrevista, status: Status, total: number, aRevisar: number) {
  if (status !== "pronto" || total === 0) {
    return { texto: "Continuar a conversa", href: `/kits/${id}/conversa?tipo=${tipo}` };
  }
  if (aRevisar > 0) {
    return { texto: `Praticar ${aRevisar} ${aRevisar === 1 ? "resposta" : "respostas"}`, href: `/kits/${id}/pratica` };
  }
  return { texto: "Abrir a Hora do Show", href: `/hora-do-show/${id}` };
}
