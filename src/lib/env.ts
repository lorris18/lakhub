import { z } from "zod";

function normalizeOptionalEnv(value: string | undefined) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function toOptionalNumber(value: string | number | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeOptionalEnv(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalBoolean(value: boolean | string | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeOptionalEnv(value);
  if (!normalized) {
    return undefined;
  }

  return normalized === "true";
}

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

const rawEnv = {
  AI_USAGE_DAILY_LIMIT: normalizeOptionalEnv(process.env["AI_USAGE_DAILY_LIMIT"]) ?? "25",
  NEXT_PUBLIC_APP_URL: normalizeOptionalEnv(process.env["NEXT_PUBLIC_APP_URL"]),
  NEXT_PUBLIC_PUBLIC_SITE_URL: normalizeOptionalEnv(process.env["NEXT_PUBLIC_PUBLIC_SITE_URL"]),
  NEXT_PUBLIC_SUPABASE_URL: normalizeOptionalEnv(process.env["NEXT_PUBLIC_SUPABASE_URL"]),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: normalizeOptionalEnv(process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
  SUPABASE_SERVICE_ROLE_KEY: normalizeOptionalEnv(process.env["SUPABASE_SERVICE_ROLE_KEY"]),
  SUPABASE_DB_PASSWORD: normalizeOptionalEnv(process.env["SUPABASE_DB_PASSWORD"]),
  RESEND_API_KEY: normalizeOptionalEnv(process.env["RESEND_API_KEY"]),
  EMAIL_FROM_ADDRESS: normalizeOptionalEnv(process.env["EMAIL_FROM_ADDRESS"]),
  EMAIL_FROM_NAME: normalizeOptionalEnv(process.env["EMAIL_FROM_NAME"]),
  EMAIL_REPLY_TO: normalizeOptionalEnv(process.env["EMAIL_REPLY_TO"]),
  SMTP_HOST: normalizeOptionalEnv(process.env["SMTP_HOST"]),
  SMTP_PORT: normalizeOptionalEnv(process.env["SMTP_PORT"]),
  SMTP_USER: normalizeOptionalEnv(process.env["SMTP_USER"]),
  SMTP_PASSWORD: normalizeOptionalEnv(process.env["SMTP_PASSWORD"]),
  SMTP_SECURE: normalizeOptionalEnv(process.env["SMTP_SECURE"]),
  ANTHROPIC_API_KEY: normalizeOptionalEnv(process.env["ANTHROPIC_API_KEY"]),
  PERPLEXITY_API_KEY: normalizeOptionalEnv(process.env["PERPLEXITY_API_KEY"])
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  // The app remains bootable without env during scaffolding; errors are surfaced via helpers.
  // eslint-disable-next-line no-console
  console.warn("Environment variables could not be fully parsed.", parsed.error.flatten());
}

export const env = parsed.success
  ? parsed.data
  : {
      AI_USAGE_DAILY_LIMIT: toOptionalNumber(rawEnv.AI_USAGE_DAILY_LIMIT) ?? 25,
      NEXT_PUBLIC_APP_URL: rawEnv.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_PUBLIC_SITE_URL: rawEnv.NEXT_PUBLIC_PUBLIC_SITE_URL,
      NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: rawEnv.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_DB_PASSWORD: rawEnv.SUPABASE_DB_PASSWORD,
      RESEND_API_KEY: rawEnv.RESEND_API_KEY,
      EMAIL_FROM_ADDRESS: rawEnv.EMAIL_FROM_ADDRESS,
      EMAIL_FROM_NAME: rawEnv.EMAIL_FROM_NAME,
      EMAIL_REPLY_TO: rawEnv.EMAIL_REPLY_TO,
      SMTP_HOST: rawEnv.SMTP_HOST,
      SMTP_PORT: toOptionalNumber(rawEnv.SMTP_PORT),
      SMTP_USER: rawEnv.SMTP_USER,
      SMTP_PASSWORD: rawEnv.SMTP_PASSWORD,
      SMTP_SECURE: toOptionalBoolean(rawEnv.SMTP_SECURE),
      ANTHROPIC_API_KEY: rawEnv.ANTHROPIC_API_KEY,
      PERPLEXITY_API_KEY: rawEnv.PERPLEXITY_API_KEY
    };

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
