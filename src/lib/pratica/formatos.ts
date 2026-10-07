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
