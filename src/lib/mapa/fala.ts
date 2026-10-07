import type { QaItem } from "@/lib/domain";

// Régua da fala: a resposta curta (gancho + bullets) deve ter de 40 a 70
// palavras e caber em 20 a 40 segundos falando com calma.
export const PALAVRAS_MAXIMO = 70;
export const JANELA = { minimo: 20, maximo: 40 } as const;
export const ESCALA_SEGUNDOS = 60;
const PALAVRAS_POR_SEGUNDO = 1.85;

export function contarPalavras(texto: string) {
  return texto
    .replace(/\[confirmar:[^\]]*\]/g, "x")
    .split(/\s+/)
    .filter((p) => /[\p{L}\d]/u.test(p)).length;
}

export function fala(item: QaItem) {
  const palavras = contarPalavras([item.gancho ?? "", ...item.bullets].join(" "));
  const segundos = Math.round(palavras / PALAVRAS_POR_SEGUNDO);
  const situacao: "curta" | "ok" | "longa" =
    palavras > PALAVRAS_MAXIMO || segundos > JANELA.maximo
      ? "longa"
      : segundos < JANELA.minimo
        ? "curta"
        : "ok";
  return { palavras, segundos, situacao };
}

export function pendenciasDeConfirmacao(item: QaItem) {
  const textos = [item.gancho ?? "", ...item.bullets, item.expandida ?? ""];
  return textos.flatMap((t) => t.match(/\[confirmar:[^\]]*\]/g) ?? []);
}
