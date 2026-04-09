import Link from "next/link";
import type { Route } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardSnapshot } from "@/lib/data/dashboard";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { formatDate, fromNow } from "@/lib/utils/format";
import { markNotificationReadAction } from "@/app/(workspace)/actions";

export default async function DashboardPage() {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const snapshot = await getDashboardSnapshot();
  const resumeDocument = snapshot.documents[0] ?? null;
  const resumeProject = snapshot.projects[0] ?? null;
  const upcomingItems = snapshot.upcomingDeliverables.slice(0, 3);
  const recentActivity = [
    ...snapshot.documents.slice(0, 3).map((document) => ({
      id: `document-${document.id}`,
      title: document.title,
      href: `/documents/${document.id}` as Route,
      meta: `${document.kind} • ${document.status}`,
      date: document.updated_at,
      kind: "Document"
    })),
    ...snapshot.projects.slice(0, 3).map((project) => ({
      id: `project-${project.id}`,
      title: project.title,
      href: `/projects/${project.id}` as Route,
      meta: project.status,
      date: project.updated_at,
      kind: "Projet"
    }))
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Accueil"
        title="Reprendre le travail"
        description="Un point d’entrée simple pour reprendre la rédaction, suivre les échéances et voir l’activité récente."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Reprendre</p>
            <h3 className="mt-1 font-display text-2xl text-brand-primary">
              {resumeDocument ? resumeDocument.title : resumeProject ? resumeProject.title : "Workspace prêt"}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {resumeDocument
                ? `Dernier document actif • ${resumeDocument.kind} • ${resumeDocument.status}`
                : resumeProject
                  ? `Dernier projet actif • ${resumeProject.status}`
                  : "Commencez par créer un projet ou un document."}
            </p>
          </div>

          {resumeDocument ? (
            <div className="flex flex-wrap gap-3">
              <Link href={`/documents/${resumeDocument.id}`}>
                <Button variant="accent">Ouvrir le document</Button>
              </Link>
              <Link href="/work?view=documents">
                <Button variant="ghost">Voir les travaux</Button>
              </Link>
            </div>
          ) : resumeProject ? (
            <div className="flex flex-wrap gap-3">
              <Link href={`/projects/${resumeProject.id}`}>
                <Button variant="accent">Ouvrir le projet</Button>
              </Link>
              <Link href="/work?view=projects">
                <Button variant="ghost">Voir les travaux</Button>
              </Link>
            </div>
          ) : (
            <EmptyState
              title="Aucun travail en cours"
              description="Créez un projet ou un document pour démarrer l’espace de travail."
              action={
                <Link href="/work?view=projects">
                  <Button variant="accent">Créer un projet</Button>
                </Link>
              }
            />
          )}
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-brand-primary">À suivre</h3>
                <p className="text-sm text-text-secondary">
                  Priorités immédiates, sans surcharge.
                </p>
              </div>
              <Link href="/work?view=review" className="text-sm font-medium text-brand-accent">
                Ouvrir les travaux
              </Link>
            </div>

            {upcomingItems.length || snapshot.unreadNotificationCount ? (
              <div className="space-y-3">
                {upcomingItems.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="rounded-2xl border border-border-subtle bg-surface-elevated p-4"
                  >
                    <p className="font-medium text-brand-primary">{deliverable.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Échéance {deliverable.due_date ? formatDate(deliverable.due_date) : "à définir"}
                    </p>
                  </div>
                ))}
                {snapshot.unreadNotificationCount ? (
                  <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <p className="font-medium text-brand-primary">Notifications à traiter</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {snapshot.unreadNotificationCount} notification(s) non lue(s).
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Rien d’urgent pour le moment.</p>
            )}
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Activité récente</h3>
            {recentActivity.length ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-brand-primary">{item.title}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{item.kind}</p>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{item.meta}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                      Mise à jour {fromNow(item.date)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Aucune activité récente pour le moment.</p>
            )}

            {snapshot.notifications.length ? (
              <details className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-primary">
                  Notifications détaillées
                </summary>
                <div className="mt-4 space-y-3">
                  {snapshot.notifications.map((notification) => (
                    <form key={notification.id} action={markNotificationReadAction} className="space-y-2">
                      <input name="notificationId" type="hidden" value={notification.id} />
                      <p className="font-medium text-brand-primary">{notification.title}</p>
                      <p className="text-sm text-text-secondary">{notification.body}</p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                          {formatDate(notification.created_at)}
                        </p>
                        {!notification.read_at ? (
                          <Button size="sm" type="submit" variant="ghost">
                            Marquer lu
                          </Button>
                        ) : null}
                      </div>
                    </form>
                  ))}
                </div>
              </details>
            ) : null}
          </Surface>
        </div>
      </div>
    </div>
  );
}
