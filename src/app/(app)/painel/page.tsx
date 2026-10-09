import { redirect } from "next/navigation";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { Tour } from "@/components/tour/tour";
import { metricasDePratica } from "@/lib/pratica/metricas";
import { curriculoAtual } from "@/lib/preparacao/curriculo";
import { listarPreparacoes } from "@/lib/preparacao/listar";
import { createClient } from "@/lib/supabase/server";
import { Painel } from "./_components/painel";

export const metadata = { title: "Painel" };

// Casa da pessoa logo depois de criar a conta: métricas, próximas entrevistas
// e as portas para Elaborar, Praticar e Hora do Show. Não exige currículo:
// ele é lido dentro do app, ao elaborar a primeira entrevista.
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel");

  const [curriculo, vagas, metricas, { data: perfil }] = await Promise.all([
    curriculoAtual(supabase),
    listarPreparacoes(supabase),
    metricasDePratica(supabase),
    supabase.from("profiles").select("nome, tour_concluido_em").eq("id", user.id).maybeSingle(),
  ]);
  const nome = perfil?.nome || curriculo?.dados.nome.valor || null;

  return (
    <>
      <CabecalhoApp />
      <Painel nome={nome} vagas={vagas} curriculo={curriculo} metricas={metricas} />
      {/* Primeiro acesso depois de criar a conta: tour guiado, uma vez só. */}
      {perfil && !perfil.tour_concluido_em && <Tour nome={nome} />}
    </>
  );
}
