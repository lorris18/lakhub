import Link from "next/link";

import {
  createDocumentAction,
  createProjectAction
} from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { requireCurrentUser } from "@/lib/auth/session";
import { getCollaborationFeed } from "@/lib/data/collaboration";
import { listDocuments } from "@/lib/data/documents";
import { listProjects } from "@/lib/data/projects";
import { formatDate, fromNow } from "@/lib/utils/format";

const views = [
  { id: "projects", label: "Projets" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Révision" }
] as const;

type WorkView = (typeof views)[number]["id"];

function isWorkView(value: string | undefined): value is WorkView {
  return views.some((view) => view.id === value);
}

export default async function WorkPage({
  searchParams
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  await requireCurrentUser();
  const params = await searchParams;
  const activeView = isWorkView(params?.view) ? params.view : "projects";

  const [projects, documents, review] = await Promise.all([
    listProjects(),
    listDocuments(),
    getCollaborationFeed()
  ]);

  const totalReviewItems = review.comments.length + review.suggestions.length;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Travaux"
        title="Projets, documents et révision"
        description="Un espace unique pour suivre les travaux actifs, ouvrir la rédaction et traiter la révision sans disperser la navigation."
      />

      <div className="flex flex-wrap gap-2">
        {views.map((view) => {
          const isActive = activeView === view.id;

          return (
            <Link key={view.id} href={`/work?view=${view.id}`}>
              <Button size="sm" variant={isActive ? "primary" : "ghost"}>
                {view.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {activeView === "projects" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Surface className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-2xl text-brand-primary">Projets actifs</h3>
                <p className="text-sm text-text-secondary">
                  Commencez par la liste. La création vient ensuite.
                </p>
              </div>
              <Link href="/projects" className="text-sm font-medium text-brand-accent">
                Vue détaillée
              </Link>
            </div>

            {projects.length ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-primary">{project.title}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {project.description ?? "Sans description."}
                        </p>
                      </div>
                      <div className="text-sm text-text-muted">
                        <p>{project.status}</p>
                        <p>{project.due_date ? formatDate(project.due_date) : "Sans échéance"}</p>
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
                description="Créez un projet pour structurer les documents, les livrables et la collaboration."
              />
            )}
          </Surface>

          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Action</p>
              <h3 className="mt-2 font-display text-2xl text-brand-primary">Créer un projet</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Formulaire réduit au strict utile. Le détail se complète ensuite dans la fiche projet.
              </p>
            </div>
            <form action={createProjectAction} className="space-y-4">
              <Input name="title" placeholder="Titre du projet" required />
              <Textarea name="description" placeholder="Description courte" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select defaultValue="planning" name="status">
                  <option value="planning">Planning</option>
                  <option value="active">Actif</option>
                  <option value="review">En revue</option>
                  <option value="completed">Terminé</option>
                  <option value="archived">Archivé</option>
                </Select>
                <Input name="dueDate" type="date" />
              </div>
              <Button className="w-full" type="submit" variant="primary">
                Créer le projet
              </Button>
            </form>
          </Surface>
        </div>
      ) : null}

      {activeView === "documents" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Surface className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-2xl text-brand-primary">Documents actifs</h3>
                <p className="text-sm text-text-secondary">
                  Ouvrez un document pour écrire, versionner, soumettre et réviser.
                </p>
              </div>
              <Link href="/documents" className="text-sm font-medium text-brand-accent">
                Vue détaillée
              </Link>
            </div>

            {documents.length ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="block rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-primary">{document.title}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {document.kind} • {document.status}
                        </p>
                      </div>
                      <p className="text-sm text-text-muted">{formatDate(document.updated_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucun document"
                description="Créez un premier document pour ouvrir l’atelier de rédaction."
              />
            )}
          </Surface>

          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Action</p>
              <h3 className="mt-2 font-display text-2xl text-brand-primary">Créer un document</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Le document s’ouvre ensuite dans l’éditeur. Les versions et soumissions sont gérées dans sa fiche.
              </p>
            </div>
            <form action={createDocumentAction} className="space-y-4">
              <Input name="title" placeholder="Titre du document" required />
              <Select defaultValue="article" name="kind">
                <option value="note">Note</option>
                <option value="article">Article</option>
                <option value="chapter">Chapitre</option>
                <option value="thesis">Mémoire / Thèse</option>
                <option value="report">Rapport</option>
              </Select>
              <Button className="w-full" type="submit" variant="primary">
                Ouvrir dans l’éditeur
              </Button>
            </form>
          </Surface>
        </div>
      ) : null}

      {activeView === "review" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Surface className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl text-brand-primary">Révision récente</h3>
                  <p className="text-sm text-text-secondary">
                    {totalReviewItems
                      ? `${totalReviewItems} élément(s) de révision visible(s).`
                      : "Aucun échange de révision pour le moment."}
                  </p>
                </div>
                <Link href="/collaboration" className="text-sm font-medium text-brand-accent">
                  Vue détaillée
                </Link>
              </div>

              <div className="space-y-3">
                {review.comments.slice(0, 4).map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-brand-primary">{comment.document_title}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-text-muted">
                        {comment.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{comment.body}</p>
                  </div>
                ))}

                {review.suggestions.slice(0, 4).map((suggestion) => (
                  <div key={suggestion.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-brand-primary">{suggestion.document_title}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-text-muted">
                        {suggestion.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{suggestion.proposed_text}</p>
                  </div>
                ))}

                {!review.comments.length && !review.suggestions.length ? (
                  <EmptyState
                    title="Aucune révision"
                    description="Les commentaires et suggestions apparaîtront ici dès qu’un document entrera en cycle de lecture."
                  />
                ) : null}
              </div>
            </Surface>
          </div>

          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Action</p>
              <h3 className="mt-2 font-display text-2xl text-brand-primary">Ouvrir un document à réviser</h3>
              <p className="mt-2 text-sm text-text-secondary">
                La création de commentaires, suggestions, versions et soumissions se fait depuis la fiche document.
              </p>
            </div>
            <div className="space-y-3">
              {documents.length ? (
                documents.slice(0, 6).map((document) => (
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
                ))
              ) : (
                <EmptyState
                  title="Aucun document à ouvrir"
                  description="Créez d’abord un document pour lancer un cycle de relecture ou de soumission."
                />
              )}
            </div>
          </Surface>
        </div>
      ) : null}
    </div>
  );
}
