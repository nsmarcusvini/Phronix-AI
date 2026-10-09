const HORA = 3_600_000;

export function quando(data: Date | null, agora: Date) {
  if (!data || data <= agora) return "revisar agora";
  const horas = (data.getTime() - agora.getTime()) / HORA;
  if (horas < 1) return "em menos de 1 h";
  if (horas < 24) return `em ${Math.round(horas)} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "amanhã" : `em ${dias} dias`;
}

export function entrevistaEm(dias: number | null) {
  if (dias === null) return "sem data";
  if (dias < 0) return "já passou";
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

export function nomeCaixa(caixa: number) {
  return caixa === 5 ? "Palco" : `caixa ${caixa}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "aaaa-mm-dd" como data local (new Date("2026-10-12") seria meia-noite UTC,
// que no Brasil ainda é o dia anterior).
export function dataLocal(data: string) {
  const [a, m, d] = data.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
}

// "12 out", ou "12 out 2027" fora do ano corrente.
export function dataCurta(data: Date, agora = new Date()) {
  const base = `${data.getDate()} ${MESES[data.getMonth()]}`;
  return data.getFullYear() === agora.getFullYear() ? base : `${base} ${data.getFullYear()}`;
}
