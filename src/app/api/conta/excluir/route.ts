import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Exclusão de conta (LGPD): apaga os arquivos do Storage e o usuário.
// O resto (perfil, currículos, vagas, kits, respostas, revisões, uso de IA,
// assinaturas) cai em cascata pelo schema.
export async function POST(request: NextRequest) {
  // Só aceita chamada do próprio app.
  const origem = request.headers.get("origin");
  if (origem && origem !== request.nextUrl.origin) {
    return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre na sua conta para excluí-la." }, { status: 401 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { erro: "A exclusão ainda não está ligada neste ambiente (falta a chave secreta do Supabase)." },
      { status: 503 },
    );
  }

  const pasta = admin.storage.from("curriculos");
  const { data: arquivos, error: erroLista } = await pasta.list(user.id, { limit: 1000 });
  if (erroLista) return NextResponse.json({ erro: "Não deu para apagar os arquivos agora." }, { status: 500 });
  if (arquivos.length > 0) {
    const { error } = await pasta.remove(arquivos.map((a) => `${user.id}/${a.name}`));
    if (error) return NextResponse.json({ erro: "Não deu para apagar os arquivos agora." }, { status: 500 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ erro: "Não deu para excluir a conta agora." }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
