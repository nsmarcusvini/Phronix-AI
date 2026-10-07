import type { QaItem, Review } from "@/lib/domain";
import { temLacunas } from "./lacunas";

// Motor da Prática: Leitner de 5 caixas, sem IA.
// Caixa 1 é onde toda resposta começa (e para onde volta quando você erra);
// caixa 5 é o Palco. "Pronto para o show" = respostas no Palco.

export const CAIXAS = 5;
export const PALCO = 5;
export const TAMANHO_SESSAO = 6;

export type Nota = Review["nota"];
export type Exercicio = Review["exercicio"];

// Intervalo até a próxima revisão, em dias, ao entrar em cada caixa.
const BASE_DIAS = [0, 1, 2, 4, 7];
const DIA = 86_400_000;
const MINIMO = 30 * 60_000;

export type EstadoItem = {
  item: QaItem;
  caixa: number;
  proxima: Date | null;
  revisoes: number;
  // Erros seguidos nas últimas revisões; 2 ou mais sugere encurtar no Mapa.
  errosSeguidos: number;
};

// Perguntas para o entrevistador não têm resposta a decorar.
export function praticaveis(itens: QaItem[]) {
  return itens.filter((i) => i.gancho !== null);
}

export function estados(itens: QaItem[], reviews: Review[]): EstadoItem[] {
  const porItem = new Map<string, Review[]>();
  for (const r of reviews) {
    const lista = porItem.get(r.qa_item_id) ?? [];
    lista.push(r);
    porItem.set(r.qa_item_id, lista);
  }

  return praticaveis(itens).map((item) => {
    const historico = (porItem.get(item.id) ?? []).sort((a, b) =>
      a.revisado_em.localeCompare(b.revisado_em),
    );
    const ultima = historico.at(-1);
    let errosSeguidos = 0;
    for (let i = historico.length - 1; i >= 0 && historico[i].nota === "errei"; i--) {
      errosSeguidos++;
    }
    return {
      item,
      caixa: ultima?.caixa ?? 1,
      proxima: ultima ? new Date(ultima.proxima_revisao) : null,
      revisoes: historico.length,
      errosSeguidos,
    };
  });
}

export function aplicarNota(caixa: number, nota: Nota) {
  if (nota === "acertei") return Math.min(CAIXAS, caixa + 1);
  if (nota === "errei") return 1;
  return caixa;
}

// Com a data da entrevista, o calendário é comprimido até ela:
// entrevista em 3 dias significa revisões em horas, não em semanas.
export function fatorCompressao(dias: number | null) {
  if (dias === null) return 1;
  return Math.min(1, Math.max(0.05, dias / 14));
}

export function proximaRevisao(caixa: number, dias: number | null, agora: Date) {
  const intervalo = BASE_DIAS[caixa - 1] * DIA * fatorCompressao(dias);
  return new Date(agora.getTime() + (caixa === 1 ? 0 : Math.max(MINIMO, intervalo)));
}

export function pendentes(lista: EstadoItem[], agora: Date) {
  return lista
    .filter((e) => e.proxima === null || e.proxima <= agora)
    .sort((a, b) => a.caixa - b.caixa || a.item.ordem - b.item.ordem);
}

export function escolherExercicio(e: EstadoItem, dias: number | null): Exercicio {
  if (dias !== null && dias <= 1) return "relampago";
  if (e.caixa >= 3 && temLacunas(e.item)) return "lacunas";
  if (e.caixa >= 2 && e.item.ancoras.length > 0) return "ancoras";
  return "flashcard";
}

export function diasAte(data: string | null, agora: Date) {
  if (!data) return null;
  const [ano, mes, dia] = data.split("-").map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((alvo.getTime() - hoje.getTime()) / DIA);
}

function diaLocal(data: Date) {
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
}

// Dias seguidos com pelo menos uma revisão, contando até hoje ou ontem.
export function sequencia(reviews: Review[], agora: Date) {
  const dias = new Set(reviews.map((r) => diaLocal(new Date(r.revisado_em))));
  const cursor = new Date(agora);
  if (!dias.has(diaLocal(cursor))) cursor.setDate(cursor.getDate() - 1);
  let total = 0;
  while (dias.has(diaLocal(cursor))) {
    total++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
}

export function revisoesDeHoje(reviews: Review[], agora: Date) {
  const hoje = diaLocal(agora);
  return reviews.filter((r) => diaLocal(new Date(r.revisado_em)) === hoje).length;
}

export function embaralhar<T>(lista: T[]) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
