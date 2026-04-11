import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { VersionComparison } from "@/components/editor/version-comparison";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { requireCurrentUser } from "@/lib/auth/session";
import { getDocumentVersionComparison, listDocuments } from "@/lib/data/documents";

export default async function VersioningPage() {
  await requireCurrentUser();
  const documents = await listDocuments();
  const snapshot = await Promise.all(
    documents.slice(0, 6).map(async (document) => ({
      document,
      comparison: await getDocumentVersionComparison(document.id)
    }))
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Versions"
        title="Traçabilité et itérations"
        description="Chaque document peut être versionné puis soumis. Cette vue met en avant les écarts et les itérations récentes."
      />

      <div className="space-y-5">
        {snapshot.length ? (
          snapshot.map(({ document, comparison }) => (
            <Surface key={document.id} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl text-brand-primary">{document.title}</h3>
                  <p className="text-sm text-text-secondary">
                    {document.kind} • {document.status}
                  </p>
                </div>
                <Link href={`/documents/${document.id}`} className="text-sm font-medium text-brand-accent">
                  Ouvrir le document
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {comparison.versions.map((version) => (
                  <div key={version.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-brand-primary">Version {version.version_number}</p>
                      <Badge variant="primary">{version.title}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">{version.summary ?? "Résumé non renseigné."}</p>
                  </div>
                ))}
              </div>

              <VersionComparison
                diff={comparison.diff.slice(0, 4)}
                summary={comparison.summary}
                versions={comparison.versions}
              />
            </Surface>
          ))
        ) : (
          <EmptyState
            title="Aucune version disponible"
            description="Créez d’abord un document puis une première version pour activer la traçabilité et les comparaisons."
            action={
              <Link href="/documents">
                <Button variant="primary">Ouvrir les documents</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
