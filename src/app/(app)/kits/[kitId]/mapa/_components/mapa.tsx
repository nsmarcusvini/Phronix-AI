"use client";

import { useEffect, useRef, useState } from "react";
import type { Kit, QaItem, Review } from "@/lib/domain";
import { KitSemMapa } from "@/components/kit-sem-mapa";
import { localDb } from "@/lib/local-db";
import { enfileirar, sincronizarKit } from "@/lib/sync/sincronizar";
import { DEMO_KIT_ID, semearDemo } from "@/lib/hora-do-show/demo";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import { bloqueada } from "@/lib/mapa/bloqueio";
import { fala, pendenciasDeConfirmacao } from "@/lib/mapa/fala";
import { estados as calcularEstados } from "@/lib/pratica/leitner";
import { Bloqueada } from "./bloqueada";
import { Editor } from "./editor";
import { Indice } from "./indice";

type Dados = { kit: Kit; itens: QaItem[]; reviews: Review[]; agora: Date };

const ORDEM_CATEGORIA = new Map(CATEGORIAS.map((c, i) => [c.id, i]));

function ordenar(itens: QaItem[]) {
  return [...itens].sort(
    (a, b) =>
      (ORDEM_CATEGORIA.get(a.categoria) ?? 0) - (ORDEM_CATEGORIA.get(b.categoria) ?? 0) ||
      a.ordem - b.ordem,
  );
}

const ESPERA_SALVAR = 400;

