import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[140px] w-full rounded-xl border border-border-subtle bg-surface-panel px-3 py-3 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-muted focus:border-brand-accent",
        className
      )}
      {...props}
    />
  );
}

