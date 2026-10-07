import { redirect } from "next/navigation";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { createClient } from "@/lib/supabase/server";
import { Conta } from "./_components/conta";

export const metadata = { title: "Conta e plano" };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/conta");

  const [{ data: perfil }, { data: avulso }] = await Promise.all([
    supabase.from("profiles").select("nome, plano, consentimento_lgpd_em").eq("id", user.id).single(),
    supabase
      .from("kits")
      .select("acesso_expira_em")
      .eq("acesso", "avulso")
      .not("acesso_expira_em", "is", null)
      .order("acesso_expira_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <>
      <CabecalhoApp />
      <Conta
        dados={{
          id: user.id,
          email: user.email ?? "",
          nome: perfil?.nome ?? "",
          plano: perfil?.plano ?? "gratis",
          consentimentoEm: perfil?.consentimento_lgpd_em ?? null,
          avulsoAte: avulso?.acesso_expira_em ?? null,
        }}
      />
    </>
  );
}
