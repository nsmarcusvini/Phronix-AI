import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

// Ignora o RLS. Só para o que o usuário não pode escrever: ai_usage,
// subscriptions, plano do perfil, acesso do kit e desbloqueio de respostas.
export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Defina SUPABASE_SECRET_KEY em .env.local");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
