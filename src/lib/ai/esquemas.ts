import { z } from "zod";

// Saídas estruturadas das etapas de IA, validadas com Zod.
// Limites de quantidade são aplicados depois no código (o formato de saída
// estruturada não garante tamanho de lista).

const campo = z.object({
  valor: z.string(),
  // true quando o modelo leu com pouca certeza (data borrada, sigla ambígua...).
  baixaConfianca: z.boolean(),
});

export const curriculoExtraido = z.object({
  nome: campo,
  titulo: campo,
  experiencias: z.array(
    z.object({
      empresa: campo,
      cargo: campo,
      periodo: campo,
      conquistas: z.array(campo),
    }),
  ),
  formacao: campo,
  skills: z.array(z.string()),
  idiomas: campo,
  certificacoes: z.array(z.string()),
  // Texto vazio ou ilegível (ex.: PDF escaneado): a tela pede para colar.
  ilegivel: z.boolean(),
});
export type CurriculoExtraido = z.infer<typeof curriculoExtraido>;

const nivel = z.enum(["junior", "pleno", "senior"]);

export const vagaExtraida = z.object({
  cargo: z.string(),
  nivelPedido: z.object({ de: nivel, ate: nivel, texto: z.string() }),
  obrigatorios: z.array(z.string()),
  diferenciais: z.array(z.string()),
  responsabilidades: z.array(z.string()),
  comportamentais: z.array(z.string()),
  palavrasChave: z.array(z.string()),
  sinaisCultura: z.array(z.string()),
});
export type VagaExtraida = z.infer<typeof vagaExtraida>;

export const diagnostico = z.object({
  nivel,
  confianca: z.enum(["alta", "media", "baixa"]),
  justificativa: z.array(z.object({ texto: z.string(), trecho: z.string() })),
  match: z.number().int(),
  fortes: z.array(z.string()),
  lacunas: z.array(z.string()),
  estrategia: z.string(),
});
export type Diagnostico = z.infer<typeof diagnostico>;

// Aplica os limites do PRD depois da validação.
export function limitarDiagnostico(d: Diagnostico): Diagnostico {
  return {
    ...d,
    justificativa: d.justificativa.slice(0, 3),
    match: Math.min(100, Math.max(0, d.match)),
    fortes: d.fortes.slice(0, 3),
    lacunas: d.lacunas.slice(0, 3),
  };
}

// Etapa 4: case registrado pela conversa (ferramenta "registrar_case").
export const caseRegistrado = z.object({
  titulo: z.string(),
  situacao: z.string(),
  acoes: z.array(z.string()),
  resultado: z.string(),
  metrica: z.string().nullable(),
  requisitos: z.array(z.string()),
  origem: z.enum(["cv", "conversa", "estimativa"]),
});
export type CaseRegistrado = z.infer<typeof caseRegistrado>;

// Etapa 5: o mapa de perguntas e respostas.
export const categoriaMapa = z.enum([
  "abertura",
  "motivacao_fit",
  "experiencia_cases",
  "competencias_tecnicas",
  "perguntas_dificeis",
  "perguntas_entrevistador",
]);

export const mapaGerado = z.object({
  itens: z.array(
    z.object({
      categoria: categoriaMapa,
      pergunta: z.string(),
      // Perguntas para o entrevistador não têm gancho nem âncoras.
      gancho: z.string().nullable(),
      bullets: z.array(z.string()),
      ancoras: z.array(z.string()),
      numero_impacto: z.string().nullable(),
      expandida: z.string().nullable(),
      // Título exato do case que sustenta a resposta, quando houver.
      case_titulo: z.string().nullable(),
    }),
  ),
});
export type MapaGerado = z.infer<typeof mapaGerado>;

// Reescrita de uma resposta do mapa pelos botões do editor.
export const acaoReescrita = z.enum(["curto", "natural", "tecnico", "regerar"]);
export type AcaoReescrita = z.infer<typeof acaoReescrita>;

export const respostaReescrita = z.object({
  gancho: z.string(),
  bullets: z.array(z.string()),
  ancoras: z.array(z.string()),
  numero_impacto: z.string().nullable(),
  expandida: z.string().nullable(),
});
export type RespostaReescrita = z.infer<typeof respostaReescrita>;
