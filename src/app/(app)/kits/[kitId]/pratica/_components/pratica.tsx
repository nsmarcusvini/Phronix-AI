"use client";

import { useCallback, useEffect, useState } from "react";
import type { Kit, QaItem, Review } from "@/lib/domain";
import { KitSemMapa } from "@/components/kit-sem-mapa";
import { localDb } from "@/lib/local-db";
import { enfileirar, sincronizarKit } from "@/lib/sync/sincronizar";
import { DEMO_KIT_ID, semearDemo } from "@/lib/hora-do-show/demo";
import {
  TAMANHO_SESSAO,
  diasAte,
  embaralhar,
  escolherExercicio,
  estados as calcularEstados,
  pendentes,
  proximaRevisao,
  aplicarNota,
  type Nota,
} from "@/lib/pratica/leitner";
import { Fim } from "./fim";
import { Hoje } from "./hoje";
import { Sessao, type ItemDaFila, type Resultado } from "./sessao";
import { novoId } from "@/lib/id";

type Dados = { kit: Kit; itens: QaItem[]; reviews: Review[]; agora: Date };

type Fase =
  | { tipo: "hoje" }
  | { tipo: "sessao"; fila: ItemDaFila[] }
  | { tipo: "fim"; resultados: Resultado[] };

// Prática offline: lê e grava no IndexedDB. A sincronização com o Supabase
// entra quando o back voltar.
export function Pratica({ kitId }: { kitId: string }) {
  const demo = kitId === "demo";
  const id = demo ? DEMO_KIT_ID : kitId;
  const [dados, setDados] = useState<Dados | "ausente" | "sem-mapa" | null>(null);
  const [fase, setFase] = useState<Fase>({ tipo: "hoje" });

  const carregar = useCallback(async () => {
    try {
      const [kit, itens, reviews] = await Promise.all([
        localDb.kits.get(id),
        localDb.qaItems.where("kit_id").equals(id).toArray(),
        localDb.reviews.where("kit_id").equals(id).toArray(),
      ]);
      setDados(!kit ? "ausente" : itens.length ? { kit, itens, reviews, agora: new Date() } : "sem-mapa");
    } catch {
      setDados("ausente");
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      if (demo) await semearDemo().catch(() => {});
      else await sincronizarKit(id);
      await carregar();
    })();
  }, [demo, carregar, id]);

  if (dados === null) return <p className="sr-only" role="status">Carregando a prática</p>;

  if (dados === "sem-mapa") return <KitSemMapa kitId={kitId} />;

  if (dados === "ausente") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-8">
        <h1 className="font-display text-display-lg font-medium">Este kit não está neste aparelho.</h1>
        <p className="mt-4 text-cinza-quente">Abra o kit com internet uma vez para praticar aqui.</p>
      </main>
    );
  }

  const { agora: carregadoEm } = dados;
  const estados = calcularEstados(dados.itens, dados.reviews);
  const dias = diasAte(dados.kit.data_entrevista, carregadoEm);

  function iniciar(relampago: boolean) {
    const fila: ItemDaFila[] = relampago
      ? embaralhar(estados).slice(0, 5).map((estado) => ({ estado, exercicio: "relampago" }))
      : pendentes(estados, carregadoEm)
          .slice(0, TAMANHO_SESSAO)
          .map((estado) => ({ estado, exercicio: escolherExercicio(estado, dias) }));
    if (fila.length) setFase({ tipo: "sessao", fila });
  }

  async function registrar({ estado, exercicio }: ItemDaFila, nota: Nota) {
    const agora = new Date();
    const caixa = aplicarNota(estado.caixa, nota);
    const reviewId = novoId();
    await localDb.reviews.add({
      id: reviewId,
      kit_id: id,
      qa_item_id: estado.item.id,
      exercicio,
      nota,
      caixa,
      proxima_revisao: proximaRevisao(caixa, dias, agora).toISOString(),
      revisado_em: agora.toISOString(),
    });
    await enfileirar(id, "review", reviewId);
  }

  if (fase.tipo === "sessao") {
    return (
      <Sessao
        fila={fase.fila}
        onNota={registrar}
        onFim={async (resultados) => {
          await carregar();
          setFase({ tipo: "fim", resultados });
        }}
        onSair={async () => {
          await carregar();
          setFase({ tipo: "hoje" });
        }}
      />
    );
  }

  if (fase.tipo === "fim") {
    return (
      <Fim
        kitId={kitId}
        resultados={fase.resultados}
        estados={estados}
        onVoltar={() => setFase({ tipo: "hoje" })}
      />
    );
  }

  return (
    <Hoje
      kitId={kitId}
      estados={estados}
      reviews={dados.reviews}
      dias={dias}
      agora={dados.agora}
      onComecar={() => iniciar(false)}
      onRelampago={() => iniciar(true)}
    />
  );
}
