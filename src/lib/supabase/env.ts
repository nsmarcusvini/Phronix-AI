export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function requireSupabaseEnv() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local",
    );
  }
  return { url: supabaseUrl, key: supabaseKey };
}
