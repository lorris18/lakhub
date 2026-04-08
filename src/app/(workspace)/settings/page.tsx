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
import { getSettings } from "@/lib/data/settings";

export default async function SettingsPage() {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const data = await getSettings();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Paramètres"
        title="Profil, préférences et identité"
        description="Profil utilisateur, thème, notifications et avatar sont gérés depuis une surface unique."
      />

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
            <Button type="submit" variant="accent">
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
              <PasswordChangeForm />
            </div>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <h4 className="font-medium text-brand-primary">Zone sensible</h4>
            <div className="mt-3 rounded-2xl border border-brand-accent/20 bg-brand-accent-soft/60 p-4">
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
