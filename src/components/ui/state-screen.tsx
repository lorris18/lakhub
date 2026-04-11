"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Compass
} from "lucide-react";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils/cn";

type StateScreenProps = {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
  className?: string;
};

const stateStyles = {
  info: {
    iconClassName: "bg-surface-muted text-brand-primary",
    Icon: Compass
  },
  success: {
    iconClassName: "bg-status-success-soft text-status-success",
    Icon: CheckCircle2
  },
  warning: {
    iconClassName: "bg-status-warning-soft text-brand-primary",
    Icon: AlertTriangle
  },
  danger: {
    iconClassName: "bg-status-danger-soft text-status-danger",
    Icon: AlertCircle
  }
};

export function StateScreen({
  eyebrow = "LAKHub",
  title,
  description,
  action,
  secondaryAction,
  variant = "warning",
  className
}: StateScreenProps) {
  const { Icon, iconClassName } = stateStyles[variant];

  return (
    <main
      className={cn(
        "mx-auto flex min-h-[calc(100vh-81px)] max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8",
        className
      )}
    >
      <Surface className="mx-auto w-full max-w-3xl p-8 sm:p-10">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                iconClassName
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">{eyebrow}</p>
              <h1 className="font-display text-3xl text-brand-primary sm:text-4xl">{title}</h1>
              <div className="max-w-2xl text-sm leading-7 text-text-secondary">{description}</div>
            </div>
          </div>

          {action || secondaryAction ? (
            <div className="flex flex-wrap gap-3">
              {action}
              {secondaryAction}
            </div>
          ) : null}
        </div>
      </Surface>
    </main>
  );
}
