import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Required so the label, hint and error are linked to the field. */
  id: string;
  hint?: string;
  error?: string;
}

export function Input({ label, id, hint, error, className, ...rest }: InputProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-12 rounded-xl border-2 bg-surface px-4 text-base text-ink placeholder:text-muted",
          "focus:border-gold focus:outline-none",
          error ? "border-ink" : "border-ink/20",
          className,
        )}
        {...rest}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-base text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-base font-semibold text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
