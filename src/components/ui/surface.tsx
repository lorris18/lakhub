import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-surface-panel p-5 shadow-panel",
        className
      )}
      {...props}
    />
  );
}

