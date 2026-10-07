import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { IaIndisponivel } from "./client";
import { SemResposta } from "./etapas";

// Erros das etapas de IA viram respostas claras, sem vazar detalhes internos.
export function respostaDeErro(erro: unknown) {
  if (erro instanceof IaIndisponivel) {
    return NextResponse.json({ erro: "A IA ainda não está ligada neste ambiente." }, { status: 503 });
  }
  if (erro instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ erro: "Muita gente usando agora. Tente de novo em instantes." }, { status: 429 });
  }
  if (erro instanceof SemResposta) {
    return NextResponse.json({ erro: "Não deu para ler isso agora. Tente de novo." }, { status: 502 });
  }
  if (erro instanceof Anthropic.APIError) {
    console.error(`[ia] erro ${erro.status}`, erro.message);
    return NextResponse.json({ erro: "A IA não respondeu agora. Tente de novo em instantes." }, { status: 502 });
  }
  console.error("[ia] erro inesperado", erro);
  return NextResponse.json({ erro: "Algo deu errado. Tente de novo." }, { status: 500 });
}

export function muitasTentativas() {
  return NextResponse.json({ erro: "Muitas tentativas seguidas. Espere alguns minutos." }, { status: 429 });
}
