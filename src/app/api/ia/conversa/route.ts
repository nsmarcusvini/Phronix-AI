import type { Content, FunctionDeclaration, Part } from "@google/genai";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { gemini, MODELS } from "@/lib/ai/client";
import { carregarContexto, sistemaComContexto } from "@/lib/ai/contexto";
import { caseRegistrado } from "@/lib/ai/esquemas";
import { nivelDePensamento } from "@/lib/ai/estruturado";
import { dentroDoLimite } from "@/lib/ai/limite";
import { SISTEMA_GARIMPO } from "@/lib/ai/prompts";
import { mensagemDeErro, muitasTentativas } from "@/lib/ai/respostas";
import { registrarUso, somarUso, usoDe, type Uso } from "@/lib/ai/uso";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Etapa 4: garimpo de cases (Gemini 3.8 Flash), em streaming.
// Resposta em NDJSON: {t:"texto",d} | {t:"case",case} | {t:"cobertura",cobertos,total} | {t:"fim"} | {t:"erro",erro}.
// Quando o modelo chama registrar_case, o case é gravado e o laço continua
// até a mensagem terminar.

const entrada = z.object({ kitId: z.uuid(), mensagem: z.string().max(4000).nullable() });

const ABERTURA = "Comece a conversa: registre os cases que o currículo já sustenta e faça a primeira pergunta.";
const MAX_VOLTAS = 4;

const FERRAMENTA: FunctionDeclaration = {
  name: "registrar_case",
  description:
    "Registra um case real (STAR compacto) contado pela pessoa ou presente no currículo. Use uma vez por história.",
  parametersJsonSchema: {
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
  if (!process.env.GEMINI_API_KEY) {
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
  const conversa: Content[] = [
    ...(historico ?? []).map((m) => ({
      role: m.papel === "assistant" ? "model" : "user",
      parts: [{ text: m.conteudo }],
    })),
    { role: "user", parts: [{ text: `${estado}\n\n${mensagem ?? ABERTURA}` }] },
  ];
  const sistema = sistemaComContexto(SISTEMA_GARIMPO, ctx);

  const corpoStream = new ReadableStream({
    async start(controle) {
      const enviar = (evento: object) => controle.enqueue(new TextEncoder().encode(`${JSON.stringify(evento)}\n`));
      let textoFinal = "";
      let uso: Uso = { entrada: 0, saida: 0, cacheLeitura: 0 };

      try {
        for (let volta = 0; volta < MAX_VOLTAS; volta++) {
          const stream = await gemini().models.generateContentStream({
            model: MODELS.garimpo,
            contents: conversa,
            config: {
              systemInstruction: sistema,
              maxOutputTokens: 4000,
              tools: [{ functionDeclarations: [FERRAMENTA] }],
              thinkingConfig: nivelDePensamento("baixo"),
            },
          });

          // As partes do modelo voltam inteiras para o histórico, com as
          // assinaturas de raciocínio que o Gemini exige nas chamadas de função.
          const partesDoModelo: Part[] = [];
          let ultimoUso;
          for await (const pedaco of stream) {
            for (const parte of pedaco.candidates?.[0]?.content?.parts ?? []) {
              partesDoModelo.push(parte);
              if (parte.text && !parte.thought) {
                textoFinal += parte.text;
                enviar({ t: "texto", d: parte.text });
              }
            }
            if (pedaco.usageMetadata) ultimoUso = pedaco.usageMetadata;
          }
          uso = somarUso(uso, usoDe(ultimoUso));

          const chamadas = partesDoModelo.filter((p) => p.functionCall?.name === "registrar_case");
          if (chamadas.length === 0) break;

          // Grava cada case e devolve o resultado para o modelo continuar.
          const respostas: Part[] = [];
          for (const { functionCall } of chamadas) {
            const caso = caseRegistrado.safeParse(functionCall?.args);
            let resultado = "Entrada inválida.";
            if (caso.success) {
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
              resultado = salvo ? "Case registrado." : "Não foi possível registrar.";
            }
            respostas.push({
              functionResponse: { id: functionCall?.id, name: "registrar_case", response: { resultado } },
            });
          }
          conversa.push({ role: "model", parts: partesDoModelo });
          conversa.push({ role: "user", parts: respostas });
        }

        await registrarUso("garimpo", MODELS.garimpo, uso, user.id, kitId);
        if (textoFinal.trim()) {
          await supabase.from("discovery_messages").insert({ kit_id: kitId, papel: "assistant", conteudo: textoFinal });
        }
        const { data: todos } = await supabase.from("cases").select("requisitos").eq("kit_id", kitId);
        const cobertos = ctx.requisitos.filter((r) => (todos ?? []).some((c) => c.requisitos.includes(r)));
        enviar({ t: "cobertura", cobertos, total: ctx.requisitos.length });
        enviar({ t: "fim" });
      } catch (erro) {
        const { texto, status } = mensagemDeErro(erro);
        enviar({ t: "erro", erro: status >= 500 && status !== 503 ? "A conversa travou agora. Tente mandar de novo." : texto });
      } finally {
        controle.close();
      }
    },
  });

  return new Response(corpoStream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
