import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

let started: Promise<unknown> | null = null;

/** Starts MSW in the browser once. Only API calls are answered; everything else passes through. */
export function startMockApi(): Promise<unknown> {
  if (!started) {
    const worker = setupWorker(...handlers);
    started = worker.start({ onUnhandledFrame: "bypass", quiet: false });
  }
  return started;
}

export { simulateIncomingEmergency, resetMockDb, MOCK_ACCEPT_DELAY_MS } from "./handlers";
