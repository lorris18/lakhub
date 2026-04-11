"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type FeedbackBannerProps = {
  title?: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "alert" | "status";
  variant?: "info" | "success" | "warning" | "danger";
};

const variantStyles = {
  info: {
    wrapper: "border-border-subtle bg-surface-elevated text-text-primary",
    icon: "bg-surface-muted text-brand-primary",
    defaultRole: "status" as const,
    Icon: Info
  },
  success: {
    wrapper: "border-status-success/20 bg-status-success-soft/70 text-text-primary",
    icon: "bg-status-success text-white",
    defaultRole: "status" as const,
    Icon: CheckCircle2
  },
  warning: {
    wrapper: "border-status-warning/25 bg-status-warning-soft/75 text-text-primary",
    icon: "bg-brand-accent text-brand-primary",
    defaultRole: "status" as const,
    Icon: AlertTriangle
  },
  danger: {
    wrapper: "border-status-danger/25 bg-status-danger-soft/75 text-text-primary",
    icon: "bg-status-danger text-white",
    defaultRole: "alert" as const,
    Icon: AlertCircle
  }
};

export function FeedbackBanner({
  title,
  description,
  action,
  className,
  role,
  variant = "info"
}: FeedbackBannerProps) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        styles.wrapper,
        className
      )}
      role={role ?? styles.defaultRole}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            styles.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          {title ? <p className="font-medium text-brand-primary">{title}</p> : null}
          <div className="text-sm leading-6 text-text-secondary">{description}</div>
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
