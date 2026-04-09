"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-border-subtle bg-surface-panel px-3 pr-12 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-muted focus:border-brand-accent",
          className
        )}
        {...props}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={isVisible}
        className="absolute inset-y-0 right-3 inline-flex items-center justify-center text-text-muted transition hover:text-brand-primary focus-visible:outline-none focus-visible:text-brand-accent"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
