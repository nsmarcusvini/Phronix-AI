import type { Categoria, Kit, QaItem } from "@/lib/domain";
import { localDb } from "@/lib/local-db";

// Kit de demonstração da Hora do Show (/hora-do-show/demo).
// A resposta "problema difícil" é o exemplo do PRD, literal; as demais são
// exemplos fictícios do mesmo candidato (pleno, back-end, entrevista técnica).
// Nunca usar como copy de produto.

export const DEMO_KIT_ID = "00000000-0000-4000-8000-00000000de30";

const AGORA = "2026-10-07T12:00:00.000Z";

export const demoKit: Kit = {
  id: DEMO_KIT_ID,
  user_id: "00000000-0000-4000-8000-000000000001",
  resume_id: "00000000-0000-4000-8000-000000000002",
  job_id: "00000000-0000-4000-8000-000000000003",
  tipo: "tecnica",
  nivel: "pleno",
  nivel_confianca: "alta",
  nivel_ajustado: false,
  match_score: 78,
  data_entrevista: null,
  status: "pronto",
  acesso: "gratis",
  acesso_expira_em: null,
  updated_at: AGORA,
};

type Rascunho = {
  categoria: Categoria;
  pergunta: string;
  gancho?: string;
  bullets?: string[];
  ancoras?: string[];
  expandida?: string;
  numero?: string;
  fixado?: boolean;
};

