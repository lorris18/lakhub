import Link from "next/link";

import {
  createCitationAction,
  createCommentAction,
  createSubmissionAction,
  createSuggestionAction,
  createVersionAction,
  deleteCitationAction,
  deleteDocumentAction,
  updateCommentStatusAction,
  updateSuggestionStatusAction
} from "@/app/(workspace)/actions";
import { DocumentEditor } from "@/components/editor/document-editor";
import { VersionComparison } from "@/components/editor/version-comparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { getDocumentReviewThread } from "@/lib/data/collaboration";
import { getDocumentDetail, getDocumentVersionComparison } from "@/lib/data/documents";
import { listLibraryItems } from "@/lib/data/library";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/utils/format";

const sectionLinks = [
  { id: "editer", label: "Éditer" },
  { id: "versions", label: "Versions" },
  { id: "soumettre", label: "Soumettre" },
  { id: "citations", label: "Citations" },
  { id: "revision", label: "Révision" }
] as const;

export default async function DocumentPage({
  params
}: {
  params: Promise<{ documentId: string }>;
}) {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const { documentId } = await params;
  const [detail, comparison, libraryItems, review] = await Promise.all([
    getDocumentDetail(documentId),
    getDocumentVersionComparison(documentId),
    listLibraryItems(),
    getDocumentReviewThread(documentId)
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Document"
        title={detail.document.title}
        description="Une lecture simple: éditer, versionner, soumettre, citer et réviser depuis une même fiche."
      />

      <div className="flex flex-wrap gap-2">
        {sectionLinks.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            <Button size="sm" variant="ghost">
              {section.label}
            </Button>
          </a>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <section className="space-y-4" id="editer">
            <DocumentEditor
              content={detail.document.content_json}
              documentId={documentId}
              title={detail.document.title}
            />
          </section>

          <section className="space-y-4" id="revision">
            <Surface className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Révision</p>
                <h3 className="mt-1 font-display text-2xl text-brand-primary">Commentaires et suggestions</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Les ancrages techniques sont masqués. La révision se concentre sur le contenu.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Surface className="space-y-3 bg-surface-elevated">
                  <h4 className="font-medium text-brand-primary">Commentaires</h4>
                  {review.comments.length ? (
                    review.comments.map((comment) => (
                      <div key={comment.id} className="rounded-2xl border border-border-subtle bg-surface-panel p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-brand-primary">{comment.status}</p>
                          <form action={updateCommentStatusAction}>
                            <input name="commentId" type="hidden" value={comment.id} />
                            <input
                              name="status"
                              type="hidden"
                              value={comment.status === "resolved" ? "open" : "resolved"}
                            />
                            <Button size="sm" type="submit" variant="ghost">
                              {comment.status === "resolved" ? "Rouvrir" : "Résoudre"}
                            </Button>
                          </form>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary">{comment.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary">Aucun commentaire pour le moment.</p>
                  )}
                </Surface>

                <Surface className="space-y-3 bg-surface-elevated">
                  <h4 className="font-medium text-brand-primary">Suggestions</h4>
                  {review.suggestions.length ? (
                    review.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="rounded-2xl border border-border-subtle bg-surface-panel p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-brand-primary">{suggestion.status}</p>
                          <form action={updateSuggestionStatusAction} className="flex gap-2">
                            <input name="suggestionId" type="hidden" value={suggestion.id} />
                            <Button name="status" size="sm" type="submit" value="accepted" variant="secondary">
                              Accepter
                            </Button>
                            <Button name="status" size="sm" type="submit" value="rejected" variant="ghost">
                              Rejeter
                            </Button>
                          </form>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">Proposé</p>
                        <p className="mt-1 text-sm text-text-secondary">{suggestion.proposed_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary">Aucune suggestion pour le moment.</p>
                  )}
                </Surface>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <form action={createCommentAction} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <input name="documentId" type="hidden" value={documentId} />
                  <input name="anchorId" type="hidden" value="document-body" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-brand-primary">Nouveau commentaire</h4>
                    <Select defaultValue="" name="versionId">
                      <option value="">Sans version spécifique</option>
                      {detail.versions.map((version) => (
                        <option key={version.id} value={version.id}>
                          Version {version.version_number} • {version.title}
                        </option>
                      ))}
                    </Select>
                    <Textarea name="body" placeholder="Commentaire de révision" required />
                    <Button type="submit" variant="accent">
                      Ajouter le commentaire
                    </Button>
                  </div>
                </form>

                <form action={createSuggestionAction} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <input name="documentId" type="hidden" value={documentId} />
                  <input name="anchorId" type="hidden" value="document-body" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-brand-primary">Nouvelle suggestion</h4>
                    <Select defaultValue="" name="versionId">
                      <option value="">Sans version spécifique</option>
                      {detail.versions.map((version) => (
                        <option key={version.id} value={version.id}>
                          Version {version.version_number} • {version.title}
                        </option>
                      ))}
                    </Select>
                    <Textarea name="originalText" placeholder="Texte original" required />
                    <Textarea name="proposedText" placeholder="Texte proposé" required />
                    <Button type="submit" variant="secondary">
                      Ajouter la suggestion
                    </Button>
                  </div>
                </form>
              </div>
            </Surface>
          </section>
        </div>

        <div className="space-y-6">
          <section id="versions">
            <Surface className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Versions</p>
                <h3 className="mt-1 font-display text-2xl text-brand-primary">Historique et export</h3>
              </div>
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
              <details className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-primary">Comparer et exporter</summary>
                <div className="mt-4 space-y-4">
                  <VersionComparison
                    diff={comparison.diff}
                    summary={comparison.summary}
                    versions={comparison.versions}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/api/documents/${documentId}/export?format=pdf`}>
                      <Button variant="ghost">Exporter en PDF</Button>
                    </Link>
                    <Link href={`/api/documents/${documentId}/export?format=docx`}>
                      <Button variant="ghost">Exporter en DOCX</Button>
                    </Link>
                  </div>
                </div>
              </details>
              <form action={deleteDocumentAction} className="border-t border-border-subtle pt-4">
                <input name="documentId" type="hidden" value={documentId} />
                <Button type="submit" variant="ghost">
                  Supprimer ce document
                </Button>
              </form>
            </Surface>
          </section>

          <section id="soumettre">
            <Surface className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Soumettre</p>
                <h3 className="mt-1 font-display text-2xl text-brand-primary">Cycle de soumission</h3>
              </div>
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
          </section>

          <section id="citations">
            <Surface className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Citations</p>
                <h3 className="mt-1 font-display text-2xl text-brand-primary">Sources liées</h3>
              </div>
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
                    Aucune citation liée pour le moment.
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
                <Input name="citationKey" placeholder="Clé de citation" required />
                <Input name="locator" placeholder="Localisateur" />
                <Textarea name="note" placeholder="Note de citation" />
                <Button type="submit" variant="secondary">
                  Ajouter la citation
                </Button>
              </form>
            </Surface>
          </section>
        </div>
      </div>
    </div>
  );
}
