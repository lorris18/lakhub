import { getHubOrigin } from "@/lib/urls";
import { sendEmail, type EmailDeliveryResult } from "@/lib/email/transport";

type AccessEmailInput = {
  email: string;
  temporaryPassword: string;
  fullName?: string | null;
};

type ProjectInvitationEmailInput = {
  email: string;
  invitationUrl: string;
  projectTitle?: string | null;
  hasExistingAccount: boolean;
};

type RecoveryEmailInput = {
  email: string;
  recoveryUrl: string;
};

function buildShell({
  preheader,
  title,
  intro,
  body,
  ctaLabel,
  ctaUrl,
  footer
}: {
  preheader: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}) {
  return {
    text: `${preheader}\n\n${title}\n\n${intro}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${footer}`,
    html: `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:32px;background:#f3efe7;color:#162346;font-family:Georgia,'Times New Roman',serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <div style="margin:0 auto;max-width:640px;border:1px solid #d8cfbf;border-radius:24px;background:#fffaf1;padding:32px;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a7b68;">LAKHub</p>
      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#162346;">${title}</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#3f4a5f;">${intro}</p>
      <div style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#283247;">${body}</div>
      <p style="margin:0 0 28px;">
        <a href="${ctaUrl}" style="display:inline-block;border-radius:999px;background:#162346;color:#ffffff;padding:14px 22px;text-decoration:none;font-weight:600;">
          ${ctaLabel}
        </a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">${footer}</p>
    </div>
  </body>
</html>`
  };
}

export async function sendPlatformAccessEmail(
  input: AccessEmailInput
): Promise<EmailDeliveryResult> {
  const loginUrl = `${getHubOrigin("https://l-asim.com")}/login?email=${encodeURIComponent(input.email)}`;
  const content = buildShell({
    preheader: "Vos accès LAKHub sont prêts.",
    title: "Vos accès LAKHub",
    intro:
      "Un accès privé vient d'être créé ou réinitialisé pour vous sur Workspace LAKHub.",
    body: `
      <p style="margin:0 0 12px;"><strong>Identifiant :</strong> ${input.email}</p>
      <p style="margin:0 0 12px;"><strong>Mot de passe temporaire :</strong> ${input.temporaryPassword}</p>
      <p style="margin:0;">
        Lors de votre première connexion, vous devrez définir immédiatement un mot de passe personnel avant de poursuivre.
      </p>
    `,
    ctaLabel: "Se connecter à LAKHub",
    ctaUrl: loginUrl,
    footer:
      "Si vous n'attendiez pas cet email, ignorez-le et contactez l'administrateur de la plateforme."
  });

  return sendEmail({
    to: input.email,
    subject: "Vos accès LAKHub",
    html: content.html,
    text: content.text
  });
}

export async function sendProjectInvitationEmail(
  input: ProjectInvitationEmailInput
): Promise<EmailDeliveryResult> {
  const content = buildShell({
    preheader: "Une invitation LAKHub vous attend.",
    title: "Invitation LAKHub",
    intro: input.hasExistingAccount
      ? "Un accès à un espace de travail vous a été attribué sur LAKHub."
      : "Un accès à un espace de travail vous a été réservé sur LAKHub.",
    body: `
      <p style="margin:0 0 12px;">
        ${input.projectTitle ? `<strong>Projet :</strong> ${input.projectTitle}` : "Un projet privé vous attend dans LAKHub."}
      </p>
      <p style="margin:0;">
        ${input.hasExistingAccount
          ? "Connectez-vous avec votre compte habituel pour accepter l'invitation."
          : "Ouvrez le lien ci-dessous pour finaliser votre accès et définir votre mot de passe."}
      </p>
    `,
    ctaLabel: input.hasExistingAccount ? "Ouvrir l'invitation" : "Finaliser l'accès",
    ctaUrl: input.invitationUrl,
    footer:
      "Le lien d'invitation est personnel. Conservez-le dans un espace sûr jusqu'à son utilisation."
  });

  return sendEmail({
    to: input.email,
    subject: "Invitation LAKHub",
    html: content.html,
    text: content.text
  });
}

export async function sendPasswordRecoveryEmail(
  input: RecoveryEmailInput
): Promise<EmailDeliveryResult> {
  const content = buildShell({
    preheader: "Réinitialisation du mot de passe LAKHub.",
    title: "Réinitialiser votre mot de passe",
    intro:
      "Une demande de réinitialisation du mot de passe a été reçue pour votre accès LAKHub.",
    body: `
      <p style="margin:0 0 12px;">
        Le lien ci-dessous est personnel et à usage limité. Il vous redirigera vers l'écran sécurisé de définition du nouveau mot de passe.
      </p>
      <p style="margin:0;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
      </p>
    `,
    ctaLabel: "Définir un nouveau mot de passe",
    ctaUrl: input.recoveryUrl,
    footer:
      "Pour des raisons de sécurité, ne transférez pas ce lien et ne le partagez avec personne."
  });

  return sendEmail({
    to: input.email,
    subject: "Réinitialisation du mot de passe LAKHub",
    html: content.html,
    text: content.text
  });
}
