"use client";

import { useEffect, useState } from "react";
import type { Kit, QaItem } from "@/lib/domain";
import { localDb } from "@/lib/local-db";
import { sincronizarKit } from "@/lib/sync/sincronizar";
import { DEMO_KIT_ID, semearDemo } from "@/lib/hora-do-show/demo";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import {
  detectarModo,
  lerPreferencias,
  salvarPreferencias,
  type Lado,
  type Modo,
} from "@/lib/hora-do-show/modo";
import { Entrada } from "./entrada";
import { Palco } from "./palco";

type Estado =
  | { fase: "carregando" }
  | { fase: "ausente" }
  | { fase: "sem-mapa" }
  | { fase: "entrada" | "palco"; kit: Kit; itens: QaItem[] };

const ORDEM_CATEGORIA = new Map(CATEGORIAS.map((c, i) => [c.id, i]));

function ordenar(itens: QaItem[]) {
  return [...itens].sort(
    (a, b) =>
      (ORDEM_CATEGORIA.get(a.categoria) ?? 0) - (ORDEM_CATEGORIA.get(b.categoria) ?? 0) ||
      a.ordem - b.ordem,
  );
}

// Tudo vem do IndexedDB: nenhuma chamada de rede depois que a página abre.
export function HoraDoShow({ kitId }: { kitId: string }) {
  const demo = kitId === "demo";
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [modo, setModo] = useState<Modo>("meia");
  const [modoDetectado, setModoDetectado] = useState<Modo>("meia");
  const [lado, setLado] = useState<Lado>("esquerda");

  useEffect(() => {
    let vivo = true;
    (async () => {
      const id = demo ? DEMO_KIT_ID : kitId;
      try {
        if (demo) await semearDemo();
        else await sincronizarKit(id);
        const [kit, itens] = await Promise.all([
          localDb.kits.get(id),
          localDb.qaItems.where("kit_id").equals(id).toArray(),
        ]);
        if (!vivo) return;
        const detectado = detectarModo();
        const preferencias = lerPreferencias();
        setModoDetectado(detectado);
        setModo(preferencias.modo ?? detectado);
        setLado(preferencias.lado ?? "esquerda");
        setEstado(
          !kit
            ? { fase: "ausente" }
            : itens.length > 0
              ? { fase: "entrada", kit, itens: ordenar(itens) }
              : { fase: "sem-mapa" },
        );
      } catch {
        if (vivo) setEstado({ fase: "ausente" });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [kitId, demo]);

  const noPalco = estado.fase === "palco";
  useEffect(() => {
    if (!noPalco) return;
    return manterTelaAcesa();
  }, [noPalco]);

  function trocarModo(novo: Modo) {
    setModo(novo);
    salvarPreferencias({ modo: novo });
  }

  function trocarLado(novo: Lado) {
    setLado(novo);
    salvarPreferencias({ lado: novo });
  }

  if (estado.fase === "carregando") {
    return <p className="sr-only" role="status">Carregando o kit</p>;
  }

  if (estado.fase === "sem-mapa") {
    return (
      <main className="mx-auto w-full max-w-xl px-6 pt-10">
        <h1 className="text-hs-gancho font-bold">O mapa deste kit ainda não foi gerado.</h1>
        <p className="mt-3 text-hs-bullet text-cinza-quente">
          A Hora do Show mostra as respostas do mapa. Termine a conversa para gerá-lo.
        </p>
      </main>
    );
  }

  if (estado.fase === "ausente") {
    return (
      <main className="mx-auto w-full max-w-xl px-6 pt-10">
        <h1 className="text-hs-gancho font-bold">Este kit não está neste aparelho.</h1>
        <p className="mt-3 text-hs-bullet text-cinza-quente">
          Abra o kit uma vez com internet para salvá-lo aqui. Depois a Hora do Show funciona
          sem rede.
        </p>
      </main>
    );
  }

  if (estado.fase === "entrada") {
    return (
      <Entrada
        kit={estado.kit}
        total={estado.itens.length}
        demo={demo}
        modo={modo}
        modoDetectado={modoDetectado}
        lado={lado}
        onModo={trocarModo}
        onLado={trocarLado}
        onEntrar={() => setEstado({ ...estado, fase: "palco" })}
      />
    );
  }

  return (
    <Palco itens={estado.itens} demo={demo} modo={modo} lado={lado} onModo={trocarModo} />
  );
}

// Screen Wake Lock: pede de novo quando a aba volta a ficar visível.
// Sem suporte, segue em silêncio.
function manterTelaAcesa() {
  let trava: WakeLockSentinel | null = null;
  let ativo = true;

  async function pedir() {
    try {
      if (ativo && "wakeLock" in navigator && document.visibilityState === "visible") {
        trava = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Sem permissão ou sem bateria suficiente: a tela pode apagar.
    }
  }

  function aoMudarVisibilidade() {
    if (document.visibilityState === "visible") void pedir();
  }

  void pedir();
  document.addEventListener("visibilitychange", aoMudarVisibilidade);
  return () => {
    ativo = false;
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    void trava?.release().catch(() => {});
  };
}
