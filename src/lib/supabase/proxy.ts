import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "./env";

// O login só é pedido no diagnóstico: currículo e vaga (/preparacoes/nova)
// ficam abertos. A Hora do Show também, porque roda do aparelho.
function isProtected(pathname: string) {
  return (
    pathname === "/preparacoes" ||
    pathname.startsWith("/kits/") ||
    pathname.startsWith("/conta")
  );
}

export async function updateSession(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase não configurado");
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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

  return response;
}
