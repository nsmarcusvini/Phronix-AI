import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { curriculoExtraido, vagaExtraida } from "@/lib/ai/esquemas";
import { diagnosticar } from "@/lib/ai/etapas";
import { dentroDoLimite } from "@/lib/ai/limite";
import { muitasTentativas, respostaDeErro } from "@/lib/ai/respostas";
import { createClient } from "@/lib/supabase/server";

const entrada = z.object({ curriculo: curriculoExtraido, vaga: vagaExtraida });

// Etapa 3: diagnóstico + match (Gemini 3.8 Flash), logo depois de cadastrar a vaga.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para ver o diagnóstico." }, { status: 401 });
  if (!dentroDoLimite(`diagnostico:${user.id}`, 10, 60 * 60_000)) return muitasTentativas();

  const corpo = entrada.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Currículo ou vaga inválidos." }, { status: 400 });

  try {
    const diagnostico = await diagnosticar(corpo.data.curriculo, corpo.data.vaga, user.id);
    return NextResponse.json({ diagnostico });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
