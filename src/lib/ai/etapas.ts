import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODELS } from "./client";
import {
  curriculoExtraido,
  diagnostico,
  limitarDiagnostico,
  vagaExtraida,
  type CurriculoExtraido,
  type Diagnostico,
  type VagaExtraida,
} from "./esquemas";
import { SISTEMA_DIAGNOSTICO, SISTEMA_EXTRAIR_CURRICULO, SISTEMA_EXTRAIR_VAGA } from "./prompts";
import { registrarUso } from "./uso";

// Etapas 1 a 3 do pipeline (PRD): extrair currículo, extrair vaga, diagnóstico.
// Saída estruturada validada com Zod e uma nova tentativa automática se falhar.

export class SemResposta extends Error {}

async function comNovaTentativa<T>(chamada: () => Promise<T | null>): Promise<T> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const resultado = await chamada();
    if (resultado !== null) return resultado;
  }
  throw new SemResposta("O modelo não devolveu uma resposta válida.");
}

export type EntradaCurriculo = { tipo: "pdf"; base64: string } | { tipo: "texto"; texto: string };

export async function extrairCurriculo(entrada: EntradaCurriculo, userId: string | null): Promise<CurriculoExtraido> {
  const conteudo: Anthropic.ContentBlockParam[] =
    entrada.tipo === "pdf"
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: entrada.base64 } },
          { type: "text", text: "Extraia os dados deste currículo." },
        ]
      : [{ type: "text", text: `Extraia os dados deste currículo.\n\n<curriculo>\n${entrada.texto}\n</curriculo>` }];

  return comNovaTentativa(async () => {
    const resposta = await anthropic().messages.parse({
      model: MODELS.extrairCurriculo,
      max_tokens: 8000,
      system: SISTEMA_EXTRAIR_CURRICULO,
      messages: [{ role: "user", content: conteudo }],
      output_config: { format: zodOutputFormat(curriculoExtraido) },
    });
    await registrarUso("extrair_curriculo", MODELS.extrairCurriculo, resposta.usage, userId);
    if (resposta.stop_reason === "refusal") return null;
    return resposta.parsed_output;
  });
}

export async function extrairVaga(texto: string, userId: string | null): Promise<VagaExtraida> {
  return comNovaTentativa(async () => {
    const resposta = await anthropic().messages.parse({
      model: MODELS.extrairVaga,
      max_tokens: 4000,
      system: SISTEMA_EXTRAIR_VAGA,
      messages: [{ role: "user", content: `Extraia os dados desta vaga.\n\n<vaga>\n${texto}\n</vaga>` }],
      output_config: { format: zodOutputFormat(vagaExtraida) },
    });
    await registrarUso("extrair_vaga", MODELS.extrairVaga, resposta.usage, userId);
    if (resposta.stop_reason === "refusal") return null;
    return resposta.parsed_output;
  });
}

export async function diagnosticar(
  curriculo: CurriculoExtraido,
  vaga: VagaExtraida,
  userId: string,
): Promise<Diagnostico> {
  return comNovaTentativa(async () => {
    // Sonnet 5.5 com fallback de recusa no servidor ("default" roteia pela categoria).
    const resposta = await anthropic().beta.messages.parse({
      model: MODELS.diagnostico,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SISTEMA_DIAGNOSTICO,
      messages: [
        {
          role: "user",
          content: `<curriculo>\n${JSON.stringify(curriculo)}\n</curriculo>\n\n<vaga>\n${JSON.stringify(vaga)}\n</vaga>`,
        },
      ],
      output_config: { effort: "medium", format: betaZodOutputFormat(diagnostico) },
    });
    await registrarUso("diagnostico", resposta.model, resposta.usage, userId);
    if (resposta.stop_reason === "refusal" || !resposta.parsed_output) return null;
    return limitarDiagnostico(resposta.parsed_output);
  });
}
