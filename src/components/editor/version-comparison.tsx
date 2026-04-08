import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import type { DiffSegment } from "@/lib/utils/diff";

type VersionMeta = {
  id: string;
  version_number: number;
  title: string;
};

type Props = {
  versions: VersionMeta[];
  diff: DiffSegment[];
  summary: {
    added: number;
    removed: number;
    unchanged: number;
  };
};

export function VersionComparison({ versions, diff, summary }: Props) {
  const previous = versions.at(0);
  const next = versions.at(-1);

  return (
    <Surface className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Comparaison de versions</p>
          <h3 className="mt-1 font-display text-2xl text-brand-primary">
            {previous && next
              ? `Version ${previous.version_number} -> Version ${next.version_number}`
              : "Historique insuffisant"}
          </h3>
          {previous && next ? (
            <p className="mt-1 text-sm text-text-secondary">
              {previous.title} comparee a {next.title}
            </p>
          ) : (
            <p className="mt-1 text-sm text-text-secondary">
              Creez au moins deux versions pour obtenir une comparaison detaillee.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">Ajouts {summary.added}</Badge>
          <Badge variant="default">Suppressions {summary.removed}</Badge>
          <Badge variant="subtle">Stables {summary.unchanged}</Badge>
        </div>
      </div>

      {diff.length ? (
        <div className="space-y-3">
          {diff.map((segment, index) => (
            <div
              key={`${segment.kind}-${index}`}
              className={
                segment.kind === "added"
                  ? "rounded-2xl border border-brand-accent/20 bg-brand-accent-soft p-4 text-sm text-text-primary"
                  : segment.kind === "removed"
                    ? "rounded-2xl border border-border-strong bg-surface-elevated p-4 text-sm text-text-secondary"
                    : "rounded-2xl border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary"
              }
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {segment.kind === "added"
                  ? "Ajout"
                  : segment.kind === "removed"
                    ? "Suppression"
                    : "Inchange"}
              </p>
              <p className="whitespace-pre-wrap leading-7">{segment.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Surface>
  );
}
