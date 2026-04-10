import {
  env,
  hasEmailTransportEnv,
  hasPublicSupabaseEnv,
  hasResendEmailEnv,
  hasServiceRoleEnv,
  hasSmtpEmailEnv,
  resolvedEmailFromAddress
} from "@/lib/env";
import { aiFeatureEnabled } from "@/lib/features";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReadinessState = "ready" | "warning" | "blocked";

export type ReadinessCheck = {
  id: string;
  label: string;
  state: ReadinessState;
  detail: string;
};

function summarizeReadiness(checks: ReadinessCheck[]): ReadinessState {
  if (checks.some((check) => check.state === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.state === "warning")) {
    return "warning";
  }

  return "ready";
}

export async function getSystemReadiness() {
  const emailSender = resolvedEmailFromAddress;
  const checks: ReadinessCheck[] = [
    {
      id: "app-url",
      label: "App URL",
      state: env.NEXT_PUBLIC_APP_URL ? "ready" : "warning",
      detail: env.NEXT_PUBLIC_APP_URL
        ? `Application adressée via ${env.NEXT_PUBLIC_APP_URL}`
        : "NEXT_PUBLIC_APP_URL n’est pas renseignée."
    },
    {
      id: "supabase-public",
      label: "Supabase public",
      state: hasPublicSupabaseEnv ? "ready" : "blocked",
      detail: hasPublicSupabaseEnv
        ? "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont présents."
        : "Variables publiques Supabase manquantes."
    },
    {
      id: "supabase-service-role",
      label: "Service role",
      state: hasServiceRoleEnv ? "ready" : "blocked",
      detail: hasServiceRoleEnv
        ? "SUPABASE_SERVICE_ROLE_KEY est disponible pour les opérations sensibles."
        : "SUPABASE_SERVICE_ROLE_KEY manquante."
    },
    {
      id: "email-transport",
      label: "Emails applicatifs",
      state: hasEmailTransportEnv ? "ready" : "warning",
      detail: hasResendEmailEnv
        ? `Transport Resend configuré pour invitations et réinitialisations. Expéditeur: ${emailSender}.`
        : hasSmtpEmailEnv
          ? `Transport SMTP configuré pour invitations et réinitialisations. Expéditeur: ${emailSender}.`
          : `Aucun transport email applicatif configuré. L’identité prévue reste ${emailSender}, mais les accès plateforme ne peuvent pas encore envoyer d’email applicatif et les autres flux dépendent encore du mailer Supabase Auth.`
    },
    {
      id: "ai-scope",
      label: "IA",
      state: aiFeatureEnabled ? "warning" : "ready",
      detail: aiFeatureEnabled
        ? "Le module IA est encore actif dans cette configuration."
        : "Le module IA est retiré du périmètre de production actuel."
    }
  ];

  if (hasServiceRoleEnv) {
    const admin = createSupabaseAdminClient();

    try {
      const databaseCheck = await admin.from("users").select("id", { count: "exact", head: true }).limit(1);

      checks.push({
        id: "supabase-database",
        label: "Base de données",
        state: databaseCheck.error ? "blocked" : "ready",
        detail: databaseCheck.error
          ? `Connexion SQL en échec: ${databaseCheck.error.message}`
          : "Connexion SQL Supabase opérationnelle."
      });
    } catch (error) {
      checks.push({
        id: "supabase-database",
        label: "Base de données",
        state: "blocked",
        detail: error instanceof Error ? error.message : "Connexion SQL impossible."
      });
    }

    try {
      const adminCheck = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .in("role", ["admin", "superadmin"]);

      checks.push({
        id: "platform-admin",
        label: "Admin plateforme",
        state: adminCheck.error ? "blocked" : (adminCheck.count ?? 0) > 0 ? "ready" : "warning",
        detail: adminCheck.error
          ? `Vérification admin en échec: ${adminCheck.error.message}`
          : (adminCheck.count ?? 0) > 0
            ? `${adminCheck.count} compte(s) admin détecté(s).`
            : "Aucun admin plateforme détecté pour le moment."
      });
    } catch (error) {
      checks.push({
        id: "platform-admin",
        label: "Admin plateforme",
        state: "blocked",
        detail: error instanceof Error ? error.message : "Vérification admin impossible."
      });
    }

    try {
      const authCheck = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      checks.push({
        id: "supabase-auth",
        label: "Auth admin",
        state: authCheck.error ? "blocked" : "ready",
        detail: authCheck.error
          ? `Auth admin en échec: ${authCheck.error.message}`
          : "Auth admin Supabase opérationnelle."
      });
    } catch (error) {
      checks.push({
        id: "supabase-auth",
        label: "Auth admin",
        state: "blocked",
        detail: error instanceof Error ? error.message : "Auth admin impossible."
      });
    }

    try {
      const storageCheck = await admin.storage.listBuckets();

      checks.push({
        id: "supabase-storage",
        label: "Storage",
        state: storageCheck.error ? "blocked" : "ready",
        detail: storageCheck.error
          ? `Storage en échec: ${storageCheck.error.message}`
          : `${storageCheck.data.length} bucket(s) visibles.`
      });
    } catch (error) {
      checks.push({
        id: "supabase-storage",
        label: "Storage",
        state: "blocked",
        detail: error instanceof Error ? error.message : "Storage impossible."
      });
    }
  }

  return {
    overall: summarizeReadiness(checks),
    checkedAt: new Date().toISOString(),
    checks
  };
}
