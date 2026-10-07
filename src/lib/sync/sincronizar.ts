import type { Kit, QaItem, Review } from "@/lib/domain";
import { DEMO_KIT_ID } from "@/lib/hora-do-show/demo";
import { localDb, type OperacaoFila } from "@/lib/local-db";
import { createClient } from "@/lib/supabase/client";

// Sincronização aparelho ↔ Supabase para kits reais (o demo vive só no aparelho).
// 1. Mudanças locais entram numa fila e saem quando há rede.
// 2. Ao abrir um kit, a fila é enviada e o kit é baixado de novo.
// Conflito em respostas: vence a última escrita (gatilho no banco).

const LIMITE_MS = 4000;

const COLUNAS_KIT =
  "id, user_id, resume_id, job_id, tipo, nivel, nivel_confianca, nivel_ajustado, match_score, data_entrevista, status, acesso, acesso_expira_em, updated_at";
const COLUNAS_RESPOSTA =
  "id, kit_id, categoria, pergunta, gancho, bullets, ancoras, expandida, numero_impacto, case_id, ordem, fixado, pendente_confirmacao, updated_at";

export function ehKitReal(kitId: string) {
  return kitId !== "demo" && kitId !== DEMO_KIT_ID;
}

export async function enfileirar(kitId: string, tipo: OperacaoFila["tipo"], id: string) {
  if (!ehKitReal(kitId)) return;
  // Uma resposta editada várias vezes precisa de um envio só (vale o estado atual).
  if (tipo === "resposta" && (await localDb.fila.where("[tipo+id]").equals([tipo, id]).count()) > 0) {
    void enviarFila();
    return;
  }
  await localDb.fila.add({ kit_id: kitId, tipo, id, criado_em: new Date().toISOString() });
  void enviarFila();
}

let emEnvio: Promise<void> | null = null;

export function enviarFila(): Promise<void> {
  if (emEnvio) return emEnvio;
  emEnvio = (async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const supabase = createClient();
      const operacoes = await localDb.fila.orderBy("seq").toArray();
      for (const op of operacoes) {
        let erro: unknown = null;
        if (op.tipo === "review") {
          const review = await localDb.reviews.get(op.id);
          if (review) {
            ({ error: erro } = await supabase.from("reviews").upsert(review, { onConflict: "id", ignoreDuplicates: true }));
          }
        } else {
          const resposta = await localDb.qaItems.get(op.id);
          if (resposta) {
            // Só as colunas que o usuário pode alterar (grants do schema).
            const campos = {
              categoria: resposta.categoria,
              pergunta: resposta.pergunta,
              gancho: resposta.gancho,
              bullets: resposta.bullets,
              ancoras: resposta.ancoras,
              expandida: resposta.expandida,
              numero_impacto: resposta.numero_impacto,
              case_id: resposta.case_id,
              ordem: resposta.ordem,
              fixado: resposta.fixado,
              pendente_confirmacao: resposta.pendente_confirmacao,
              updated_at: resposta.updated_at,
            };
            ({ error: erro } = await supabase.from("qa_items").update(campos).eq("id", resposta.id));
          }
        }
        // Falhou (rede ou servidor): para aqui e tenta de novo na próxima vez.
        if (erro) break;
        await localDb.fila.delete(op.seq!);
      }
    } catch {
      // Sem rede ou sem sessão: a fila espera.
    } finally {
      emEnvio = null;
    }
  })();
  return emEnvio;
}

export async function baixarKit(kitId: string) {
  const supabase = createClient();
  const [kit, respostas, revisoes] = await Promise.all([
    supabase.from("kits").select(COLUNAS_KIT).eq("id", kitId).maybeSingle(),
    supabase.from("qa_items").select(COLUNAS_RESPOSTA).eq("kit_id", kitId),
    supabase.from("reviews").select("*").eq("kit_id", kitId),
  ]);
  if (kit.error || respostas.error || revisoes.error || !kit.data) return false;

  // Respostas com edição local ainda na fila não são sobrescritas.
  const pendentes = new Set(
    (await localDb.fila.where("kit_id").equals(kitId).toArray()).filter((o) => o.tipo === "resposta").map((o) => o.id),
  );
  const remotas = respostas.data as QaItem[];
  const idsRemotos = new Set(remotas.map((r) => r.id));

  await localDb.transaction("rw", localDb.kits, localDb.qaItems, localDb.reviews, async () => {
    await localDb.kits.put(kit.data as Kit);
    await localDb.qaItems.bulkPut(remotas.filter((r) => !pendentes.has(r.id)));
    // Some do aparelho o que não existe mais (ou ficou bloqueado) no servidor.
    const locais = await localDb.qaItems.where("kit_id").equals(kitId).primaryKeys();
    await localDb.qaItems.bulkDelete(locais.filter((id) => !idsRemotos.has(id) && !pendentes.has(id)));
    await localDb.reviews.bulkPut(revisoes.data as Review[]);
  });
  return true;
}

// Envia a fila e baixa o kit, sem nunca segurar a tela além do limite.
export async function sincronizarKit(kitId: string) {
  if (!ehKitReal(kitId) || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  const trabalho = (async () => {
    await enviarFila();
    await baixarKit(kitId);
  })().catch(() => {});
  await Promise.race([trabalho, new Promise((ok) => setTimeout(ok, LIMITE_MS))]);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void enviarFila());
}
