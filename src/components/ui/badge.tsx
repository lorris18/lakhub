import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default: "border-border-subtle bg-surface-elevated text-text-secondary",
        primary: "border-transparent bg-brand-primary/10 text-brand-primary",
        accent: "border-transparent bg-brand-accent-soft text-brand-primary",
        success: "border-transparent bg-status-success-soft text-status-success",
        warning: "border-transparent bg-status-warning-soft text-brand-primary",
        danger: "border-transparent bg-status-danger-soft text-status-danger",
        archived: "border-transparent bg-status-archived-soft text-status-archived",
        subtle: "border-border-subtle bg-transparent text-text-muted"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

type Props = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: Props) {
  return <span className={cn(badgeVariants({ className, variant }))} {...props} />;
}
