import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description, className, ...props }: Props) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-brand-primary md:text-4xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-7 text-text-secondary">{description}</p> : null}
      </div>
    </div>
  );
}
