import { buttonClasses } from "@ems/shared";

export const metadata = { title: "No connection" };

/**
 * Shown by the service worker when a page cannot load. CLAUDE.md rule 9: never fake an SOS offline.
 * PLACEHOLDER number: 112 is proposed but not decided (decisions-and-gaps Q4).
 */
const EMERGENCY_NUMBER = "112";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <h1 className="text-heading">No internet connection</h1>
      <p className="text-base">
        QuickSave cannot send an emergency request without internet. Nothing has been sent to any hospital.
      </p>
      <p className="text-base font-semibold">If this is an emergency, call now.</p>
      <a href={`tel:${EMERGENCY_NUMBER}`} className={buttonClasses("primary", true)}>
        Call {EMERGENCY_NUMBER}
      </a>
      {/* A full page load on purpose: it re-checks the network through the service worker. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={buttonClasses("secondary", true)}>
        Try again
      </a>
    </main>
  );
}
