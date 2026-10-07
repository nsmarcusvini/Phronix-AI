import type { Categoria, Nivel, TipoEntrevista } from "@/lib/domain";

// Ordem do mapa e atalhos 1 a 6 da Hora do Show.
export const CATEGORIAS: readonly { id: Categoria; nome: string }[] = [
  { id: "abertura", nome: "Abertura" },
  { id: "motivacao_fit", nome: "Motivação e fit" },
  { id: "experiencia_cases", nome: "Experiência e cases" },
  { id: "competencias_tecnicas", nome: "Competências técnicas" },
  { id: "perguntas_dificeis", nome: "Perguntas difíceis" },
  { id: "perguntas_entrevistador", nome: "Perguntas para o entrevistador" },
];

export const NOME_TIPO: Record<TipoEntrevista, string> = {
  rh: "Entrevista de RH",
  tecnica: "Entrevista técnica",
  lideranca: "Entrevista de liderança",
};

export const NOME_NIVEL: Record<Nivel, string> = {
  junior: "júnior",
  pleno: "pleno",
  senior: "sênior",
};
