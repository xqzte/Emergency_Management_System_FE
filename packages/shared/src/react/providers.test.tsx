// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATIENT_DESTINATION } from "../realtime/types";

let onLine = true;

beforeEach(() => {
  onLine = true;
  vi.spyOn(window.navigator, "onLine", "get").mockImplementation(() => onLine);
  vi.useFakeTimers();
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("LiveConnectionStatus (mock mode, full provider chain)", () => {
  it("shows No connection while the browser is offline, then recovers", async () => {
    const { RealtimeProvider, LiveConnectionStatus, createQueryClient } = await import("./providers");
    render(
      <QueryClientProvider client={createQueryClient()}>
        <RealtimeProvider destination={PATIENT_DESTINATION}>
          <LiveConnectionStatus />
        </RealtimeProvider>
      </QueryClientProvider>,
    );

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("status").textContent).toBe("Emergency network connected");

    act(() => {
      onLine = false;
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status").textContent).toBe("No connection. Emergency network unavailable.");

    act(() => {
      onLine = true;
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByRole("status").textContent).toBe("Emergency network connected");
  });
});
