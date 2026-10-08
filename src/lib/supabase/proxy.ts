import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { destinoSeguro } from "@/lib/destino";
import { supabaseKey, supabaseUrl } from "./env";
import type { Database } from "./database.types";

// A conta vem primeiro: onboarding (/comecar), painel, kits e conta pedem
// login. Ficam abertos a landing, a Hora do Show (roda do aparelho) e o kit de
// demonstração (/kits/demo/...), que vive só no navegador.
function isProtected(pathname: string) {
  if (pathname.startsWith("/kits/demo/")) return false;
  return (
    pathname.startsWith("/comecar") ||
    pathname.startsWith("/painel") ||
    pathname.startsWith("/kits/") ||
    pathname.startsWith("/conta")
  );
}

// Quem já entrou não precisa ver de novo as telas de entrar e criar conta.
const SO_SEM_SESSAO = new Set(["/entrar", "/criar-conta"]);

export async function updateSession(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase não configurado");
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Não colocar código entre createServerClient e getClaims: a sessão é renovada aqui.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (data?.claims && SO_SEM_SESSAO.has(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = destinoSeguro(request.nextUrl.searchParams.get("next"));
    url.search = "";
    const redirecionar = NextResponse.redirect(url);
    // Leva junto os cookies da sessão renovada.
    response.cookies.getAll().forEach((cookie) => redirecionar.cookies.set(cookie));
    return redirecionar;
  }

  return response;
}
