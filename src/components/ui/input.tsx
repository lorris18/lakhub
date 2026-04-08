import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-muted focus:border-brand-accent",
        className
      )}
      {...props}
    />
  );
}

