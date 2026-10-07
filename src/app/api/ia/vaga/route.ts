import { NextResponse, type NextRequest } from "next/server";
import { extrairVaga } from "@/lib/ai/etapas";
import { dentroDoLimite, ipDe } from "@/lib/ai/limite";
import { muitasTentativas, respostaDeErro } from "@/lib/ai/respostas";
import { createClient } from "@/lib/supabase/server";

const MINIMO = 300;

// Etapa 2: extrair vaga (Haiku 4.5). Aberta antes do login; limite por IP.
export async function POST(request: NextRequest) {
  if (!dentroDoLimite(`vaga:${ipDe(request)}`, 12, 10 * 60_000)) return muitasTentativas();

  const corpo = await request.json().catch(() => null);
  const texto = typeof corpo?.texto === "string" ? corpo.texto.trim() : "";
  if (texto.length < MINIMO) {
    return NextResponse.json({ erro: "Cole a descrição completa da vaga." }, { status: 400 });
  }

  const supabase = await createClient().catch(() => null);
  const userId = (await supabase?.auth.getUser())?.data.user?.id ?? null;

  try {
    const vaga = await extrairVaga(texto.slice(0, 30_000), userId);
    return NextResponse.json({ vaga });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
