import { redirect } from "next/navigation";
import { curriculoAtual } from "@/lib/preparacao/curriculo";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "./_components/onboarding";

export const metadata = { title: "Seu currículo" };

// Onboarding: só o currículo. Quem já tem currículo vai direto ao painel,
// a menos que tenha vindo trocar o currículo (?atualizar=1).
export default async function Comecar({ searchParams }: PageProps<"/comecar">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/comecar");

  const { atualizar } = await searchParams;
  const atual = await curriculoAtual(supabase);
  if (atual && atualizar !== "1") redirect("/painel");

  return <Onboarding atualizando={atual !== null} />;
}
