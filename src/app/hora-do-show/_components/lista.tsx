"use client";

import { useEffect, useRef } from "react";
import type { Categoria, QaItem } from "@/lib/domain";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";

type Props = {
  itens: QaItem[];
  atualId: string;
  respondidas: Set<string>;
  abertas: Set<Categoria>;
  onAlternarCategoria: (categoria: Categoria) => void;
  onEscolher: (id: string) => void;
};

// Sidebar estilo Notion: fixados no topo, categorias como toggles e perguntas
// como itens. Respondidas ficam riscadas: no fim, a lista vira o mapa da entrevista.
export function Lista({
  itens,
  atualId,
  respondidas,
  abertas,
  onAlternarCategoria,
  onEscolher,
}: Props) {
  const fixados = itens.filter((i) => i.fixado);

  return (
    <nav aria-label="Perguntas" className="h-full overflow-y-auto py-5 text-hs-sidebar">
      {fixados.length > 0 && (
        <section className="mb-5">
          <h2 className="px-5 pb-1 text-[0.8125rem] text-cinza-quente">Fixados</h2>
          <ul>
            {fixados.map((item) => (
              <Item
                key={item.id}
                item={item}
                atual={item.id === atualId}
                respondida={respondidas.has(item.id)}
                onEscolher={onEscolher}
              />
            ))}
          </ul>
        </section>
      )}

      {CATEGORIAS.map((categoria, indice) => {
        const daCategoria = itens.filter((i) => i.categoria === categoria.id);
        if (daCategoria.length === 0) return null;
        const aberta = abertas.has(categoria.id);
        const feitas = daCategoria.filter((i) => respondidas.has(i.id)).length;
        return (
          <section key={categoria.id} className="mt-1">
            <h2>
              <button
                type="button"
                aria-expanded={aberta}
                onClick={() => onAlternarCategoria(categoria.id)}
                className="flex w-full items-baseline gap-2 px-5 py-1.5 text-left text-cinza-quente hover:text-osso"
              >
                <span aria-hidden className="w-3 shrink-0 text-xs">
                  {aberta ? "▾" : "▸"}
                </span>
                <span className="flex-1">{categoria.nome}</span>
                <span className="tabular-nums text-[0.8125rem]">
                  {feitas > 0 ? `${feitas}/${daCategoria.length}` : indice + 1}
                </span>
              </button>
            </h2>
            {aberta && (
              <ul>
                {daCategoria.map((item) => (
                  <Item
                    key={item.id}
                    item={item}
                    atual={item.id === atualId}
                    respondida={respondidas.has(item.id)}
                    onEscolher={onEscolher}
                    recuado
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </nav>
  );
}

function Item({
  item,
  atual,
  respondida,
  recuado = false,
  onEscolher,
}: {
  item: QaItem;
  atual: boolean;
  respondida: boolean;
  recuado?: boolean;
  onEscolher: (id: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Mantém o item ativo à vista rolando só a própria lista, nunca a página
  // (a Hora do Show também roda embutida na landing).
  useEffect(() => {
    const item = ref.current;
    const lista = item?.closest("nav");
    if (!atual || !item || !lista) return;
    const a = item.getBoundingClientRect();
    const b = lista.getBoundingClientRect();
    if (a.top < b.top) lista.scrollTop -= b.top - a.top;
    else if (a.bottom > b.bottom) lista.scrollTop += a.bottom - b.bottom;
  }, [atual]);

  return (
    <li>
      <button
        ref={ref}
        type="button"
        aria-current={atual ? "true" : undefined}
        onClick={() => onEscolher(item.id)}
        className={`relative w-full py-1.5 pr-5 text-left ${recuado ? "pl-10" : "pl-5"} ${
          atual ? "font-semibold text-osso" : respondida ? "text-cinza-quente line-through decoration-cinza-quente/60" : "text-osso/85 hover:text-osso"
        }`}
      >
        {atual && (
          <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 bg-fenix" />
        )}
        <span className="line-clamp-2">{item.pergunta}</span>
        {respondida && <span className="sr-only"> (respondida)</span>}
      </button>
    </li>
  );
}
