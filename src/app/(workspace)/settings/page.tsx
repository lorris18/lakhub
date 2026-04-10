import { updateSettingsAction } from "@/app/(workspace)/actions";
import { AccountDeletionForm } from "@/components/settings/account-deletion-form";
import { AvatarUploadForm } from "@/components/settings/avatar-upload-form";
import { PasswordChangeForm } from "@/components/settings/password-change-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { hasPublicSupabaseEnv, hasServiceRoleEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/settings";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const recoveryParam = resolvedSearchParams["recovery"];
  const forcePasswordParam = resolvedSearchParams["force-password-change"];
  const isRecoveryMode =
    recoveryParam === "1" || (Array.isArray(recoveryParam) && recoveryParam.includes("1"));
  const isForcedPasswordChange =
    forcePasswordParam === "1" || (Array.isArray(forcePasswordParam) && forcePasswordParam.includes("1"));
  const [data, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const requiresPasswordChange =
    user?.user_metadata?.["must_change_password"] === true || isForcedPasswordChange;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Paramètres"
        title="Profil, préférences et identité"
        description="Profil utilisateur, thème, notifications et avatar sont gérés depuis une surface unique."
      />

      {isRecoveryMode ? (
        <Surface className="border-status-warning/25 bg-status-warning-soft/80">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Récupération</p>
          <h3 className="mt-2 font-display text-2xl text-brand-primary">
            Définissez un nouveau mot de passe
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Votre session de récupération est active. Utilisez le bloc “Changer le mot de passe”
            ci-dessous pour finaliser la réinitialisation.
          </p>
        </Surface>
      ) : null}

      {requiresPasswordChange ? (
        <Surface className="border-status-warning/25 bg-status-warning-soft/80">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Sécurité</p>
          <h3 className="mt-2 font-display text-2xl text-brand-primary">
            Changement du mot de passe requis
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Votre accès a été créé avec un mot de passe provisoire. Vous devez définir un mot de
            passe personnel avant de continuer à utiliser LAKHub.
          </p>
        </Surface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="space-y-4">
          <h3 className="font-display text-2xl text-brand-primary">Profil</h3>
          <form action={updateSettingsAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="fullName">
                Nom complet
              </label>
              <Input defaultValue={data.profile.full_name ?? ""} id="fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="institution">
                Institution
              </label>
              <Input defaultValue={data.profile.institution ?? ""} id="institution" name="institution" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="bio">
                Bio
              </label>
              <Textarea defaultValue={data.profile.bio ?? ""} id="bio" name="bio" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="theme">
                  Thème
                </label>
                <Select defaultValue={data.settings.theme} id="theme" name="theme">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-text-secondary">
                <input defaultChecked={data.settings.email_notifications} name="emailNotifications" type="checkbox" />
                Recevoir les notifications email
              </label>
            </div>
            <Button type="submit" variant="primary">
              Enregistrer les paramètres
            </Button>
          </form>
        </Surface>

        <Surface className="space-y-4">
          <h3 className="font-display text-2xl text-brand-primary">Avatar et sécurité</h3>
          <AvatarUploadForm />
          <div className="border-t border-border-subtle pt-4">
            <h4 className="font-medium text-brand-primary">Changer le mot de passe</h4>
            <div className="mt-3">
              <PasswordChangeForm required={requiresPasswordChange} />
            </div>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <h4 className="font-medium text-brand-primary">Zone sensible</h4>
            <div className="mt-3 rounded-2xl border border-status-warning/20 bg-status-warning-soft/65 p-4">
              {hasServiceRoleEnv ? (
                <AccountDeletionForm email={data.profile.email} />
              ) : (
                <p className="text-sm text-text-secondary">
                  La suppression de compte est prête côté produit, mais nécessite
                  `SUPABASE_SERVICE_ROLE_KEY` pour supprimer l’utilisateur Auth et nettoyer les
                  objets privés du storage.
                </p>
              )}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
