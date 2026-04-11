import { deleteUserAction, updateUserRoleAction } from "@/app/(workspace)/actions";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { requireCurrentProfile } from "@/lib/auth/session";
import { getAdminSnapshot } from "@/lib/data/admin";
import { getSystemReadiness } from "@/lib/system/readiness";
import { formatDateTime } from "@/lib/utils/format";

export default async function AdminPage() {
  await requireCurrentProfile();
  const [snapshot, readiness] = await Promise.all([getAdminSnapshot(), getSystemReadiness()]);

  const readinessVariant =
    readiness.overall === "ready"
      ? "success"
      : readiness.overall === "warning"
        ? "warning"
        : "danger";

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Administration du workspace"
        description="Gestion des accès, des rôles et de la disponibilité technique de LAKHub."
      />

      {readiness.overall !== "ready" ? (
        <FeedbackBanner
          description="Au moins un point de configuration ou d’infrastructure demande une vérification avant de considérer LAKHub comme totalement stable."
          title="Points de vigilance détectés"
          variant={readiness.overall === "blocked" ? "danger" : "warning"}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Surface>
          <p className="text-sm text-text-secondary">Utilisateurs</p>
          <p className="mt-3 font-display text-4xl text-brand-primary">{snapshot.users.length}</p>
        </Surface>
        <Surface>
          <p className="text-sm text-text-secondary">Volumes</p>
          <p className="mt-3 text-lg text-brand-primary">
            {snapshot.stats.projects} projets • {snapshot.stats.documents} documents
          </p>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Surface className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
            <p className="font-medium text-brand-primary">Ajouter un utilisateur</p>
            <div className="mt-4">
              <InviteUserForm />
            </div>
          </div>
          <h3 className="font-display text-2xl text-brand-primary">Gestion des rôles</h3>
          {snapshot.users.length ? (
            <div className="space-y-3">
              {snapshot.users.map((user) => (
                <div
                  key={user.id}
                  className="space-y-3 rounded-2xl border border-border-subtle bg-surface-elevated p-4"
                >
                  <form action={updateUserRoleAction} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                  <form action={deleteUserAction}>
                    <input name="userId" type="hidden" value={user.id} />
                    <Button type="submit" variant="danger">
                      Supprimer cet accès
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun utilisateur visible"
              description="Aucun compte n’est remonté dans l’administration. Vérifiez la synchronisation des profils et la configuration Supabase."
            />
          )}
        </Surface>

        <div className="space-y-6">
          <details className="rounded-2xl border border-border-subtle bg-surface-panel p-5">
            <summary className="cursor-pointer text-sm font-medium text-brand-primary">
              Diagnostic technique
            </summary>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl text-brand-primary">Readiness système</p>
                <Badge variant={readinessVariant}>{readiness.overall}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {readiness.checks.map((check) => (
                  <div key={check.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-brand-primary">{check.label}</p>
                      <Badge
                        variant={
                          check.state === "ready"
                            ? "success"
                            : check.state === "warning"
                              ? "warning"
                              : "danger"
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
            </div>
          </details>

          <details className="rounded-2xl border border-border-subtle bg-surface-panel p-5">
            <summary className="cursor-pointer text-sm font-medium text-brand-primary">
              Audit logs
            </summary>
            <div className="mt-4 space-y-3">
              {snapshot.logs.length ? (
                snapshot.logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <p className="font-medium text-brand-primary">{log.action}</p>
                    <p className="mt-1 text-sm text-text-secondary">{log.entity_type}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucun log récent"
                  description="Les événements d’audit réapparaîtront ici dès qu’une action sensible sera tracée."
                />
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
