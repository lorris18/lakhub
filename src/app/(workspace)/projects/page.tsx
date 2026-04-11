import Link from "next/link";

import { createProjectAction } from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { requireCurrentUser } from "@/lib/auth/session";
import { listProjects } from "@/lib/data/projects";
import { formatDate, fromNow } from "@/lib/utils/format";

export default async function ProjectsPage() {
  await requireCurrentUser();
  const projects = await listProjects();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Projets"
        title="Piloter les projets"
        description="Chaque projet centralise objectifs, problématique, livrables, membres et documents associés."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-brand-primary">Liste des projets</h3>
            <p className="text-sm text-text-secondary">{projects.length} projet(s)</p>
          </div>
          {projects.length ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{project.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">{project.description ?? "Sans description."}</p>
                    </div>
                    <div className="text-sm text-text-muted">
                      <p>{project.status}</p>
                      <p>{project.due_date ? `Échéance ${formatDate(project.due_date)}` : "Sans échéance"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-text-muted">
                    Mis à jour {fromNow(project.updated_at)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun projet"
              description="Le workspace est prêt. Créez un projet pour démarrer la bibliothèque, les documents et les révisions."
            />
          )}
        </Surface>

        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Nouveau projet</p>
            <h3 className="mt-2 font-display text-2xl text-brand-primary">Créer un projet de recherche</h3>
          </div>
          <form action={createProjectAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="title">
                Titre
              </label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="description">
                Description
              </label>
              <Textarea id="description" name="description" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="problemStatement">
                Problématique
              </label>
              <Textarea id="problemStatement" name="problemStatement" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="status">
                  Statut
                </label>
                <Select defaultValue="planning" id="status" name="status">
                  <option value="planning">Planning</option>
                  <option value="active">Actif</option>
                  <option value="review">En revue</option>
                  <option value="completed">Terminé</option>
                  <option value="archived">Archivé</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="dueDate">
                  Échéance
                </label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="objectives">
                Objectifs
              </label>
              <Textarea id="objectives" name="objectives" />
            </div>
            <Button className="w-full" type="submit" variant="primary">
              Créer le projet
            </Button>
          </form>
        </Surface>
      </div>
    </div>
  );
}
