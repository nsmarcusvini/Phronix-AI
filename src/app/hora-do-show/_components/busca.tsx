"use client";

import { useMemo, useState } from "react";
import type { QaItem } from "@/lib/domain";
import { buscar, type Indice } from "@/lib/hora-do-show/busca";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";

const NOME_CATEGORIA = new Map(CATEGORIAS.map((c) => [c.id, c.nome]));

type Props = {
  indice: Indice;
  fixados: QaItem[];
  onEscolher: (id: string) => void;
  onFechar: () => void;
};

// Barra de comando presa à linha do olhar. Duas ou três letras já filtram.
export function Busca({ indice, fixados, onEscolher, onFechar }: Props) {
  const [termo, setTermo] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const resultados = useMemo(
    () => (termo.trim() ? buscar(indice, termo) : fixados),
    [indice, termo, fixados],
  );

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setSelecionado((s) => (s + passo + resultados.length) % Math.max(resultados.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const escolhido = resultados[selecionado];
      if (escolhido) onEscolher(escolhido.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onFechar();
    }
  }

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-palco px-6 pt-4 pb-3">
      <label className="flex items-baseline gap-3">
        <span className="text-hs-pergunta text-cinza-quente" aria-hidden>
          /
        </span>
        <span className="sr-only">Buscar pergunta, âncora ou palavra da resposta</span>
        <input
          autoFocus
          role="combobox"
          aria-expanded={resultados.length > 0}
          aria-controls="resultados-busca"
          aria-activedescendant={resultados[selecionado] ? `busca-${resultados[selecionado].id}` : undefined}
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setSelecionado(0);
          }}
          onKeyDown={aoTeclar}
          placeholder="pergunta, âncora ou palavra"
          className="w-full bg-transparent text-hs-gancho font-bold text-osso placeholder:font-normal placeholder:text-cinza-quente focus:outline-none"
        />
      </label>

      <ul id="resultados-busca" role="listbox" className="mt-3 text-hs-sidebar">
        {!termo.trim() && fixados.length > 0 && (
          <li role="presentation" className="pb-1 text-[0.8125rem] text-cinza-quente">
            Fixados
          </li>
        )}
        {resultados.map((item, i) => (
          <li
            key={item.id}
            id={`busca-${item.id}`}
            role="option"
            aria-selected={i === selecionado}
            onMouseDown={(e) => {
              e.preventDefault();
              onEscolher(item.id);
            }}
            onMouseEnter={() => setSelecionado(i)}
            className={`relative flex cursor-pointer items-baseline gap-3 py-1.5 pl-4 ${
              i === selecionado ? "text-osso" : "text-osso/85"
            }`}
          >
            {i === selecionado && (
              <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 bg-fenix" />
            )}
            <span className="flex-1">{item.pergunta}</span>
            <span className="hidden text-[0.8125rem] text-cinza-quente sm:inline">
              {NOME_CATEGORIA.get(item.categoria)}
            </span>
          </li>
        ))}
        {termo.trim() && resultados.length === 0 && (
          <li className="py-1.5 text-cinza-quente">Nada encontrado.</li>
        )}
      </ul>
    </div>
  );
}
