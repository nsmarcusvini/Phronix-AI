import mammoth from "mammoth";
import { NextResponse, type NextRequest } from "next/server";
import { extrairCurriculo, type EntradaCurriculo } from "@/lib/ai/etapas";
import { dentroDoLimite } from "@/lib/ai/limite";
import { muitasTentativas, respostaDeErro } from "@/lib/ai/respostas";
import { createClient } from "@/lib/supabase/server";

const LIMITE_BYTES = 5 * 1024 * 1024;
const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Etapa 1: extrair currículo (Gemini 3.5 Flash-Lite), no onboarding logo depois de criar a
// conta. PDF vai direto ao modelo; DOCX vira texto.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para enviar o currículo." }, { status: 401 });
  if (!dentroDoLimite(`curriculo:${user.id}`, 8, 10 * 60_000)) return muitasTentativas();

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ erro: "Envie o arquivo ou o texto do currículo." }, { status: 400 });

  let entrada: EntradaCurriculo;
  const arquivo = form.get("arquivo");
  const texto = form.get("texto");

  if (arquivo instanceof File) {
    if (arquivo.size > LIMITE_BYTES) {
      return NextResponse.json({ erro: "O arquivo passa de 5 MB." }, { status: 413 });
    }
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    if (arquivo.type === PDF) {
      entrada = { tipo: "pdf", base64: bytes.toString("base64") };
    } else if (arquivo.type === DOCX) {
      const { value } = await mammoth.extractRawText({ buffer: bytes });
      entrada = { tipo: "texto", texto: value };
    } else {
      return NextResponse.json({ erro: "Envie um PDF com texto ou um DOCX." }, { status: 415 });
    }
  } else if (typeof texto === "string" && texto.trim().length > 200) {
    entrada = { tipo: "texto", texto: texto.trim().slice(0, 60_000) };
  } else {
    return NextResponse.json({ erro: "Envie o arquivo ou cole o texto do currículo." }, { status: 400 });
  }

  try {
    const curriculo = await extrairCurriculo(entrada, user.id);
    return NextResponse.json({ curriculo });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
