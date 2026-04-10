import nodemailer from "nodemailer";

import { env, hasEmailTransportEnv, hasResendEmailEnv, hasSmtpEmailEnv } from "@/lib/env";

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type EmailDeliveryResult = {
  delivered: boolean;
  provider: "resend" | "smtp" | "none";
  reason: string | null;
  messageId?: string | null;
};

function getFromHeader() {
  const address = env.EMAIL_FROM_ADDRESS;
  const name = env.EMAIL_FROM_NAME?.trim() || "LAKHub";

  if (!address) {
    throw new Error("EMAIL_FROM_ADDRESS est requis pour envoyer des emails applicatifs.");
  }

  return name ? `${name} <${address}>` : address;
}

async function sendWithResend(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: getFromHeader(),
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      reply_to: payload.replyTo ?? env.EMAIL_REPLY_TO ?? undefined,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  const json = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    return {
      delivered: false,
      provider: "resend",
      reason: json?.error?.message ?? json?.message ?? "Envoi Resend impossible.",
      messageId: null
    };
  }

  return {
    delivered: true,
    provider: "resend",
    reason: null,
    messageId: json?.id ?? null
  };
}

async function sendWithSmtp(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? (env.SMTP_PORT === 465),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD
    }
  });

  const info = await transporter.sendMail({
    from: getFromHeader(),
    to: payload.to,
    replyTo: payload.replyTo ?? env.EMAIL_REPLY_TO ?? undefined,
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });

  return {
    delivered: true,
    provider: "smtp",
    reason: null,
    messageId: info.messageId
  };
}

export function getEmailTransportLabel() {
  if (hasResendEmailEnv) {
    return "resend";
  }

  if (hasSmtpEmailEnv) {
    return "smtp";
  }

  return "none";
}

export async function sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  if (!hasEmailTransportEnv) {
    return {
      delivered: false,
      provider: "none",
      reason: "Aucun transport email applicatif n'est configuré.",
      messageId: null
    };
  }

  if (hasResendEmailEnv) {
    return sendWithResend(payload);
  }

  if (hasSmtpEmailEnv) {
    return sendWithSmtp(payload);
  }

  return {
    delivered: false,
    provider: "none",
    reason: "Configuration email incomplète.",
    messageId: null
  };
}
