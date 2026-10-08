import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessage, BetaMessageParam, BetaTool } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { anthropic, IaIndisponivel, MODELS } from "@/lib/ai/client";
import { carregarContexto, sistemaComContexto } from "@/lib/ai/contexto";
import { caseRegistrado } from "@/lib/ai/esquemas";
import { dentroDoLimite } from "@/lib/ai/limite";
import { SISTEMA_GARIMPO } from "@/lib/ai/prompts";
import { muitasTentativas } from "@/lib/ai/respostas";
import { registrarUso } from "@/lib/ai/uso";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Etapa 4: garimpo de cases (Sonnet 5.5), em streaming.
// Resposta em NDJSON: {t:"texto",d} | {t:"case",case} | {t:"cobertura",cobertos,total} | {t:"fim"} | {t:"erro",erro}.
// Quando o modelo chama registrar_case, o case é gravado e o laço continua
// até a mensagem terminar.

const entrada = z.object({ kitId: z.uuid(), mensagem: z.string().max(4000).nullable() });

const ABERTURA = "Comece a conversa: registre os cases que o currículo já sustenta e faça a primeira pergunta.";
const MAX_VOLTAS = 4;

const FERRAMENTA: BetaTool = {
  name: "registrar_case",
  description:
    "Registra um case real (STAR compacto) contado pela pessoa ou presente no currículo. Use uma vez por história.",
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Até 6 palavras." },
      situacao: { type: "string", description: "1 frase." },
      acoes: { type: "array", items: { type: "string" }, description: "2 frases sobre o que a pessoa fez." },
      resultado: { type: "string", description: "1 frase; número só se foi dito ou estimado." },
      metrica: { type: ["string", "null"], description: "O número de impacto, se houver." },
      requisitos: { type: "array", items: { type: "string" }, description: "Nomes exatos da lista de requisitos." },
      origem: { type: "string", enum: ["cv", "conversa", "estimativa"] },
    },
    required: ["titulo", "situacao", "acoes", "resultado", "metrica", "requisitos", "origem"],
    additionalProperties: false,
  },
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para continuar." }, { status: 401 });
  if (!dentroDoLimite(`conversa:${user.id}`, 80, 60 * 60_000)) return muitasTentativas();

  const corpo = entrada.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Mensagem inválida." }, { status: 400 });
  const { kitId, mensagem } = corpo.data;

  const ctx = await carregarContexto(supabase, kitId);
  if (!ctx) return NextResponse.json({ erro: "Kit não encontrado." }, { status: 404 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erro: "A IA ainda não está ligada neste ambiente." }, { status: 503 });
  }

  // Histórico só em texto (as chamadas de ferramenta de turnos anteriores já
  // viraram cases e entram como estado na mensagem atual).
  const [{ data: historico }, { data: casesAtuais }] = await Promise.all([
    supabase.from("discovery_messages").select("papel, conteudo").eq("kit_id", kitId).order("criado_em"),
    supabase.from("cases").select("titulo, requisitos").eq("kit_id", kitId),
  ]);

  if (mensagem) {
    await supabase.from("discovery_messages").insert({ kit_id: kitId, papel: "user", conteudo: mensagem });
  }
  if (ctx.status === "diagnosticado" || ctx.status === "rascunho") {
    await supabase.from("kits").update({ status: "garimpo" }).eq("id", kitId);
  }

  const estado = `<cases_registrados>\n${(casesAtuais ?? [])
    .map((c) => `- ${c.titulo} (cobre: ${c.requisitos.join(", ") || "nada da lista"})`)
    .join("\n")}\n</cases_registrados>`;
  const mensagens: BetaMessageParam[] = [
    ...(historico ?? []).map((m) => ({ role: m.papel, content: m.conteudo }) as BetaMessageParam),
    { role: "user", content: `${estado}\n\n${mensagem ?? ABERTURA}` },
  ];
  const sistema = sistemaComContexto(SISTEMA_GARIMPO, ctx);
  const cliente = anthropic();

  const corpoStream = new ReadableStream({
    async start(controle) {
      const enviar = (evento: object) => controle.enqueue(new TextEncoder().encode(`${JSON.stringify(evento)}\n`));
      let textoFinal = "";

      try {
        for (let volta = 0; volta < MAX_VOLTAS; volta++) {
          const stream = cliente.beta.messages.stream({
            model: MODELS.garimpo,
            max_tokens: 4000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "low" },
            system: sistema,
            tools: [FERRAMENTA],
            messages: mensagens,
          });
          stream.on("text", (d) => {
            textoFinal += d;
            enviar({ t: "texto", d });
          });

          let resposta: BetaMessage;
          try {
            resposta = await stream.finalMessage();
          } catch (erro) {
            if (erro instanceof Anthropic.APIError) throw erro;
            continue; // entrada de ferramenta ilegível: refaz a volta
          }
          await registrarUso("garimpo", resposta.model, resposta.usage, user.id, kitId);

          if (resposta.stop_reason !== "tool_use") break;

          // Grava cada case e devolve o resultado para o modelo continuar.
          const resultados: BetaMessageParam = { role: "user", content: [] };
          for (const bloco of resposta.content) {
            if (bloco.type !== "tool_use") continue;
            const caso = caseRegistrado.safeParse(bloco.input);
            if (!caso.success) {
              (resultados.content as object[]).push({
                type: "tool_result",
                tool_use_id: bloco.id,
                is_error: true,
                content: "Entrada inválida.",
              });
              continue;
            }
            const c = caso.data;
            const { data: salvo } = await supabase
              .from("cases")
              .insert({
                kit_id: kitId,
                titulo: c.titulo,
                situacao: c.situacao,
                acoes: c.acoes.slice(0, 2),
                resultado: c.resultado,
                metrica: c.metrica,
                origem: c.origem,
                requisitos: c.requisitos.filter((r) => ctx.requisitos.includes(r)),
              })
              .select("id, titulo, situacao, acoes, resultado, metrica, origem, requisitos")
              .single();
            if (salvo) enviar({ t: "case", case: salvo });
            (resultados.content as object[]).push({
              type: "tool_result",
              tool_use_id: bloco.id,
              content: salvo ? "Case registrado." : "Não foi possível registrar.",
            });
          }
          mensagens.push({ role: "assistant", content: resposta.content });
          mensagens.push(resultados);
        }

        if (textoFinal.trim()) {
          await supabase.from("discovery_messages").insert({ kit_id: kitId, papel: "assistant", conteudo: textoFinal });
        }
        const { data: todos } = await supabase.from("cases").select("requisitos").eq("kit_id", kitId);
        const cobertos = ctx.requisitos.filter((r) => (todos ?? []).some((c) => c.requisitos.includes(r)));
        enviar({ t: "cobertura", cobertos, total: ctx.requisitos.length });
        enviar({ t: "fim" });
      } catch (erro) {
        console.error("[ia/conversa]", erro instanceof Anthropic.APIError ? erro.status : erro);
        enviar({
          t: "erro",
          erro:
            erro instanceof IaIndisponivel
              ? "A IA ainda não está ligada neste ambiente."
              : "A conversa travou agora. Tente mandar de novo.",
        });
      } finally {
        controle.close();
      }
    },
  });

  return new Response(corpoStream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
