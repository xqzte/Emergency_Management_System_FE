import type { ReactNode } from "react";
import { Card } from "@ems/shared";

export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <header className="flex flex-col gap-2">
        <p className="text-base font-semibold text-link">QuickSave</p>
        <h1 className="text-heading">{title}</h1>
        {intro && <p className="text-base text-muted">{intro}</p>}
      </header>
      <Card className="flex flex-col gap-4">{children}</Card>
    </main>
  );
}

/** Error (alert) or success (status) message above a form. Words carry the meaning, not colour. */
export function FormNotice({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className="rounded-xl border-2 border-ink bg-cream p-3 text-base font-semibold text-ink"
    >
      {kind === "error" ? "Error: " : ""}
      {children}
    </p>
  );
}
