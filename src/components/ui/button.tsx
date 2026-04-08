import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-brand-primary text-white hover:bg-[#162346] dark:hover:bg-[#314984]",
        secondary:
          "border-border-strong bg-surface-panel text-text-primary hover:border-brand-primary hover:text-brand-primary",
        accent:
          "border-transparent bg-brand-accent text-white hover:bg-[#08595f] dark:hover:bg-[#25767d]",
        ghost:
          "border-transparent bg-transparent text-text-secondary hover:bg-brand-accent-soft hover:text-brand-accent"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: Props) {
  return (
    <button
      className={cn(buttonVariants({ className, variant, size }))}
      type={type}
      {...props}
    />
  );
}

