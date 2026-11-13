import Link from "next/link";
import { buttonClasses } from "@ems/shared";

// Placeholder until Day 4 (Sign in, screen 21).
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 p-8">
      <h1 className="text-heading">QuickSave Hospital</h1>
      <p className="text-base text-muted">Hospital dashboard. Screens arrive from Day 4.</p>
      <Link href="/style" className={buttonClasses("secondary")}>
        View style sheet
      </Link>
    </main>
  );
}