const rascunhos: Rascunho[] = [
  {
    categoria: "abertura",
    fixado: true,
    pergunta: "Fale sobre você.",
    gancho: "Sou dev back-end há 4 anos e gosto de problema de escala.",
    bullets: [
      "Comecei em agência e fui para e-commerce em 2022.",
      "Hoje cuido da API de pedidos e do checkout.",
      "Último marco: Black Friday sem nenhuma queda.",
    ],
    ancoras: ["agência", "checkout", "Black Friday"],
  },
  {
    categoria: "motivacao_fit",
    fixado: true,
    pergunta: "Qual sua pretensão salarial?",
    gancho: "Busco algo em torno de [confirmar: valor], no regime CLT.",
    bullets: [
      "Olho o pacote inteiro, não só o salário.",
      "Tenho flexibilidade para ajustar ao modelo de vocês.",
    ],
    ancoras: ["pacote", "CLT", "flexível"],
  },
  {
    categoria: "motivacao_fit",
    pergunta: "Por que sair da empresa atual?",
    gancho: "Quero escala maior e um time de plataforma de verdade.",
    bullets: [
      "Aprendi muito, mas o produto parou de crescer.",
      "A vaga fala em milhões de pedidos por mês.",
      "É o próximo passo natural para mim.",
    ],
    ancoras: ["escala", "plataforma", "próximo passo"],
  },
  {
    categoria: "motivacao_fit",
    pergunta: "Por que esta empresa?",
    gancho: "Vocês resolvem o problema que eu mais gosto: pico de tráfego.",
    bullets: [
      "Li sobre a migração de vocês para eventos.",
      "Já fiz algo parecido com filas no checkout.",
      "Quero aprender com um time maior que o meu.",
    ],
    ancoras: ["pico", "eventos", "filas"],
  },
  {
    categoria: "experiencia_cases",
    pergunta: "Conte sobre um problema difícil que você resolveu.",
    gancho:
      "Cortei mais da metade do tempo de resposta da API de pedidos, que derrubava o checkout na Black Friday.",
    bullets: [
      "Picos de 5x no tráfego e timeouts no pagamento.",
      "Achei consultas N+1, coloquei cache Redis e mandei os e-mails para uma fila.",
      "p95 de 1,8 s para 0,8 s e zero queda no evento seguinte.",
    ],
    ancoras: ["N+1", "Redis", "fila"],
    numero: "1,8 s → 0,8 s",
    expandida:
      "Na Black Friday o tráfego subia 5x e o pagamento dava timeout. Medi por rota e vi que a listagem de pedidos fazia uma consulta por item. Juntei tudo numa query, pus cache Redis nos dados de catálogo e tirei o envio de e-mail do caminho do pedido, mandando para uma fila. O p95 caiu de 1,8 s para 0,8 s e o evento seguinte passou sem queda. É o tipo de problema de escala que vi na descrição de vocês.",
  },
  {
    categoria: "experiencia_cases",
    pergunta: "Conte sobre um conflito no time.",
    gancho: "Discordei do tech lead sobre reescrever o módulo de frete.",
    bullets: [
      "Ele queria reescrever do zero em duas sprints.",
      "Propus medir antes e montei um teste de carga.",
      "Refatoramos só o gargalo e entregamos em uma sprint.",
    ],
    ancoras: ["frete", "medir", "uma sprint"],
    numero: "2 → 1 sprint",
  },
  {
    categoria: "experiencia_cases",
    pergunta: "Fale de um erro seu.",
    gancho: "Subi uma migração que travou a tabela de pedidos por 4 minutos.",
    bullets: [
      "Era sexta à tarde, sem janela de manutenção.",
      "Reverti, avisei o time e escrevi o pós-mortem.",
      "Criamos um checklist de migração com lock curto.",
    ],
    ancoras: ["lock", "pós-mortem", "checklist"],
    numero: "4 min",
  },
  {
    categoria: "competencias_tecnicas",
    pergunta: "Como você desenharia uma fila de e-mails?",
    gancho: "Fila com retry exponencial e uma dead letter para o que falhar.",
    bullets: [
      "O pedido só publica um evento e segue.",
      "Um worker consome, com idempotência por ID.",
      "Falhou 5 vezes, vai para a DLQ e gera alerta.",
    ],
    ancoras: ["evento", "idempotência", "DLQ"],
  },
  {
    categoria: "competencias_tecnicas",
    pergunta: "Como usar cache sem servir dado velho?",
    gancho: "Cache curto, invalidado por evento, e nunca no preço final.",
    bullets: [
      "Catálogo aguenta TTL de minutos.",
      "Mudou o produto, um evento limpa a chave.",
      "Preço e estoque sempre vêm do banco no checkout.",
    ],
    ancoras: ["TTL", "invalidação", "preço"],
  },
  {
    categoria: "competencias_tecnicas",
    pergunta: "Como você investiga uma API lenta?",
    gancho: "Começo pelo p95 por rota, nunca pela média.",
    bullets: [
      "Abro o trace da rota mais lenta.",
      "Quase sempre é banco: N+1 ou índice faltando.",
      "Corrijo um gargalo por vez e meço de novo.",
    ],
    ancoras: ["p95", "trace", "índice"],
  },
  {
    categoria: "perguntas_dificeis",
    pergunta: "A vaga pede Kubernetes. Você não tem experiência?",
    gancho: "Não usei em produção, mas conheço os conceitos e aprendo rápido.",
    bullets: [
      "Uso containers com Docker Compose no dia a dia.",
      "Fiz o curso [confirmar: nome do curso] no último mês.",
      "Aprendi Redis em uma semana para a Black Friday.",
    ],
    ancoras: ["Docker", "curso", "uma semana"],
  },
  {
    categoria: "perguntas_dificeis",
    pergunta: "Qual sua maior fraqueza?",
    gancho: "Demoro para delegar quando o prazo aperta.",
    bullets: [
      "Na Black Friday, segurei tarefas demais.",
      "Hoje divido o trabalho no planejamento, não na crise.",
    ],
    ancoras: ["delegar", "planejamento"],
  },
  {
    categoria: "perguntas_entrevistador",
    fixado: true,
    pergunta: "Como é um dia de pico para o time de plataforma?",
    bullets: ["Mostra se o time apaga incêndio ou se prepara antes."],
  },
  {
    categoria: "perguntas_entrevistador",
    pergunta: "O que faria alguém ir muito bem nos primeiros 90 dias?",
    bullets: ["Deixa claro o que eles esperam de um pleno."],
  },
  {
    categoria: "perguntas_entrevistador",
    pergunta: "Como vocês decidem entre dívida técnica e feature?",
    bullets: ["Revela quanto espaço existe para melhorar a base."],
  },
];

export const demoItens: QaItem[] = rascunhos.map((r, i) => ({
  id: `00000000-0000-4000-8000-0000000d${String(i + 1).padStart(4, "0")}`,
  kit_id: DEMO_KIT_ID,
  categoria: r.categoria,
  pergunta: r.pergunta,
  gancho: r.gancho ?? null,
  bullets: r.bullets ?? [],
  ancoras: r.ancoras ?? [],
  expandida: r.expandida ?? null,
  numero_impacto: r.numero ?? null,
  case_id: null,
  ordem: i + 1,
  fixado: r.fixado ?? false,
  pendente_confirmacao: /\[confirmar:/.test(
    [r.gancho, ...(r.bullets ?? [])].join(" "),
  ),
  updated_at: AGORA,
}));

export async function semearDemo() {
  await localDb.transaction("rw", localDb.kits, localDb.qaItems, async () => {
    await localDb.kits.put(demoKit);
    await localDb.qaItems.bulkPut(demoItens);
  });
}
