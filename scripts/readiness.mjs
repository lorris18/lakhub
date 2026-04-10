import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const root = process.cwd();
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const checks = [];

function pushCheck(label, state, detail) {
  checks.push({ label, state, detail });
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS;
const aiFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === "true";
const hasAppEmailTransport = Boolean(
  (resendApiKey && emailFromAddress) ||
    (smtpHost && smtpPort && smtpUser && smtpPassword && emailFromAddress)
);

pushCheck(
  "App URL",
  appUrl ? "ready" : "warning",
  appUrl ? `Application adressée via ${appUrl}` : "NEXT_PUBLIC_APP_URL manquante."
);
pushCheck(
  "Supabase public",
  supabaseUrl && anonKey ? "ready" : "blocked",
  supabaseUrl && anonKey
    ? "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY présents."
    : "Variables publiques Supabase manquantes."
);
pushCheck(
  "Service role",
  supabaseUrl && serviceRoleKey ? "ready" : "blocked",
  supabaseUrl && serviceRoleKey
    ? "SUPABASE_SERVICE_ROLE_KEY disponible."
    : "SUPABASE_SERVICE_ROLE_KEY manquante."
);
pushCheck(
  "IA",
  aiFeatureEnabled ? "warning" : "ready",
  aiFeatureEnabled
    ? "Le module IA est encore actif dans cette configuration."
    : "Le module IA est retiré du périmètre de production actuel."
);
pushCheck(
  "Emails applicatifs",
  hasAppEmailTransport ? "ready" : "warning",
  hasAppEmailTransport
    ? `Transport applicatif configuré via ${resendApiKey ? "Resend" : "SMTP"} avec l’expéditeur ${emailFromAddress}.`
    : "Aucun transport email applicatif détecté. Les accès plateforme ne peuvent pas expédier d’email applicatif et les autres emails dépendent du mailer Supabase Auth."
);

if (supabaseUrl && serviceRoleKey) {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const databaseCheck = await admin.from("users").select("id", { count: "exact", head: true }).limit(1);
    pushCheck(
      "Base de données",
      databaseCheck.error ? "blocked" : "ready",
      databaseCheck.error ? databaseCheck.error.message : "Connexion SQL Supabase opérationnelle."
    );
  } catch (error) {
    pushCheck("Base de données", "blocked", error instanceof Error ? error.message : "Connexion SQL impossible.");
  }

  try {
    const adminCheck = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "superadmin"]);
    pushCheck(
      "Admin plateforme",
      adminCheck.error ? "blocked" : (adminCheck.count ?? 0) > 0 ? "ready" : "warning",
      adminCheck.error
        ? adminCheck.error.message
        : (adminCheck.count ?? 0) > 0
          ? `${adminCheck.count} compte(s) admin détecté(s).`
          : "Aucun admin plateforme détecté pour le moment."
    );
  } catch (error) {
    pushCheck("Admin plateforme", "blocked", error instanceof Error ? error.message : "Vérification admin impossible.");
  }

  try {
    const authCheck = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    pushCheck(
      "Auth admin",
      authCheck.error ? "blocked" : "ready",
      authCheck.error ? authCheck.error.message : "Auth admin Supabase opérationnelle."
    );
  } catch (error) {
    pushCheck("Auth admin", "blocked", error instanceof Error ? error.message : "Auth admin impossible.");
  }

  try {
    const storageCheck = await admin.storage.listBuckets();
    pushCheck(
      "Storage",
      storageCheck.error ? "blocked" : "ready",
      storageCheck.error ? storageCheck.error.message : `${storageCheck.data.length} bucket(s) visibles.`
    );
  } catch (error) {
    pushCheck("Storage", "blocked", error instanceof Error ? error.message : "Storage impossible.");
  }
}

const overall = checks.some((check) => check.state === "blocked")
  ? "blocked"
  : checks.some((check) => check.state === "warning")
    ? "warning"
    : "ready";

console.log(`LAKHub readiness: ${overall}`);

for (const check of checks) {
  console.log(`- [${check.state}] ${check.label}: ${check.detail}`);
}

process.exitCode = overall === "blocked" ? 1 : 0;
