import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordRecoveryEmail } from "@/lib/email/messages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env, hasEmailTransportEnv, hasPublicSupabaseEnv } from "@/lib/env";
import { getHubOrigin } from "@/lib/urls";

const resetPasswordSchema = z.object({
  email: z.string().email()
});

function getRecoveryRedirectUrl() {
  const callbackUrl = new URL("/auth/callback", getHubOrigin("https://hub.l-asim.com"));
  callbackUrl.searchParams.set("next", "/settings?recovery=1");
  return callbackUrl.toString();
}

export async function POST(request: Request) {
  try {
    const payload = resetPasswordSchema.parse(await request.json());
    const email = payload.email.trim().toLowerCase();
    const redirectTo = getRecoveryRedirectUrl();

    if (!hasPublicSupabaseEnv) {
      return NextResponse.json(
        { message: "Configuration Supabase publique manquante." },
        { status: 503 }
      );
    }

    if (hasEmailTransportEnv) {
      const admin = createSupabaseAdminClient();
      const recovery = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo
        }
      });

      if (recovery.error || !recovery.data.properties?.action_link) {
        return NextResponse.json(
          { message: recovery.error?.message ?? "Lien de récupération introuvable." },
          { status: 500 }
        );
      }

      const delivery = await sendPasswordRecoveryEmail({
        email,
        recoveryUrl: recovery.data.properties.action_link
      });

      if (!delivery.delivered) {
        return NextResponse.json(
          { message: delivery.reason ?? "Envoi de l'email de récupération impossible." },
          { status: 502 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    const publicClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error } = await publicClient.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      const message =
        error.message === "Error sending recovery email"
          ? "Supabase Auth n’a pas pu envoyer l’email de récupération. Vérifiez le SMTP/Auth Email du projet ou configurez un transport email applicatif."
          : error.message;

      return NextResponse.json({ message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Réinitialisation impossible." },
      { status: 400 }
    );
  }
}
