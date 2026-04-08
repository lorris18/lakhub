import {
  createCitationAction,
  createSubmissionAction,
  createVersionAction,
  deleteDocumentAction,
  deleteCitationAction
} from "@/app/(workspace)/actions";
import { DocumentEditor } from "@/components/editor/document-editor";
import { VersionComparison } from "@/components/editor/version-comparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { listLibraryItems } from "@/lib/data/library";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getDocumentDetail, getDocumentVersionComparison } from "@/lib/data/documents";
import { formatDateTime } from "@/lib/utils/format";

export default async function DocumentPage({
  params
}: {
  params: Promise<{ documentId: string }>;
}) {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const { documentId } = await params;
  const [detail, comparison, libraryItems] = await Promise.all([
    getDocumentDetail(documentId),
    getDocumentVersionComparison(documentId),
    listLibraryItems()
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Document"
        title={detail.document.title}
        description="Édition structurée, autosave, citations, versions et flux de soumission."
      />

      <div className="grid gap-6 2xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <DocumentEditor
            content={detail.document.content_json}
            documentId={documentId}
            title={detail.document.title}
          />

          <VersionComparison
            diff={comparison.diff}
            summary={comparison.summary}
            versions={comparison.versions}
          />
        </div>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Versions</h3>
            <div className="space-y-3">
              {detail.versions.map((version) => (
                <div key={version.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="font-medium text-brand-primary">Version {version.version_number}</p>
                  <p className="mt-1 text-sm text-text-secondary">{version.summary ?? "Sans résumé."}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                    {formatDateTime(version.created_at)}
                  </p>
                </div>
              ))}
            </div>
            <form action={createVersionAction} className="space-y-3 border-t border-border-subtle pt-4">
              <input name="documentId" type="hidden" value={documentId} />
              <Input defaultValue={detail.document.title} name="title" placeholder="Titre de version" required />
              <Textarea name="summary" placeholder="Résumé de version" />
              <Button type="submit" variant="secondary">
                Créer une version
              </Button>
            </form>
            <form action={deleteDocumentAction} className="border-t border-border-subtle pt-4">
              <input name="documentId" type="hidden" value={documentId} />
              <Button type="submit" variant="ghost">
                Supprimer ce document
              </Button>
            </form>
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Soumissions</h3>
            <div className="space-y-3">
              {detail.submissions.map((submission) => (
                <div key={submission.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="font-medium text-brand-primary">{submission.status}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {submission.version
                      ? `Version ${submission.version.version_number} • ${submission.version.title}`
                      : "Version introuvable"}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {submission.reviewer
                      ? `Reviewer: ${submission.reviewer.fullName ?? submission.reviewer.email ?? "Utilisateur"}`
                      : "Reviewer non attribué"}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">{submission.note ?? "Sans note."}</p>
                </div>
              ))}
            </div>
            {detail.versions.length ? (
              <form action={createSubmissionAction} className="space-y-3 border-t border-border-subtle pt-4">
                <input name="documentId" type="hidden" value={documentId} />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="versionId">
                    Version à soumettre
                  </label>
                  <Select defaultValue={detail.versions[0]?.id} id="versionId" name="versionId" required>
                    {detail.versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        Version {version.version_number} • {version.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="reviewerUserId">
                    Reviewer
                  </label>
                  <Select defaultValue="" id="reviewerUserId" name="reviewerUserId">
                    <option value="">Attribuer plus tard</option>
                    {detail.reviewers.map((reviewer) => (
                      <option key={reviewer.userId} value={reviewer.userId}>
                        {(reviewer.fullName ?? reviewer.email ?? "Utilisateur")} • {reviewer.role}
                      </option>
                    ))}
                  </Select>
                </div>
                <Textarea name="note" placeholder="Contexte de soumission" />
                <Button type="submit" variant="secondary">
                  Soumettre pour révision
                </Button>
              </form>
            ) : (
              <div className="border-t border-border-subtle pt-4 text-sm text-text-secondary">
                Créez d’abord une version pour lancer un cycle de soumission.
              </div>
            )}
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Citations liees</h3>
            <div className="space-y-3">
              {detail.citations.length ? (
                detail.citations.map((citation) => (
                  <div key={citation.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <p className="font-medium text-brand-primary">{citation.citation_key}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {citation.locator ?? "Sans localisateur"} • {citation.note ?? "Sans note"}
                    </p>
                    {citation.library_item ? (
                      <p className="mt-2 text-sm text-text-secondary">
                        Source liée:{" "}
                        <span className="text-brand-primary">
                          {citation.library_item.title}
                          {citation.library_item.publication_year
                            ? ` (${citation.library_item.publication_year})`
                            : ""}
                        </span>
                      </p>
                    ) : null}
                    <form action={deleteCitationAction} className="mt-3">
                      <input name="documentId" type="hidden" value={documentId} />
                      <input name="citationId" type="hidden" value={citation.id} />
                      <Button size="sm" type="submit" variant="ghost">
                        Retirer
                      </Button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
                  Aucune citation liee pour le moment.
                </div>
              )}
            </div>
            <form action={createCitationAction} className="space-y-3 border-t border-border-subtle pt-4">
              <input name="documentId" type="hidden" value={documentId} />
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="libraryItemId">
                  Source bibliothèque
                </label>
                <Select defaultValue="" id="libraryItemId" name="libraryItemId">
                  <option value="">Citer sans fiche bibliothèque liée</option>
                  {libraryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </div>
              <Input name="citationKey" placeholder="Clé de citation (ex. asima2026cadre)" required />
              <Input name="locator" placeholder="Localisateur (ex. p. 42, section 3.1)" />
              <Textarea name="note" placeholder="Note de citation ou contexte d’usage" />
              <Button type="submit" variant="secondary">
                Ajouter la citation
              </Button>
            </form>
          </Surface>
        </div>
      </div>
    </div>
  );
}
