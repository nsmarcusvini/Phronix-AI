import "server-only";
import { FinishReason, ThinkingLevel, type Part } from "@google/genai";
import { z } from "zod";
import { gemini } from "./client";
import { usoDe, type Uso } from "./uso";

// Saída estruturada: o esquema Zod vira JSON Schema para o Gemini e a
// resposta volta validada pelo mesmo Zod. Devolve null quando o modelo
// recusa, corta ou devolve algo fora do esquema; quem chama decide se tenta de novo.

export type Pensamento = "minimo" | "baixo" | "medio" | "alto";

const NIVEL: Record<Pensamento, ThinkingLevel> = {
  minimo: ThinkingLevel.MINIMAL,
  baixo: ThinkingLevel.LOW,
  medio: ThinkingLevel.MEDIUM,
  alto: ThinkingLevel.HIGH,
};

export function esquemaJson(esquema: z.ZodType) {
  // O Gemini aceita um subconjunto do JSON Schema; o "$schema" fica de fora.
  const json = z.toJSONSchema(esquema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export function nivelDePensamento(pensamento: Pensamento) {
  return { thinkingLevel: NIVEL[pensamento] };
}

export async function gerarJson<T>({
  modelo,
  sistema,
  partes,
  esquema,
  maxTokens,
  pensamento = "baixo",
}: {
  modelo: string;
  sistema: string;
  partes: Part[];
  esquema: z.ZodType<T>;
  maxTokens: number;
  pensamento?: Pensamento;
}): Promise<{ dados: T | null; uso: Uso }> {
  const resposta = await gemini().models.generateContent({
    model: modelo,
    contents: [{ role: "user", parts: partes }],
    config: {
      systemInstruction: sistema,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
      responseJsonSchema: esquemaJson(esquema),
      thinkingConfig: nivelDePensamento(pensamento),
    },
  });
  const uso = usoDe(resposta.usageMetadata);
  const fim = resposta.candidates?.[0]?.finishReason;
  if (fim !== FinishReason.STOP || !resposta.text) return { dados: null, uso };

  try {
    const valido = esquema.safeParse(JSON.parse(resposta.text));
    return { dados: valido.success ? valido.data : null, uso };
  } catch {
    return { dados: null, uso };
  }
}
