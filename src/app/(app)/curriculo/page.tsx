import { redirect } from "next/navigation";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { destinoSeguro } from "@/lib/destino";
import { curriculoAtual } from "@/lib/preparacao/curriculo";
import { createClient } from "@/lib/supabase/server";
import { EnviarCurriculo } from "./_components/enviar-curriculo";

export const metadata = { title: "Seu currículo" };

// Enviar ou trocar o currículo, sempre com a conta já criada. Depois de salvo,
// volta para onde a pessoa estava (?next=), ou para o painel.
export default async function Curriculo({ searchParams }: PageProps<"/curriculo">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/curriculo");

  const { next } = await searchParams;
  const atual = await curriculoAtual(supabase);

  return (
    <>
      <CabecalhoApp />
      <EnviarCurriculo
        destino={destinoSeguro(typeof next === "string" ? next : undefined)}
        atual={atual ? { nome: atual.dados.nome.valor, criadoEm: atual.criadoEm } : null}
      />
    </>
  );
}
