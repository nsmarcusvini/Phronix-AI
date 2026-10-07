import type { CurriculoExtraido, Diagnostico, VagaExtraida } from "@/lib/ai/esquemas";

// Exemplo rotulado do wizard e da Conversa (caminho "usar exemplo").
// Mesmo candidato fictício do kit de demonstração (pleno, back-end), no mesmo
// formato da extração real. Empresas e nomes são inventados.

const c = (valor: string, baixaConfianca = false) => ({ valor, baixaConfianca });

export const curriculoExemplo: CurriculoExtraido = {
  nome: c("Alex Souza"),
  titulo: c("Desenvolvedor back-end"),
  experiencias: [
    {
      empresa: c("Loja Exemplo"),
      cargo: c("Desenvolvedor back-end pleno"),
      periodo: c("mar/2022 – atual"),
      conquistas: [
        c("Reduzi o p95 da API de pedidos de 1,8 s para 0,8 s antes da Black Friday."),
        c("Tirei o envio de e-mails do checkout com uma fila e retry."),
        c("Conduzi o teste de carga que evitou reescrever o módulo de frete."),
      ],
    },
    {
      empresa: c("Agência Exemplo"),
      cargo: c("Desenvolvedor júnior"),
      periodo: c("2021 – 2022", true),
      conquistas: [c("Mantive APIs de sites de clientes em Node.js.")],
    },
  ],
  formacao: c("Análise e Desenvolvimento de Sistemas"),
  skills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker", "Filas"],
  idiomas: c("Inglês intermediário", true),
  certificacoes: [],
  ilegivel: false,
};

export const vagaExemplo = {
  empresa: "Empresa Exemplo",
  cargo: "Pessoa Desenvolvedora Back-end",
  texto: `Buscamos uma pessoa desenvolvedora back-end para o time de plataforma, que processa milhões de pedidos por mês.

Responsabilidades:
- Evoluir as APIs de pedidos e pagamentos em Node.js e TypeScript.
- Desenhar fluxos assíncronos com filas e eventos.
- Garantir performance e confiabilidade em picos de tráfego.
- Trabalhar com produto e operações para priorizar a dívida técnica.

Requisitos:
- Experiência com Node.js em produção.
- PostgreSQL, modelagem e otimização de consultas.
- Filas e mensageria (SQS, RabbitMQ ou similar).
- Observabilidade: métricas, logs e alertas.

Diferenciais:
- Kubernetes.
- Experiência com eventos de alto tráfego, como Black Friday.

Buscamos alguém com autonomia, boa comunicação com áreas de negócio e vontade de aprender.`,
};

export const vagaExtraida: VagaExtraida = {
  cargo: "Pessoa Desenvolvedora Back-end",
  nivelPedido: { de: "pleno", ate: "senior", texto: "Pleno a sênior" },
  obrigatorios: ["Node.js em produção", "PostgreSQL e performance", "Filas e eventos", "Observabilidade"],
  diferenciais: ["Kubernetes", "Eventos de alto tráfego"],
  responsabilidades: [],
  comportamentais: ["Autonomia", "Comunicação com negócio", "Vontade de aprender"],
  palavrasChave: [],
  sinaisCultura: [],
};

export const diagnosticoExemplo: Diagnostico = {
  nivel: "pleno",
  confianca: "alta",
  justificativa: [
    {
      texto: "Resolve sozinho problemas de performance do time, com resultado medido.",
      trecho: "Reduzi o p95 da API de pedidos de 1,8 s para 0,8 s",
    },
    {
      texto: "Escopo de projeto completo, não só de tarefas.",
      trecho: "Tirei o envio de e-mails do checkout com uma fila e retry",
    },
    {
      texto: "Começa a influenciar decisões, mas ainda dentro do próprio time.",
      trecho: "Conduzi o teste de carga que evitou reescrever o módulo de frete",
    },
  ],
  match: 78,
  fortes: [
    "Performance de API com número antes e depois",
    "Filas no caminho crítico do checkout",
    "Experiência real com pico de Black Friday",
  ],
  lacunas: ["Kubernetes", "Observabilidade descrita no currículo", "Comunicação com áreas de negócio"],
  estrategia:
    "Pleno aplicando para uma vaga pleno a sênior: priorize cases de decisão e influência, como o teste de carga do frete, e trate Kubernetes com honestidade, mostrando o que você já faz com containers.",
};

// Requisitos que a Conversa tenta cobrir com pelo menos um case.
export const requisitosConversa = [
  "Node.js em produção",
  "PostgreSQL e performance",
  "Filas e eventos",
  "Observabilidade",
  "Comunicação com negócio",
  "Kubernetes",
] as const;

export type Requisito = (typeof requisitosConversa)[number];

export type OrigemCase = "cv" | "conversa" | "estimativa";

export type CaseRascunho = {
  id: string;
  titulo: string;
  situacao: string;
  acoes: [string, string];
  resultado: string;
  requisitos: Requisito[];
  origem: OrigemCase;
};

