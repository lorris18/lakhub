import { env, hasPublicSupabaseEnv } from "@/lib/env";

export function getSupabasePublicConfig() {
  if (!hasPublicSupabaseEnv) {
    throw new Error(
      "Supabase public environment variables are missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  };
}

