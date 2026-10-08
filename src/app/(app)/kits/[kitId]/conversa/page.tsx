import { notFound, redirect } from "next/navigation";
import type { TipoEntrevista } from "@/lib/domain";
import { carregarContexto } from "@/lib/ai/contexto";
import { createClient } from "@/lib/supabase/server";
import { Conversa } from "./_components/conversa";
import { ConversaReal } from "./_components/conversa-real";

export const metadata = { title: "Conversa" };

const TIPOS: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];

export default async function Page({ params, searchParams }: PageProps<"/kits/[kitId]/conversa">) {
  const { kitId } = await params;

  // Kit de demonstração: a conversa encenada, sem IA.
  if (kitId === "demo") {
    const { tipo } = await searchParams;
    return <Conversa tipo={TIPOS.find((t) => t === tipo) ?? "tecnica"} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/kits/${kitId}/conversa`);

  const ctx = await carregarContexto(supabase, kitId);
  if (!ctx) notFound();

  const [{ data: mensagens }, { data: cases }] = await Promise.all([
    supabase.from("discovery_messages").select("id, papel, conteudo").eq("kit_id", kitId).order("criado_em"),
    supabase
      .from("cases")
      .select("id, titulo, situacao, acoes, resultado, origem, requisitos")
      .eq("kit_id", kitId)
      .order("created_at"),
  ]);

  return (
    <ConversaReal
      kitId={kitId}
      tipo={ctx.tipo}
      requisitos={ctx.requisitos}
      mensagensIniciais={(mensagens ?? []).map((m) => ({
        id: m.id,
        papel: m.papel === "assistant" ? "ia" : "voce",
        texto: m.conteudo,
      }))}
      casesIniciais={cases ?? []}
    />
  );
}
