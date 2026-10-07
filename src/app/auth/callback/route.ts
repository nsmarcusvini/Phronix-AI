import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Volta do link de confirmação do e-mail: troca o código por sessão e segue
// para onde a pessoa estava. Só aceita destino interno.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const proximo = searchParams.get("next") ?? "/preparacoes";
  const destino = proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : "/preparacoes";

  if (codigo) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(destino, origin));
  }
  return NextResponse.redirect(new URL("/entrar?erro=link", origin));
}
