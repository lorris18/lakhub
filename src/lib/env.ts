import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_PASSWORD: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === "true")
    .optional(),
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
      NEXT_PUBLIC_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_PUBLIC_SITE_URL"],
      NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"],
      SUPABASE_DB_PASSWORD: process.env["SUPABASE_DB_PASSWORD"],
      RESEND_API_KEY: process.env["RESEND_API_KEY"],
      EMAIL_FROM_ADDRESS: process.env["EMAIL_FROM_ADDRESS"],
      EMAIL_FROM_NAME: process.env["EMAIL_FROM_NAME"],
      EMAIL_REPLY_TO: process.env["EMAIL_REPLY_TO"],
      SMTP_HOST: process.env["SMTP_HOST"],
      SMTP_PORT: process.env["SMTP_PORT"],
      SMTP_USER: process.env["SMTP_USER"],
      SMTP_PASSWORD: process.env["SMTP_PASSWORD"],
      SMTP_SECURE: process.env["SMTP_SECURE"],
      ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
      PERPLEXITY_API_KEY: process.env["PERPLEXITY_API_KEY"]
    });

export const resolvedEmailFromAddress = env.EMAIL_FROM_ADDRESS ?? "lorris@lkirusha.com";
export const resolvedEmailFromName = env.EMAIL_FROM_NAME?.trim() || "LAKHub";
export const resolvedEmailReplyTo = env.EMAIL_REPLY_TO ?? resolvedEmailFromAddress;

export const hasPublicSupabaseEnv = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const hasServiceRoleEnv = Boolean(
  hasPublicSupabaseEnv && env.SUPABASE_SERVICE_ROLE_KEY
);

export const hasResendEmailEnv = Boolean(
  env.RESEND_API_KEY
);

export const hasSmtpEmailEnv = Boolean(
  env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASSWORD
);

export const hasEmailTransportEnv = Boolean(hasResendEmailEnv || hasSmtpEmailEnv);

export const hasAnthropicEnv = Boolean(env.ANTHROPIC_API_KEY);
export const hasPerplexityEnv = Boolean(env.PERPLEXITY_API_KEY);

export function getMissingEnv(keys: Array<keyof typeof env>) {
  return keys.filter((key) => !env[key]);
}