// Editor do mapa. Tudo é salvo no IndexedDB e já vale para a Prática e a
// Hora do Show, e a fila de sincronização leva para o Supabase.
export function Mapa({ kitId }: { kitId: string }) {
  const demo = kitId === "demo";
  const id = demo ? DEMO_KIT_ID : kitId;
  const [dados, setDados] = useState<Dados | "ausente" | "sem-mapa" | null>(null);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [editorNoCelular, setEditorNoCelular] = useState(false);
  const pendentes = useRef(new Map<string, { item: QaItem; timer: ReturnType<typeof setTimeout> }>());

  useEffect(() => {
    (async () => {
      try {
        if (demo) await semearDemo();
        else await sincronizarKit(id);
        const [kit, itens, reviews] = await Promise.all([
          localDb.kits.get(id),
          localDb.qaItems.where("kit_id").equals(id).toArray(),
          localDb.reviews.where("kit_id").equals(id).toArray(),
        ]);
        if (!kit || itens.length === 0) {
          setDados(kit ? "sem-mapa" : "ausente");
          return;
        }
        const ordenados = ordenar(itens);
        setDados({ kit, itens: ordenados, reviews, agora: new Date() });
        setSelecionadoId(ordenados[0].id);
      } catch {
        setDados("ausente");
      }
    })();
  }, [demo, id]);

  // Ao sair da tela, grava o que ainda estava esperando.
  useEffect(() => {
    const fila = pendentes.current;
    return () => {
      for (const { item, timer } of fila.values()) {
        clearTimeout(timer);
        void localDb.qaItems.put(item).then(() => enfileirar(item.kit_id, "resposta", item.id));
      }
      fila.clear();
    };
  }, []);

  if (dados === null) return <p className="sr-only" role="status">Carregando o mapa</p>;

  if (dados === "sem-mapa") return <KitSemMapa kitId={kitId} />;

  if (dados === "ausente") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-8">
        <h1 className="font-display text-display-lg font-medium">Este kit não está neste aparelho.</h1>
        <p className="mt-4 text-cinza-quente">Abra o kit com internet uma vez para editar aqui.</p>
      </main>
    );
  }

  const carregado = dados;
  const { kit, itens, reviews, agora } = carregado;
  const bloqueadas = new Set(itens.filter((_, i) => bloqueada(kit, i)).map((i) => i.id));
  const estados = new Map(calcularEstados(itens, reviews).map((e) => [e.item.id, e]));
  const posicao = itens.findIndex((i) => i.id === selecionadoId);
  const selecionado = itens[posicao] ?? itens[0];
  const abertas = itens.filter((i) => !bloqueadas.has(i.id));
  const comResposta = abertas.filter((i) => i.gancho !== null);
  const media = comResposta.length
    ? Math.round(comResposta.reduce((s, i) => s + fala(i).segundos, 0) / comResposta.length)
    : 0;
  const paraConfirmar = abertas.reduce((s, i) => s + pendenciasDeConfirmacao(i).length, 0);
  const fixadas = abertas.filter((i) => i.fixado).length;

  function salvarDepois(item: QaItem) {
    const atual = pendentes.current.get(item.id);
    if (atual) clearTimeout(atual.timer);
    const timer = setTimeout(() => {
      pendentes.current.delete(item.id);
      void localDb.qaItems.put(item).then(() => enfileirar(item.kit_id, "resposta", item.id));
    }, ESPERA_SALVAR);
    pendentes.current.set(item.id, { item, timer });
  }

  function alterar(itemId: string, alteracao: Partial<QaItem>) {
    const atual = itens.find((i) => i.id === itemId);
    if (!atual) return;
    const atualizado = { ...atual, ...alteracao, updated_at: new Date().toISOString() };
    atualizado.pendente_confirmacao = pendenciasDeConfirmacao(atualizado).length > 0;
    salvarDepois(atualizado);
    setDados({ ...carregado, itens: itens.map((i) => (i.id === itemId ? atualizado : i)) });
  }

  function mover(origemId: string, destinoId: string) {
    const lista = [...itens];
    const de = lista.findIndex((i) => i.id === origemId);
    const para = lista.findIndex((i) => i.id === destinoId);
    if (de < 0 || para < 0 || lista[de].categoria !== lista[para].categoria) return;
    const [movido] = lista.splice(de, 1);
    lista.splice(para, 0, movido);
    const agoraIso = new Date().toISOString();
    const renumerados = lista.map((item, i) =>
      item.ordem === i + 1 ? item : { ...item, ordem: i + 1, updated_at: agoraIso },
    );
    const mudados = renumerados.filter((item, i) => item !== lista[i]);
    void localDb.qaItems
      .bulkPut(mudados)
      .then(() => Promise.all(mudados.map((m) => enfileirar(m.kit_id, "resposta", m.id))));
    setDados({ ...carregado, itens: renumerados });
  }

  function selecionar(itemId: string) {
    setSelecionadoId(itemId);
    setEditorNoCelular(true);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.scrollTo({ top: 0 });
      return;
    }
    // No desktop, se o editor ficou acima da tela, sobe até ele.
    const editor = document.getElementById("editor-resposta");
    if (editor && editor.getBoundingClientRect().top < 0) {
      editor.scrollIntoView({ block: "start" });
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b border-fio pb-8">
        <div>
          <h1 className="text-rotulo text-cinza-quente">Mapa de perguntas</h1>
          <p className="mt-2 font-display text-display-lg font-medium">
            {itens.length} perguntas
            <span className="text-cinza-quente"> · ~{media} s por resposta</span>
          </p>
        </div>
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-rotulo text-cinza-quente">Abertas</dt>
            <dd className="mt-1 font-display text-xl tabular-nums">
              {abertas.length}
              <span className="text-cinza-quente">/{itens.length}</span>
            </dd>
          </div>
          <div>
            <dt className="text-rotulo text-cinza-quente">Para confirmar</dt>
            <dd className={`mt-1 font-display text-xl tabular-nums ${paraConfirmar ? "text-ambar" : ""}`}>
              {paraConfirmar}
            </dd>
          </div>
          <div>
            <dt className="text-rotulo text-cinza-quente">Fixadas</dt>
            <dd className="mt-1 font-display text-xl tabular-nums">{fixadas}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-14">
        <aside className={editorNoCelular ? "hidden lg:block" : undefined}>
          <div className="lg:sticky lg:top-6 lg:-ml-3 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-2">
            <Indice
              itens={itens}
              selecionadoId={selecionado.id}
              bloqueadas={bloqueadas}
              estados={estados}
              agora={agora}
              onSelecionar={selecionar}
              onMover={mover}
            />
            <p className="mt-2 px-3 text-rotulo text-cinza-quente">
              Arraste para reordenar, ou Alt+↑ / Alt+↓.
            </p>
          </div>
        </aside>

        <section
          id="editor-resposta"
          className={`scroll-mt-6 ${editorNoCelular ? "" : "hidden lg:block"}`}
          aria-label="Resposta"
        >
          {bloqueadas.has(selecionado.id) ? (
            <Bloqueada
              item={selecionado}
              restantes={bloqueadas.size}
              onVoltar={() => setEditorNoCelular(false)}
            />
          ) : (
            <Editor
              key={selecionado.id}
              demo={demo}
              item={selecionado}
              posicao={posicao + 1}
              total={itens.length}
              onAlterar={(alteracao) => alterar(selecionado.id, alteracao)}
              onVoltar={() => setEditorNoCelular(false)}
            />
          )}
        </section>
      </div>
    </main>
  );
}
