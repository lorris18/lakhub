import {
  createCommentAction,
  createSuggestionAction,
  updateCommentStatusAction,
  updateSuggestionStatusAction
} from "@/app/(workspace)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { requireCurrentUser } from "@/lib/auth/session";
import { getCollaborationFeed } from "@/lib/data/collaboration";
import { listDocumentCollaborationOptions } from "@/lib/data/documents";

export default async function CollaborationPage() {
  await requireCurrentUser();
  const [feed, documents] = await Promise.all([getCollaborationFeed(), listDocumentCollaborationOptions()]);
  const versionOptions = documents.flatMap((document) =>
    document.versions.map((version) => ({
      id: version.id,
      label: `${document.title} • V${version.version_number} • ${version.title}`
    }))
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Collaboration"
        title="Commentaires, annotations et suggestions"
        description="Vue détaillée de la révision. Les ancrages techniques sont volontairement masqués."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Commentaires récents</h3>
            {feed.comments.length ? (
              <div className="space-y-3">
                {feed.comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-brand-primary">{comment.document_title}</p>
                      <Badge variant={comment.status === "resolved" ? "success" : "warning"}>
                        {comment.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">{comment.anchor_id}</p>
                    <p className="mt-2 text-sm text-text-secondary">{comment.body}</p>
                    <form action={updateCommentStatusAction} className="mt-3 flex flex-wrap gap-2">
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
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucun commentaire récent"
                description="Les commentaires de lecture et de révision apparaîtront ici dès qu’un document sera annoté."
              />
            )}
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Suggestions</h3>
            {feed.suggestions.length ? (
              <div className="space-y-3">
                {feed.suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-brand-primary">{suggestion.document_title}</p>
                      <Badge
                        variant={
                          suggestion.status === "accepted"
                            ? "success"
                            : suggestion.status === "rejected"
                              ? "archived"
                              : "warning"
                        }
                      >
                        {suggestion.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-muted">Original</p>
                    <p className="mt-1 text-sm text-text-secondary">{suggestion.original_text}</p>
                    <p className="mt-3 text-sm text-text-muted">Proposé</p>
                    <p className="mt-1 text-sm text-brand-primary">{suggestion.proposed_text}</p>
                    <form action={updateSuggestionStatusAction} className="mt-3 flex flex-wrap gap-2">
                      <input name="suggestionId" type="hidden" value={suggestion.id} />
                      <Button name="status" type="submit" value="accepted" variant="success">
                        Accepter
                      </Button>
                      <Button name="status" type="submit" value="rejected" variant="danger">
                        Rejeter
                      </Button>
                      {suggestion.status !== "open" ? (
                        <Button name="status" type="submit" value="open" variant="secondary">
                          Rouvrir
                        </Button>
                      ) : null}
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucune suggestion ouverte"
                description="Les propositions de reformulation apparaîtront ici dès qu’un document entrera en cycle de révision."
              />
            )}
          </Surface>
        </div>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Nouveau commentaire</h3>
            {documents.length ? (
              <form action={createCommentAction} className="space-y-3">
                <input name="anchorId" type="hidden" value="document-body" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="commentDocumentId">
                    Document
                  </label>
                  <Select defaultValue={documents[0]?.id} id="commentDocumentId" name="documentId" required>
                    {documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="commentVersionId">
                    Version liée
                  </label>
                  <Select defaultValue="" id="commentVersionId" name="versionId">
                    <option value="">Sans version spécifique</option>
                    {versionOptions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Textarea name="body" placeholder="Commentaire" required />
                <Button type="submit" variant="primary">
                  Ajouter le commentaire
                </Button>
              </form>
            ) : (
              <p className="text-sm text-text-secondary">
                Créez ou rattachez d’abord un document pour ouvrir un fil de collaboration.
              </p>
            )}
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Nouvelle suggestion</h3>
            {documents.length ? (
              <form action={createSuggestionAction} className="space-y-3">
                <input name="anchorId" type="hidden" value="document-body" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="suggestionDocumentId">
                    Document
                  </label>
                  <Select defaultValue={documents[0]?.id} id="suggestionDocumentId" name="documentId" required>
                    {documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="suggestionVersionId">
                    Version liée
                  </label>
                  <Select defaultValue="" id="suggestionVersionId" name="versionId">
                    <option value="">Sans version spécifique</option>
                    {versionOptions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Textarea name="originalText" placeholder="Texte original" required />
                <Textarea name="proposedText" placeholder="Texte proposé" required />
                <Button type="submit" variant="primary">
                  Ajouter la suggestion
                </Button>
              </form>
            ) : (
              <p className="text-sm text-text-secondary">
                Les suggestions deviennent disponibles dès qu’au moins un document est accessible.
              </p>
            )}
          </Surface>

          <Surface className="space-y-3">
            <h3 className="font-display text-2xl text-brand-primary">Documents accessibles</h3>
            {documents.length ? (
              documents.slice(0, 8).map((document) => (
                <div key={document.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="font-medium text-brand-primary">{document.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {document.kind} • {document.status}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                    {document.versions.length} version(s) disponible(s)
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun document accessible"
                description="Créez ou rattachez d’abord un document pour activer la collaboration et la révision."
              />
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}
