import { NextResponse, type NextRequest } from "next/server";
import { extrairVaga } from "@/lib/ai/etapas";
import { dentroDoLimite } from "@/lib/ai/limite";
import { muitasTentativas, respostaDeErro } from "@/lib/ai/respostas";
import { createClient } from "@/lib/supabase/server";

const MINIMO = 300;

// Etapa 2: extrair vaga (Gemini 3.5 Flash-Lite), quando a pessoa cadastra uma vaga no painel.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para cadastrar a vaga." }, { status: 401 });
  if (!dentroDoLimite(`vaga:${user.id}`, 12, 10 * 60_000)) return muitasTentativas();

  const corpo = await request.json().catch(() => null);
  const texto = typeof corpo?.texto === "string" ? corpo.texto.trim() : "";
  if (texto.length < MINIMO) {
    return NextResponse.json({ erro: "Cole a descrição completa da vaga." }, { status: 400 });
  }

  try {
    const vaga = await extrairVaga(texto.slice(0, 30_000), user.id);
    return NextResponse.json({ vaga });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
