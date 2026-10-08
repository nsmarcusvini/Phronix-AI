import { redirect } from "next/navigation";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { curriculoAtual } from "@/lib/preparacao/curriculo";
import { metricasDePratica } from "@/lib/pratica/metricas";
import { listarPreparacoes } from "@/lib/preparacao/listar";
import { createClient } from "@/lib/supabase/server";
import { Tour } from "@/components/tour/tour";
import { Painel } from "./_components/painel";

export const metadata = { title: "Painel" };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel");

  // Sem currículo, o onboarding ainda não terminou.
  const curriculo = await curriculoAtual(supabase);
  if (!curriculo) redirect("/comecar");

  const [vagas, metricas, { data: perfil }] = await Promise.all([
    listarPreparacoes(supabase),
    metricasDePratica(supabase),
    supabase.from("profiles").select("nome, tour_concluido_em").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <>
      <CabecalhoApp />
      <Painel vagas={vagas} curriculo={curriculo} metricas={metricas} />
      {/* Primeiro acesso depois de criar a conta: tour guiado, uma vez só. */}
      {perfil && !perfil.tour_concluido_em && <Tour nome={perfil.nome ?? curriculo.dados.nome.valor} />}
    </>
  );
}
