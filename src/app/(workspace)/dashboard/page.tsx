import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Tableau de bord"
        title="Pilotage quotidien de la recherche"
        description="Projets actifs, documents récents, échéances et signaux de collaboration réunis sur une surface compacte."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Projets actifs", snapshot.projects.length],
          ["Documents récents", snapshot.documents.length],
          ["Échéances proches", snapshot.upcomingDeliverables.length],
          ["Notifications non lues", snapshot.unreadNotificationCount]
        ].map(([label, value]) => (
          <Surface key={label}>
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="mt-3 font-display text-4xl text-brand-primary">{value}</p>
          </Surface>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-brand-primary">Projets récents</h3>
            <Link href="/projects">
              <Button size="sm" variant="ghost">
                Voir tout
              </Button>
            </Link>
          </div>
          {snapshot.projects.length ? (
            <div className="space-y-3">
              {snapshot.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-brand-primary">{project.title}</p>
                    <p className="text-sm text-text-secondary">
                      Mise à jour {fromNow(project.updated_at)}
                    </p>
                  </div>
                  <Badge variant="accent">{project.status}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun projet pour le moment"
              description="Créez votre premier projet de recherche pour suivre livrables, documents et échéances."
              action={
                <Link href="/projects">
                  <Button variant="accent">Créer un projet</Button>
                </Link>
              }
            />
          )}
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Documents récents</h3>
            <div className="space-y-3">
              {snapshot.documents.map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${document.id}`}
                  className="block rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent"
                >
                  <p className="font-medium text-brand-primary">{document.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {document.kind} • {document.status}
                  </p>
                </Link>
              ))}
            </div>
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Notifications</h3>
            <div className="space-y-3">
              {snapshot.notifications.map((notification) => (
                <form
                  key={notification.id}
                  action={markNotificationReadAction}
                  className="rounded-2xl border border-border-subtle bg-surface-elevated p-4"
                >
                  <input name="notificationId" type="hidden" value={notification.id} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-brand-primary">{notification.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">{notification.body}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read_at ? (
                      <Button size="sm" type="submit" variant="ghost">
                        Marquer lu
                      </Button>
                    ) : null}
                  </div>
                </form>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
