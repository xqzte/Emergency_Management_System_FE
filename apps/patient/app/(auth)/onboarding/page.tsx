"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClasses } from "@ems/shared";
import { markOnboardingSeen } from "../../_lib/session";

const STEPS = [
  { title: "Get help fast", body: "Press SOS and tell us how serious it is. We alert the hospitals near you." },
  {
    title: "The first hospital to accept takes your case",
    body: "You see which hospital is coming for you and how far it is.",
  },
  {
    title: "Keep your health details ready",
    body: "Add your blood group, allergies and emergency contact so hospitals know what they need.",
  },
];

// Screen 10.
export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  function finish(to: string) {
    markOnboardingSeen();
    router.push(to);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <p className="text-base font-semibold text-link">QuickSave</p>
      <section aria-live="polite" className="flex flex-col gap-3">
        <p className="text-base text-muted">
          Step {index + 1} of {STEPS.length}
        </p>
        <h1 className="text-heading">{step.title}</h1>
        <p className="text-base">{step.body}</p>
      </section>
      <div className="flex flex-col gap-3">
        {last ? (
          <Button fullWidth onClick={() => finish("/register")}>
            Create an account
          </Button>
        ) : (
          <Button fullWidth onClick={() => setIndex(index + 1)}>
            Next
          </Button>
        )}
        <Link href="/login" onClick={markOnboardingSeen} className={buttonClasses("secondary", true)}>
          I already have an account
        </Link>
        {!last && (
          <Button variant="secondary" fullWidth onClick={() => finish("/register")}>
            Skip
          </Button>
        )}
      </div>
    </main>
  );
}
