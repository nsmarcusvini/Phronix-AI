// Planos do PRD. O texto de "inclui" é literal; os preços são de teste do beta
// (ponto médio das faixas-hipótese do PRD). Troque aqui quando forem definidos.

export type PlanoId = "gratis" | "avulso" | "pro_mensal" | "pro_trimestral";

export const PLANOS: readonly {
  id: PlanoId;
  nome: string;
  inclui: string;
  preco: string;
  periodo?: string;
  nota?: string;
}[] = [
  { id: "gratis", nome: "Grátis", inclui: "1 kit com até 8 perguntas, prática básica, Hora do Show", preco: "R$ 0" },
  {
    id: "avulso",
    nome: "Kit avulso",
    inclui: "1 kit completo (RH, técnica ou liderança), válido por 30 dias",
    preco: "R$ 24",
  },
  {
    id: "pro_mensal",
    nome: "Pro mensal",
    inclui: "kits ilimitados com uso justo, todos os exercícios, ensaio geral",
    preco: "R$ 49",
    periodo: "/mês",
  },
  {
    id: "pro_trimestral",
    nome: "Pro trimestral",
    inclui: "igual ao Pro mensal",
    preco: "R$ 110",
    periodo: "/trimestre",
    nota: "~25% de desconto",
  },
];

export const VALIDADE_AVULSO_DIAS = 30;
