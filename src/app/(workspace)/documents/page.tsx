import Link from "next/link";

import { createDocumentAction } from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { listDocuments } from "@/lib/data/documents";
import { listProjects } from "@/lib/data/projects";
import { formatDate } from "@/lib/utils/format";

export default async function DocumentsPage() {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const [documents, projects] = await Promise.all([listDocuments(), listProjects()]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Atelier de rédaction"
        title="Documents académiques actifs"
        description="Créez notes, articles, chapitres, mémoires et rapports, puis ouvrez l’éditeur riche avec autosave et versioning."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-brand-primary">Documents</h3>
            <p className="text-sm text-text-secondary">{documents.length} document(s)</p>
          </div>
          <div className="space-y-3">
            {documents.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${document.id}`}
                className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-brand-accent"
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
        </Surface>

        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Nouveau document</p>
            <h3 className="mt-2 font-display text-2xl text-brand-primary">Créer une pièce de travail</h3>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="projectId">
                Projet lié
              </label>
              <Select defaultValue="" id="projectId" name="projectId">
                <option value="">Document indépendant</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </Select>
            </div>
            <Button className="w-full" type="submit" variant="accent">
              Ouvrir dans l’éditeur
            </Button>
          </form>
        </Surface>
      </div>
    </div>
  );
}
