import { z } from "zod";

// Tipos centrais do kit. Nomes de campo seguem as colunas do Postgres
// para que Supabase e Dexie usem o mesmo formato, sem camada de mapeamento.

export const tipoEntrevista = z.enum(["rh", "tecnica", "lideranca"]);
export type TipoEntrevista = z.infer<typeof tipoEntrevista>;

export const nivel = z.enum(["junior", "pleno", "senior"]);
export type Nivel = z.infer<typeof nivel>;

export const confianca = z.enum(["alta", "media", "baixa"]);

export const categoria = z.enum([
  "abertura",
  "motivacao_fit",
  "experiencia_cases",
  "competencias_tecnicas",
  "perguntas_dificeis",
  "perguntas_entrevistador",
]);
export type Categoria = z.infer<typeof categoria>;

export const origemCase = z.enum(["cv", "conversa", "estimativa"]);

export const kit = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  resume_id: z.uuid(),
  job_id: z.uuid(),
  tipo: tipoEntrevista,
  nivel: nivel.nullable(),
  nivel_confianca: confianca.nullable(),
  match_score: z.number().int().min(0).max(100).nullable(),
  data_entrevista: z.iso.date().nullable(),
  status: z.string(),
  updated_at: z.iso.datetime(),
});
export type Kit = z.infer<typeof kit>;

export const qaItem = z.object({
  id: z.uuid(),
  kit_id: z.uuid(),
  categoria,
  pergunta: z.string(),
  gancho: z.string(),
  bullets: z.array(z.string()).length(3),
  ancoras: z.array(z.string()).length(3),
  expandida: z.string().nullable(),
  case_id: z.uuid().nullable(),
  ordem: z.number().int(),
  fixado: z.boolean(),
  pendente_confirmacao: z.boolean(),
  updated_at: z.iso.datetime(),
});
export type QaItem = z.infer<typeof qaItem>;

export const exercicio = z.enum([
  "flashcard",
  "ancoras",
  "lacunas",
  "ordenar",
  "relampago",
  "ensaio_geral",
]);

export const review = z.object({
  id: z.uuid(),
  qa_item_id: z.uuid(),
  exercicio,
  nota: z.enum(["errei", "quase", "acertei"]),
  // Sistema Leitner de 5 caixas.
  caixa: z.number().int().min(1).max(5),
  proxima_revisao: z.iso.datetime(),
  revisado_em: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});
export type Review = z.infer<typeof review>;
