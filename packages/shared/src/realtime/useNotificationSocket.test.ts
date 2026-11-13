// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationSocketOptions } from "./types";
import { PATIENT_DESTINATION } from "./types";

// Real-backend mode in a unit test: no server, so stand in for STOMP with a socket that connects at once.
vi.mock("./stompSocket", () => ({
  createStompNotificationSocket: (options: NotificationSocketOptions) => ({
    start: () => options.onStatus("connected"),
    stop: () => options.onStatus("idle"),
  }),
}));

let onLine = true;

function goOffline() {
  onLine = false;
  window.dispatchEvent(new Event("offline"));
}
function goOnline() {
  onLine = true;
  window.dispatchEvent(new Event("online"));
}

async function loadHook(useMocks: boolean) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", useMocks ? "true" : "false");
  return (await import("./useNotificationSocket")).useNotificationSocket;
}

beforeEach(() => {
  onLine = true;
  vi.spyOn(window.navigator, "onLine", "get").mockImplementation(() => onLine);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe.each([
  ["mock mode", true],
  ["real backend mode", false],
])("status line follows the browser's online state (%s)", (_name, useMocks) => {
  it("shows offline when the device goes offline and recovers when it returns", async () => {
    const useNotificationSocket = await loadHook(useMocks);
    const { result } = renderHook(() => useNotificationSocket(PATIENT_DESTINATION, () => {}));

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("connected");

    act(goOffline);
    expect(result.current).toBe("offline");

    act(goOnline);
    expect(result.current).toBe("connected");
  });

  it("starts as offline when the page loads without a connection", async () => {
    onLine = false;
    const useNotificationSocket = await loadHook(useMocks);
    const { result } = renderHook(() => useNotificationSocket(PATIENT_DESTINATION, () => {}));
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("offline");
  });
});
