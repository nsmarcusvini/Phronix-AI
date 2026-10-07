"use client";

import { useState } from "react";
import type { QaItem } from "@/lib/domain";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import { fala } from "@/lib/mapa/fala";
import { PALCO, type EstadoItem } from "@/lib/pratica/leitner";

type Props = {
  itens: QaItem[];
  selecionadoId: string;
  bloqueadas: Set<string>;
  estados: Map<string, EstadoItem>;
  agora: Date;
  onSelecionar: (id: string) => void;
  onMover: (id: string, destinoId: string) => void;
};

// Índice do mapa: categoria, pergunta, tempo de fala e o ponto da Trilha.
// Reordena arrastando dentro da categoria, ou com Alt+↑ / Alt+↓.
export function Indice({ itens, selecionadoId, bloqueadas, estados, agora, onSelecionar, onMover }: Props) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  return (
    <nav aria-label="Perguntas do mapa" className="text-sm">
      {CATEGORIAS.map((categoria, n) => {
        const daCategoria = itens.filter((i) => i.categoria === categoria.id);
        if (daCategoria.length === 0) return null;
        return (
          <section key={categoria.id} className="mb-7">
            <h2 className="flex items-baseline gap-3 px-3 text-rotulo text-cinza-quente">
              <span className="tabular-nums">{String(n + 1).padStart(2, "0")}</span>
              <span className="flex-1">{categoria.nome}</span>
              <span className="tabular-nums">{daCategoria.length}</span>
            </h2>
            <ul className="mt-2">
              {daCategoria.map((item, i) => {
                const fechada = bloqueadas.has(item.id);
                const selecionado = item.id === selecionadoId;
                const { segundos, situacao } = fala(item);
                const estado = estados.get(item.id);
                return (
                  <li
                    key={item.id}
                    draggable={!fechada}
                    onDragStart={(e) => {
                      setArrastando(item.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setArrastando(null);
                      setSobre(null);
                    }}
                    onDragOver={(e) => {
                      const origem = itens.find((x) => x.id === arrastando);
                      if (origem && origem.categoria === item.categoria && origem.id !== item.id) {
                        e.preventDefault();
                        setSobre(item.id);
                      }
                    }}
                    onDragLeave={() => setSobre((s) => (s === item.id ? null : s))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (arrastando) onMover(arrastando, item.id);
                      setArrastando(null);
                      setSobre(null);
                    }}
                    className={`relative ${arrastando === item.id ? "opacity-40" : ""}`}
                  >
                    {sobre === item.id && (
                      <span aria-hidden className="absolute inset-x-3 -top-px h-px bg-osso" />
                    )}
                    <button
                      type="button"
                      aria-current={selecionado ? "true" : undefined}
                      onClick={() => onSelecionar(item.id)}
                      onKeyDown={(e) => {
                        if (!e.altKey || fechada) return;
                        const alvo = e.key === "ArrowUp" ? daCategoria[i - 1] : e.key === "ArrowDown" ? daCategoria[i + 1] : null;
                        if (alvo) {
                          e.preventDefault();
                          onMover(item.id, alvo.id);
                        }
                      }}
                      className={`group relative flex w-full items-start gap-3 rounded-[3px] px-3 py-2 text-left transition-colors duration-150 ${
                        selecionado ? "bg-grafite text-osso" : "text-osso/85 hover:bg-grafite/60 hover:text-osso"
                      }`}
                    >
                      {selecionado && (
                        <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 bg-fenix" />
                      )}
                      <Ponto estado={estado} fechada={fechada} agora={agora} />
                      <span className={`flex-1 ${fechada ? "text-cinza-quente" : ""}`}>
                        <span className="line-clamp-2">{item.pergunta}</span>
                        {item.fixado && (
                          <span className="mt-0.5 block text-rotulo text-cinza-quente">Fixada na Hora do Show</span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 text-rotulo tabular-nums ${
                          fechada ? "text-cinza-quente" : situacao === "longa" ? "text-ambar" : "text-cinza-quente"
                        }`}
                      >
                        {fechada ? "fechada" : item.gancho ? `${segundos} s` : "—"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}

function Ponto({ estado, fechada, agora }: { estado?: EstadoItem; fechada: boolean; agora: Date }) {
  let classe = "border border-fio";
  if (!fechada && estado) {
    if (estado.caixa === PALCO) classe = "bg-menta";
    else if (estado.proxima === null || estado.proxima <= agora) classe = "bg-osso";
    else classe = "border border-cinza-quente";
  }
  return <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${classe}`} />;
}
