import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { MODELS } from "@/lib/ai/client";
import { carregarContexto, sistemaComContexto } from "@/lib/ai/contexto";
import { acaoReescrita, respostaReescrita } from "@/lib/ai/esquemas";
import { gerarJson } from "@/lib/ai/estruturado";
import { dentroDoLimite } from "@/lib/ai/limite";
import { SISTEMA_REESCRITA } from "@/lib/ai/prompts";
import { muitasTentativas, respostaDeErro } from "@/lib/ai/respostas";
import { registrarUso } from "@/lib/ai/uso";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// O texto vem do aparelho, porque a edição local pode ainda não ter sincronizado.
const entrada = z.object({
  kitId: z.uuid(),
  qaItemId: z.uuid(),
  acao: acaoReescrita,
  atual: z.object({
    gancho: z.string().max(2000),
    bullets: z.array(z.string().max(2000)).max(3),
    ancoras: z.array(z.string().max(200)).max(3),
    numero_impacto: z.string().max(200).nullable(),
    expandida: z.string().max(4000).nullable(),
  }),
});

const PEDIDO = {
  curto: "Deixe mais curta.",
  natural: "Deixe mais natural, com cara de fala.",
  tecnico: "Deixe mais técnica.",
  regerar: "Escreva uma versão nova.",
} as const;

// Botões "Mais curto", "Mais natural", "Mais técnico" e "Regerar" do editor
// do mapa (Gemini 3.5 Flash-Lite). Devolve a nova versão; quem grava é o aparelho, pelo
// mesmo caminho de qualquer edição.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para reescrever." }, { status: 401 });
  if (!dentroDoLimite(`reescrita:${user.id}`, 30, 60 * 60_000)) return muitasTentativas();

  const corpo = entrada.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const { kitId, qaItemId, acao, atual } = corpo.data;

  // O RLS só devolve respostas do dono e não bloqueadas.
  const { data: item } = await supabase
    .from("qa_items")
    .select("id, categoria, pergunta, gancho, case_id")
    .eq("id", qaItemId)
    .eq("kit_id", kitId)
    .maybeSingle();
  if (!item) return NextResponse.json({ erro: "Resposta não encontrada." }, { status: 404 });
  if (item.gancho === null) {
    return NextResponse.json({ erro: "Perguntas para o entrevistador não têm resposta para reescrever." }, { status: 400 });
  }

  const ctx = await carregarContexto(supabase, kitId);
  if (!ctx) return NextResponse.json({ erro: "Kit não encontrado." }, { status: 404 });

  const { data: origem } = item.case_id
    ? await supabase
        .from("cases")
        .select("titulo, situacao, acoes, resultado, metrica, origem")
        .eq("id", item.case_id)
        .maybeSingle()
    : { data: null };

  try {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const { dados: nova, uso } = await gerarJson({
        modelo: MODELS.reescrita,
        sistema: sistemaComContexto(SISTEMA_REESCRITA, ctx),
        esquema: respostaReescrita,
        maxTokens: 2000,
        pensamento: "baixo",
        partes: [
          {
            text: [
              `<categoria>${item.categoria}</categoria>`,
              `<pergunta>${item.pergunta}</pergunta>`,
              `<case>\n${JSON.stringify(origem)}\n</case>`,
              `<resposta_atual>\n${JSON.stringify(atual)}\n</resposta_atual>`,
              `Pedido: ${acao}. ${PEDIDO[acao]}`,
            ].join("\n\n"),
          },
        ],
      });
      await registrarUso("reescrita", MODELS.reescrita, uso, user.id, kitId);
      if (nova && nova.gancho.trim()) {
        return NextResponse.json({
          gancho: nova.gancho,
          bullets: nova.bullets.slice(0, 3),
          ancoras: nova.ancoras.slice(0, 3),
          numero_impacto: nova.numero_impacto || null,
          expandida: nova.expandida || null,
        });
      }
    }
    return NextResponse.json({ erro: "A reescrita não saiu agora. Tente de novo." }, { status: 502 });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
