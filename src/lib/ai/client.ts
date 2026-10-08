import "server-only";
import { GoogleGenAI } from "@google/genai";

// A chave da API fica só no servidor: o navegador nunca fala direto com o modelo.
// Lê GEMINI_API_KEY do ambiente. O cliente nasce na primeira chamada, para
// uma chave ausente virar um erro tratável (IaIndisponivel) e não quebrar o build.

export class IaIndisponivel extends Error {
  constructor() {
    super("GEMINI_API_KEY não configurada");
  }
}

let instancia: GoogleGenAI | null = null;

export function gemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new IaIndisponivel();
  instancia ??= new GoogleGenAI({ apiKey });
  return instancia;
}

// Modelo por etapa do pipeline. O mais forte só onde o usuário lê o resultado.
// gemini-3.8-flash é o Flash estável mais capaz (o Pro da geração 3 ainda é
// preview); o 3.5 Flash-Lite cuida de extração e reescrita.
export const MODELS = {
  extrairCurriculo: "gemini-3.5-flash-lite",
  extrairVaga: "gemini-3.5-flash-lite",
  diagnostico: "gemini-3.8-flash",
  garimpo: "gemini-3.8-flash",
  mapa: "gemini-3.8-flash",
  reescrita: "gemini-3.5-flash-lite",
  validador: "gemini-3.5-flash-lite",
} as const;

export type EtapaIA = keyof typeof MODELS;
