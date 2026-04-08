import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description, className, ...props }: Props) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl text-brand-primary md:text-3xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm text-text-secondary">{description}</p> : null}
    </div>
  );
}

