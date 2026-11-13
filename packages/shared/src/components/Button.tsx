import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

/** Also use on links that should look like buttons. */
export function buttonClasses(variant: ButtonVariant = "primary", fullWidth = false): string {
  return cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold text-ink",
    "transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" ? "bg-primary hover:brightness-95" : "border-2 border-ink bg-transparent hover:bg-surface",
    fullWidth && "w-full",
  );
}

export function Button({ variant = "primary", fullWidth = false, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cn(buttonClasses(variant, fullWidth), className)} {...rest} />;
}
