import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_PASSWORD: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  PERPLEXITY_API_KEY: z.string().min(1).optional(),
  AI_USAGE_DAILY_LIMIT: z.coerce.number().int().positive().default(25)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // The app remains bootable without env during scaffolding; errors are surfaced via helpers.
  // eslint-disable-next-line no-console
  console.warn("Environment variables could not be fully parsed.", parsed.error.flatten());
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      AI_USAGE_DAILY_LIMIT: process.env["AI_USAGE_DAILY_LIMIT"] ?? "25",
      NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
      NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"],
      SUPABASE_DB_PASSWORD: process.env["SUPABASE_DB_PASSWORD"],
      ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
      PERPLEXITY_API_KEY: process.env["PERPLEXITY_API_KEY"]
    });

export const hasPublicSupabaseEnv = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const hasServiceRoleEnv = Boolean(
  hasPublicSupabaseEnv && env.SUPABASE_SERVICE_ROLE_KEY
);

export const hasAnthropicEnv = Boolean(env.ANTHROPIC_API_KEY);
export const hasPerplexityEnv = Boolean(env.PERPLEXITY_API_KEY);

export function getMissingEnv(keys: Array<keyof typeof env>) {
  return keys.filter((key) => !env[key]);
}
