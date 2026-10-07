import type { QaItem } from "@/lib/domain";

// Busca fuzzy sem dependência: com 50 itens, roda bem abaixo dos 50 ms.
// Âncora pesa mais que pergunta, que pesa mais que gancho e bullets.

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function subsequencia(alvo: string, termo: string) {
  let i = 0;
  for (const letra of alvo) if (letra === termo[i] && ++i === termo.length) return true;
  return false;
}

export type Indice = ReturnType<typeof indexar>;

export function indexar(itens: QaItem[]) {
  return itens.map((item) => ({
    item,
    ancoras: normalizar(item.ancoras.join(" ")),
    pergunta: " " + normalizar(item.pergunta),
    gancho: normalizar(item.gancho ?? ""),
    resto: normalizar(
      [...item.bullets, item.expandida ?? "", item.numero_impacto ?? ""].join(" "),
    ),
  }));
}

export function buscar(indice: Indice, consulta: string, limite = 8): QaItem[] {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [];
  const exatos = pontuar(indice, termos, false);
  // Fuzzy (letras em sequência) só quando a busca exata não acha nada.
  return (exatos.length > 0 ? exatos : pontuar(indice, termos, true)).slice(0, limite);
}

function pontuar(indice: Indice, termos: string[], fuzzy: boolean): QaItem[] {
  const achados: { item: QaItem; pontos: number }[] = [];
  for (const d of indice) {
    let pontos = 0;
    for (const termo of termos) {
      let p = 0;
      if (d.ancoras.includes(termo)) p = 4;
      else if (d.pergunta.includes(termo)) p = d.pergunta.includes(" " + termo) ? 3.5 : 3;
      else if (d.gancho.includes(termo)) p = 2;
      else if (d.resto.includes(termo)) p = 1;
      else if (fuzzy && termo.length >= 3 && subsequencia(d.pergunta, termo)) p = 0.5;
      if (p === 0) {
        pontos = 0;
        break;
      }
      pontos += p;
    }
    if (pontos > 0) achados.push({ item: d.item, pontos });
  }

  return achados
    .sort((a, b) => b.pontos - a.pontos || a.item.ordem - b.item.ordem)
    .map((a) => a.item);
}
