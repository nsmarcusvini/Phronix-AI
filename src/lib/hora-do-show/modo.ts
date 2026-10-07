export type Modo = "meia" | "monitor" | "celular";
export type Lado = "esquerda" | "direita";

export const MODOS: readonly { id: Modo; nome: string }[] = [
  { id: "meia", nome: "Meia tela" },
  { id: "monitor", nome: "Segundo monitor" },
  { id: "celular", nome: "Celular" },
];

export function detectarModo(): Modo {
  const toque = window.matchMedia("(pointer: coarse)").matches;
  const largura = window.innerWidth;
  if (toque && largura < 768) return "celular";
  if (largura >= 1100) return "monitor";
  return "meia";
}

const CHAVE = "phronix:hora-do-show:preferencias";

type Preferencias = { modo?: Modo; lado?: Lado };

// Só conveniência do aparelho; se o storage falhar, volta para a detecção.
export function lerPreferencias(): Preferencias {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
    return {
      modo: MODOS.some((m) => m.id === valor.modo) ? valor.modo : undefined,
      lado: valor.lado === "esquerda" || valor.lado === "direita" ? valor.lado : undefined,
    };
  } catch {
    return {};
  }
}

export function salvarPreferencias(preferencias: Preferencias) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...lerPreferencias(), ...preferencias }));
  } catch {
    // Sem storage: a escolha vale só para esta sessão.
  }
}
