import type { QaItem } from "@/lib/domain";

// Exercício de lacunas (cloze): número e âncoras somem do texto da resposta.
// Até 3 lacunas: no máximo 2 números, o resto em âncoras.

export type Trecho = { tipo: "texto"; texto: string } | { tipo: "lacuna"; indice: number };

const NUMERO = /(?<![\p{L}\d+.,])\d+(?:[.,]\d+)?\s?(?:x|%|ms|s|min|h)?(?![\p{L}\d])/gu;
const MAXIMO = 3;
const MAXIMO_NUMEROS = 2;

type Alvo = { linha: number; inicio: number; fim: number; prioridade: number };

function linhas(item: QaItem) {
  return [item.gancho ?? "", ...item.bullets].filter(Boolean);
}

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function encontrarAlvos(item: QaItem): Alvo[] {
  const fontes = linhas(item);
  const candidatos: Alvo[] = [];

  fontes.forEach((texto, linha) => {
    for (const m of texto.matchAll(NUMERO)) {
      candidatos.push({ linha, inicio: m.index, fim: m.index + m[0].trimEnd().length, prioridade: 0 });
    }
    for (const ancora of item.ancoras) {
      const m = new RegExp(`(?<![\\p{L}\\d])${escapar(ancora)}(?![\\p{L}\\d])`, "iu").exec(texto);
      if (m) candidatos.push({ linha, inicio: m.index, fim: m.index + m[0].length, prioridade: 1 });
    }
  });

  const escolhidos: Alvo[] = [];
  const usados = new Set<string>();
  for (const c of candidatos.sort((a, b) => a.prioridade - b.prioridade)) {
    const texto = fontes[c.linha].slice(c.inicio, c.fim).toLowerCase();
    const sobrepoe = escolhidos.some(
      (e) => e.linha === c.linha && c.inicio < e.fim && e.inicio < c.fim,
    );
    const numeros = escolhidos.filter((e) => e.prioridade === 0).length;
    if (sobrepoe || usados.has(texto)) continue;
    if (c.prioridade === 0 && numeros === MAXIMO_NUMEROS) continue;
    escolhidos.push(c);
    usados.add(texto);
    if (escolhidos.length === MAXIMO) break;
  }
  return escolhidos;
}

export function temLacunas(item: QaItem) {
  return encontrarAlvos(item).length > 0;
}

export function montarLacunas(item: QaItem) {
  const fontes = linhas(item);
  const alvos = encontrarAlvos(item).sort((a, b) => a.linha - b.linha || a.inicio - b.inicio);
  const respostas: string[] = [];

  const resultado: Trecho[][] = fontes.map((texto, linha) => {
    const trechos: Trecho[] = [];
    let cursor = 0;
    for (const alvo of alvos.filter((a) => a.linha === linha)) {
      if (alvo.inicio > cursor) trechos.push({ tipo: "texto", texto: texto.slice(cursor, alvo.inicio) });
      trechos.push({ tipo: "lacuna", indice: respostas.length });
      respostas.push(texto.slice(alvo.inicio, alvo.fim));
      cursor = alvo.fim;
    }
    if (cursor < texto.length) trechos.push({ tipo: "texto", texto: texto.slice(cursor) });
    return trechos;
  });

  return { linhas: resultado, respostas };
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/\s/g, "");
}

export function confere(digitado: string, certo: string) {
  return normalizar(digitado) === normalizar(certo);
}
