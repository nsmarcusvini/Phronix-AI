import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// A chave da API fica só no servidor: o navegador nunca fala direto com o modelo.
// Lê ANTHROPIC_API_KEY do ambiente.
export const anthropic = new Anthropic();

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