export const casesDoCurriculo: CaseRascunho[] = [
  {
    id: "case-cv-1",
    titulo: "API de pedidos na Black Friday",
    situacao: "Picos de 5x no tráfego derrubavam o checkout.",
    acoes: ["Achei consultas N+1 e coloquei cache Redis.", "Medi o p95 por rota antes e depois."],
    resultado: "p95 de 1,8 s para 0,8 s.",
    requisitos: ["Node.js em produção", "PostgreSQL e performance"],
    origem: "cv",
  },
];

export type Turno = {
  pergunta: string;
  // Lacuna de história que a pergunta tenta cobrir.
  alvo: Requisito;
  resposta: { reconhecimento: string; case: CaseRascunho };
  semNumero?: { reconhecimento: string; case: CaseRascunho };
};

export const abertura =
  "Li seu currículo e a vaga. Dois requisitos já têm case: Node.js e PostgreSQL. Vou fazer algumas perguntas curtas para achar as histórias que faltam. Uma de cada vez.";

export const turnos: Turno[] = [
  {
    alvo: "Filas e eventos",
    pergunta:
      "Na Loja Exemplo você tirou o envio de e-mails do checkout com uma fila. A vaga fala bastante em eventos. Qual foi a decisão mais difícil nessa mudança?",
    resposta: {
      reconhecimento: "Boa. Isso mostra decisão, não só execução. Virou um case.",
      case: {
        id: "case-conversa-1",
        titulo: "Fila de e-mails fora do checkout",
        situacao: "O envio de e-mail travava a confirmação do pedido.",
        acoes: ["Publiquei um evento e movi o envio para um worker.", "Defini retry e dead letter para falhas."],
        resultado: "O checkout deixou de esperar pelo e-mail.",
        requisitos: ["Filas e eventos"],
        origem: "conversa",
      },
    },
  },
  {
    alvo: "Comunicação com negócio",
    pergunta:
      "A vaga pede boa comunicação com áreas de negócio, e não achei isso no currículo. Já precisou convencer alguém de fora do time de uma decisão técnica?",
    resposta: {
      reconhecimento: "Isso cobre um requisito que o currículo não mostrava.",
      case: {
        id: "case-conversa-2",
        titulo: "Teste de carga antes de reescrever",
        situacao: "Produto queria reescrever o frete em duas sprints.",
        acoes: ["Propus medir antes com um teste de carga.", "Mostrei o gargalo com números para produto."],
        resultado: "Refatoramos só o gargalo, em uma sprint.",
        requisitos: ["Comunicação com negócio"],
        origem: "conversa",
      },
    },
  },
  {
    alvo: "Observabilidade",
    pergunta: "Você mediu o p95 antes e depois. Como acompanhava isso no dia a dia? Painel, alerta, algum número?",
    resposta: {
      reconhecimento: "Ótimo, com número fica muito mais forte.",
      case: {
        id: "case-conversa-3",
        titulo: "Alertas de p95 por rota",
        situacao: "Ninguém percebia lentidão antes do cliente.",
        acoes: ["Criei métricas de p95 por rota.", "Configurei alertas acima de 1 s."],
        resultado: "Lentidão passou a ser vista antes do suporte.",
        requisitos: ["Observabilidade"],
        origem: "conversa",
      },
    },
    semNumero: {
      reconhecimento:
        "Sem problema. Dá para estimar com honestidade, em ordem de grandeza. Deixei o número marcado para você confirmar depois.",
      case: {
        id: "case-estimativa-3",
        titulo: "Alertas de p95 por rota",
        situacao: "Ninguém percebia lentidão antes do cliente.",
        acoes: ["Criei métricas de p95 por rota.", "Configurei alertas de lentidão."],
        resultado: "Incidentes vistos antes do suporte: [confirmar: quantos por mês].",
        requisitos: ["Observabilidade"],
        origem: "estimativa",
      },
    },
  },
  {
    alvo: "Kubernetes",
    pergunta:
      "Última lacuna: Kubernetes, que é diferencial. Não precisa inventar nada. Já rodou containers em algum ambiente, mesmo fora de produção?",
    resposta: {
      reconhecimento: "Honesto e útil. Isso vira uma resposta curta para a pergunta difícil.",
      case: {
        id: "case-conversa-4",
        titulo: "Containers no dia a dia",
        situacao: "O time rodava os serviços localmente com Docker Compose.",
        acoes: ["Mantive os arquivos de Compose do time.", "Estudei Kubernetes por conta própria."],
        resultado: "Base pronta para aprender o cluster de vocês.",
        requisitos: ["Kubernetes"],
        origem: "conversa",
      },
    },
  },
];

export const respostaSemExemplo =
  "Tudo bem. Esse requisito vira uma pergunta difícil no mapa, com uma resposta honesta.";

export const respostaPulou = "Pulamos. Se lembrar de algo depois, dá para voltar.";

export function encerramento(cobertos: number, total: number, suficiente: boolean) {
  return suficiente
    ? "Já cobrimos o suficiente para um mapa forte. O que faltou vira pergunta difícil, com resposta honesta. Quando quiser, toque em “Gerar meu mapa”."
    : `Terminei minhas perguntas. Cobrimos ${cobertos} de ${total} requisitos; o que faltou vira pergunta difícil, com resposta honesta. Dá para gerar o mapa assim, ou voltar depois com mais exemplos.`;
}
