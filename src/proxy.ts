import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Tudo, exceto estáticos, service worker, manifest e imagens.
    "/((?!_next/static|_next/image|serwist|manifest.webmanifest|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
