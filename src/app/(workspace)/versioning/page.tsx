import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { VersionComparison } from "@/components/editor/version-comparison";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getDocumentVersionComparison, listDocuments } from "@/lib/data/documents";

export default async function VersioningPage() {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

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
        eyebrow="Versioning"
        title="Traçabilité des documents"
        description="Chaque document peut être versionné puis soumis. Cette vue donne un aperçu des dernières itérations disponibles."
      />

      <div className="space-y-5">
        {snapshot.map(({ document, comparison }) => (
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
                    <Badge variant="accent">{version.title}</Badge>
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
        ))}
      </div>
    </div>
  );
}
