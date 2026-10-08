import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { anthropic, MODELS } from "@/lib/ai/client";
import { carregarContexto, sistemaComContexto } from "@/lib/ai/contexto";
import { categoriaMapa, mapaGerado } from "@/lib/ai/esquemas";
import { dentroDoLimite } from "@/lib/ai/limite";
import { SISTEMA_MAPA } from "@/lib/ai/prompts";
import { muitasTentativas, respostaDeErro } from "@/lib/ai/respostas";
import { registrarUso } from "@/lib/ai/uso";
import { ABERTAS_NO_GRATIS } from "@/lib/mapa/bloqueio";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

const entrada = z.object({ kitId: z.uuid() });
const ORDEM = categoriaMapa.options;

// Etapa 5: gera o mapa (Sonnet 5.5) a partir do contexto e dos cases.
// Grava em qa_items; no plano grátis, além das 8 primeiras, as respostas
// entram bloqueadas (o RLS esconde até o pagamento).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para gerar o mapa." }, { status: 401 });
  if (!dentroDoLimite(`mapa:${user.id}`, 5, 60 * 60_000)) return muitasTentativas();

  const corpo = entrada.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Kit inválido." }, { status: 400 });
  const { kitId } = corpo.data;

  const ctx = await carregarContexto(supabase, kitId);
  if (!ctx) return NextResponse.json({ erro: "Kit não encontrado." }, { status: 404 });

  const { count } = await supabase.from("qa_items").select("id", { count: "exact", head: true }).eq("kit_id", kitId);
  if ((count ?? 0) > 0) return NextResponse.json({ erro: "O mapa deste kit já foi gerado." }, { status: 409 });

  const { data: cases } = await supabase
    .from("cases")
    .select("id, titulo, situacao, acoes, resultado, metrica, origem, requisitos")
    .eq("kit_id", kitId);

  try {
    let gerado: z.infer<typeof mapaGerado> | null = null;
    for (let tentativa = 0; tentativa < 2 && !gerado; tentativa++) {
      const resposta = await anthropic().beta.messages.parse({
        model: MODELS.mapa,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: betaZodOutputFormat(mapaGerado) },
        system: sistemaComContexto(SISTEMA_MAPA, ctx),
        messages: [
          {
            role: "user",
            content: `<cases>\n${JSON.stringify(cases ?? [])}\n</cases>\n\nEscreva o mapa desta preparação.`,
          },
        ],
      });
      await registrarUso("mapa", resposta.model, resposta.usage, user.id, kitId);
      if (resposta.stop_reason !== "refusal") gerado = resposta.parsed_output;
    }
    if (!gerado || gerado.itens.length === 0) {
      return NextResponse.json({ erro: "O mapa não saiu agora. Tente de novo." }, { status: 502 });
    }

    const casePorTitulo = new Map((cases ?? []).map((c) => [c.titulo.trim().toLowerCase(), c.id]));
    const itens = [...gerado.itens]
      .sort((a, b) => ORDEM.indexOf(a.categoria) - ORDEM.indexOf(b.categoria))
      .slice(0, 20)
      .map((item, i) => {
        const marcado = /\[confirmar:/.test([item.gancho ?? "", ...item.bullets, item.expandida ?? ""].join(" "));
        return {
          kit_id: kitId,
          categoria: item.categoria,
          pergunta: item.pergunta,
          gancho: item.gancho,
          bullets: item.bullets.slice(0, 3),
          ancoras: item.ancoras.slice(0, 3),
          numero_impacto: item.numero_impacto,
          expandida: item.expandida,
          case_id: item.case_titulo ? (casePorTitulo.get(item.case_titulo.trim().toLowerCase()) ?? null) : null,
          ordem: i + 1,
          fixado: item.categoria === "abertura" || /pretens/i.test(item.pergunta),
          pendente_confirmacao: marcado,
          bloqueado: ctx.acesso === "gratis" && i >= ABERTAS_NO_GRATIS,
        };
      });

    const { error } = await supabase.from("qa_items").insert(itens);
    if (error) return NextResponse.json({ erro: "Não deu para salvar o mapa." }, { status: 500 });
    await supabase.from("kits").update({ status: "pronto" }).eq("id", kitId);

    return NextResponse.json({ ok: true, total: itens.length, abertas: itens.filter((i) => !i.bloqueado).length });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
