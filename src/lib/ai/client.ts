import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// A chave da API fica só no servidor: o navegador nunca fala direto com o modelo.
// Lê ANTHROPIC_API_KEY do ambiente. O cliente nasce na primeira chamada, para
// uma chave ausente virar um erro tratável (IaIndisponivel) e não quebrar o build.

export class IaIndisponivel extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY não configurada");
  }
}

let instancia: Anthropic | null = null;

export function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new IaIndisponivel();
  instancia ??= new Anthropic();
  return instancia;
}

// Modelo por etapa do pipeline. O mais forte só onde o usuário lê o resultado.
export const MODELS = {
  extrairCurriculo: "claude-haiku-4-5",
  extrairVaga: "claude-haiku-4-5",
  diagnostico: "claude-sonnet-5-5",
  garimpo: "claude-sonnet-5-5",
  mapa: "claude-sonnet-5-5",
  reescrita: "claude-haiku-4-5",
  validador: "claude-haiku-4-5",
} as const satisfies Record<string, Anthropic.Model>;

export type EtapaIA = keyof typeof MODELS;
