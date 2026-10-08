import "server-only";
import type { Part } from "@google/genai";
import { MODELS } from "./client";
import {
  curriculoExtraido,
  diagnostico,
  limitarDiagnostico,
  vagaExtraida,
  type CurriculoExtraido,
  type Diagnostico,
  type VagaExtraida,
} from "./esquemas";
import { gerarJson } from "./estruturado";
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
  const partes: Part[] =
    entrada.tipo === "pdf"
      ? [{ inlineData: { mimeType: "application/pdf", data: entrada.base64 } }, { text: "Extraia os dados deste currículo." }]
      : [{ text: `Extraia os dados deste currículo.\n\n<curriculo>\n${entrada.texto}\n</curriculo>` }];

  return comNovaTentativa(async () => {
    const { dados, uso } = await gerarJson({
      modelo: MODELS.extrairCurriculo,
      sistema: SISTEMA_EXTRAIR_CURRICULO,
      partes,
      esquema: curriculoExtraido,
      maxTokens: 8000,
      pensamento: "minimo",
    });
    await registrarUso("extrair_curriculo", MODELS.extrairCurriculo, uso, userId);
    return dados;
  });
}

export async function extrairVaga(texto: string, userId: string | null): Promise<VagaExtraida> {
  return comNovaTentativa(async () => {
    const { dados, uso } = await gerarJson({
      modelo: MODELS.extrairVaga,
      sistema: SISTEMA_EXTRAIR_VAGA,
      partes: [{ text: `Extraia os dados desta vaga.\n\n<vaga>\n${texto}\n</vaga>` }],
      esquema: vagaExtraida,
      maxTokens: 4000,
      pensamento: "minimo",
    });
    await registrarUso("extrair_vaga", MODELS.extrairVaga, uso, userId);
    return dados;
  });
}

export async function diagnosticar(
  curriculo: CurriculoExtraido,
  vaga: VagaExtraida,
  userId: string,
): Promise<Diagnostico> {
  return comNovaTentativa(async () => {
    const { dados, uso } = await gerarJson({
      modelo: MODELS.diagnostico,
      sistema: SISTEMA_DIAGNOSTICO,
      partes: [
        {
          text: `<curriculo>\n${JSON.stringify(curriculo)}\n</curriculo>\n\n<vaga>\n${JSON.stringify(vaga)}\n</vaga>`,
        },
      ],
      esquema: diagnostico,
      maxTokens: 16000,
      pensamento: "medio",
    });
    await registrarUso("diagnostico", MODELS.diagnostico, uso, userId);
    return dados ? limitarDiagnostico(dados) : null;
  });
}
