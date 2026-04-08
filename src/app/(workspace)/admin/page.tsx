import { deleteUserAction, inviteUserAction, updateUserRoleAction } from "@/app/(workspace)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getAdminSnapshot } from "@/lib/data/admin";
import { getSystemReadiness } from "@/lib/system/readiness";
import { formatDateTime } from "@/lib/utils/format";

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<{ invite?: string }>;
}) {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const params = await searchParams;
  const [snapshot, readiness] = await Promise.all([getAdminSnapshot(), getSystemReadiness()]);

  const readinessVariant =
    readiness.overall === "ready"
      ? "accent"
      : readiness.overall === "warning"
        ? "primary"
        : "subtle";

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Supervision produit"
        description="Vue agrégée des utilisateurs, activité récente et gouvernance des rôles de plateforme."
      />

      {params?.invite ? (
        <Surface className="border border-border-subtle bg-surface-elevated">
          <p className="text-sm text-text-secondary">
            {params.invite === "sent"
              ? "Invitation utilisateur envoyée."
              : params.invite === "rate-limit"
                ? "L’invitation email a été refusée par Supabase à cause du rate limit actuel. Réessayez dans quelques minutes."
                : "L’invitation utilisateur n’a pas pu être envoyée."}
          </p>
        </Surface>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Surface>
          <p className="text-sm text-text-secondary">Utilisateurs récents</p>
          <p className="mt-3 font-display text-4xl text-brand-primary">{snapshot.users.length}</p>
        </Surface>
        <Surface>
          <p className="text-sm text-text-secondary">Volumes actuels</p>
          <p className="mt-3 text-lg text-brand-primary">
            {snapshot.stats.projects} projets • {snapshot.stats.documents} documents
          </p>
        </Surface>
      </div>

      <Surface className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-2xl text-brand-primary">Readiness système</h3>
            <p className="text-sm text-text-secondary">
              Vérification réelle des variables critiques et des services externes configurés.
            </p>
          </div>
          <Badge variant={readinessVariant}>{readiness.overall}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {readiness.checks.map((check) => (
            <div key={check.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-brand-primary">{check.label}</p>
                <Badge
                  variant={
                    check.state === "ready"
                      ? "accent"
                      : check.state === "warning"
                        ? "primary"
                        : "subtle"
                  }
                >
                  {check.state}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-text-secondary">{check.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
          Dernière vérification {formatDateTime(readiness.checkedAt)}
        </p>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Surface className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
            <p className="font-medium text-brand-primary">Ajouter un utilisateur</p>
            <form action={inviteUserAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <Input name="email" placeholder="email@institution.edu" required type="email" />
              <Input name="fullName" placeholder="Nom complet (optionnel)" />
              <Button type="submit" variant="accent">
                Inviter
              </Button>
            </form>
          </div>
          <h3 className="font-display text-2xl text-brand-primary">Gestion des rôles</h3>
          <div className="space-y-3">
            {snapshot.users.map((user) => (
              <form
                key={user.id}
                action={updateUserRoleAction}
                className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <input name="userId" type="hidden" value={user.id} />
                <div>
                  <p className="font-medium text-brand-primary">{user.full_name ?? user.email}</p>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select defaultValue={user.role} name="role">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </Select>
                  <Button type="submit" variant="secondary">
                    Mettre à jour
                  </Button>
                </div>
              </form>
            ))}
            {snapshot.users.map((user) => (
              <form key={`${user.id}-delete`} action={deleteUserAction}>
                <input name="userId" type="hidden" value={user.id} />
                <Button type="submit" variant="ghost">
                  Supprimer {user.full_name ?? user.email}
                </Button>
              </form>
            ))}
          </div>
        </Surface>

        <Surface className="space-y-4">
          <h3 className="font-display text-2xl text-brand-primary">Audit logs</h3>
          <div className="space-y-3">
            {snapshot.logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                <p className="font-medium text-brand-primary">{log.action}</p>
                <p className="mt-1 text-sm text-text-secondary">{log.entity_type}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                  {formatDateTime(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
