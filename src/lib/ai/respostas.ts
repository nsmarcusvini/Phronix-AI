import "server-only";
import { ApiError } from "@google/genai";
import { NextResponse } from "next/server";
import { IaIndisponivel } from "./client";
import { SemResposta } from "./etapas";

// Mensagem para o usuário a partir de um erro de IA, sem vazar detalhes internos.
export function mensagemDeErro(erro: unknown): { texto: string; status: number } {
  if (erro instanceof IaIndisponivel) {
    return { texto: "A IA ainda não está ligada neste ambiente.", status: 503 };
  }
  if (erro instanceof SemResposta) {
    return { texto: "Não deu para ler isso agora. Tente de novo.", status: 502 };
  }
  if (erro instanceof ApiError) {
    console.error(`[ia] erro ${erro.status}`, erro.message);
    if (erro.status === 429) {
      return { texto: "Muita gente usando agora. Tente de novo em instantes.", status: 429 };
    }
    // Chave inválida, sem permissão ou créditos esgotados (402): problema de configuração.
    if ([400, 401, 402, 403].includes(erro.status)) {
      return { texto: "A IA está indisponível agora. Avise o suporte.", status: 503 };
    }
    return { texto: "A IA não respondeu agora. Tente de novo em instantes.", status: 502 };
  }
  console.error("[ia] erro inesperado", erro);
  return { texto: "Algo deu errado. Tente de novo.", status: 500 };
}

export function respostaDeErro(erro: unknown) {
  const { texto, status } = mensagemDeErro(erro);
  return NextResponse.json({ erro: texto }, { status });
}

export function muitasTentativas() {
  return NextResponse.json({ erro: "Muitas tentativas seguidas. Espere alguns minutos." }, { status: 429 });
}
