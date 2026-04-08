import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-brand-accent",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

