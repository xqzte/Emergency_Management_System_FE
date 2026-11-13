"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, LiveConnectionStatus, buttonClasses, logout } from "@ems/shared";
import { hasSeenOnboarding, useSession } from "./_lib/session";

// Placeholder until Day 5 (Home and SOS, screen 2). For now it gates the app: no session means onboarding or sign in.
export default function Home() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session === "signed-out") router.replace(hasSeenOnboarding() ? "/login" : "/onboarding");
  }, [session, router]);

  if (session !== "signed-in") {
    return <p className="p-4 text-base text-muted">Loading…</p>;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <h1 className="text-heading">QuickSave</h1>
      <LiveConnectionStatus />
      <p className="text-base text-muted">You are signed in. Home and SOS arrive on Day 5.</p>
      <Link href="/style" className={buttonClasses("secondary")}>
        View style sheet
      </Link>
      <Button
        variant="secondary"
        onClick={() => {
          void logout().finally(() => router.replace("/login"));
        }}
      >
        Sign out
      </Button>
    </main>
  );
}
