import Link from "next/link";
import { buttonClasses } from "@ems/shared";

// Placeholder until Day 5 (Home and SOS, screen 2).
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <h1 className="text-heading">QuickSave</h1>
      <p className="text-base text-muted">Patient app. Screens arrive from Day 3.</p>
      <Link href="/style" className={buttonClasses("secondary")}>
        View style sheet
      </Link>
    </main>
  );
}
