import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

// Login e sincronização da Prática vão direto do navegador ao Supabase (RLS).
export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key);
}
