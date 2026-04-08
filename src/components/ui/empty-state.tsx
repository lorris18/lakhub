import { FileQuestion } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface-panel px-6 py-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent-soft text-brand-accent">
        <FileQuestion className="h-5 w-5" />
      </div>
      <h3 className="font-display text-xl text-brand-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

