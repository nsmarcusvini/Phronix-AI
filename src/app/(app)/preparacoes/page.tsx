import { redirect } from "next/navigation";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { listarPreparacoes } from "@/lib/preparacao/listar";
import { createClient } from "@/lib/supabase/server";
import { Preparacoes } from "./_components/preparacoes";

export const metadata = { title: "Minhas preparações" };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/preparacoes");

  const vagas = await listarPreparacoes(supabase);

  return (
    <>
      <CabecalhoApp />
      <Preparacoes vagas={vagas} />
    </>
  );
}
