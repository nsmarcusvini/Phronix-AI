"use client";

import { useSyncExternalStore } from "react";
import { Palco } from "@/app/hora-do-show/_components/palco";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import { demoItens } from "@/lib/hora-do-show/demo";
import type { Modo } from "@/lib/hora-do-show/modo";

const ORDEM = new Map(CATEGORIAS.map((c, i) => [c.id, i]));
const ITENS = [...demoItens].sort(
  (a, b) => (ORDEM.get(a.categoria) ?? 0) - (ORDEM.get(b.categoria) ?? 0) || a.ordem - b.ordem,
);

function assinarLargura(avisar: () => void) {
  const consulta = window.matchMedia("(min-width: 900px)");
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

// A Hora do Show de verdade, com o kit de demonstração, dentro da landing.
// Com tela larga mostra a lista ao lado; no celular, a gaveta.
export function DemoShow() {
  const largo = useSyncExternalStore(
    assinarLargura,
    () => window.matchMedia("(min-width: 900px)").matches,
    () => true,
  );
  const modo: Modo = largo ? "monitor" : "meia";

  return (
    <div className="font-show h-[36rem] overflow-hidden rounded-[3px] border border-fio bg-palco text-osso sm:h-[38rem]">
      <Palco key={modo} itens={ITENS} demo modo={modo} lado="esquerda" onModo={() => {}} embutido />
    </div>
  );
}
