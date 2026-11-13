"use client";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { USE_MOCKS } from "../api/config";
import { ApiError } from "../api/errors";
import { getAccessToken, onAccessTokenChange } from "../api/token";
import { ConnectionStatusLine } from "../realtime/ConnectionStatusLine";
import type { ConnectionStatus } from "../realtime/types";
import { useNotificationSocket } from "../realtime/useNotificationSocket";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Never hammer the API on 4xx (rate limits are tight); retry network and server errors twice.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
        staleTime: 10_000,
      },
      mutations: { retry: false },
    },
  });
}

/** The in-memory access token as React state. */
export function useAccessToken(): string | null {
  return useSyncExternalStore(onAccessTokenChange, getAccessToken, () => null);
}

/** With NEXT_PUBLIC_USE_MOCKS=true, starts MSW before rendering anything that could call the API. */
export function MockApiGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!USE_MOCKS);

  useEffect(() => {
    if (!USE_MOCKS) return;
    let live = true;
    import("../mocks/browser")
      .then((m) => m.startMockApi())
      .catch((error: unknown) => console.error("Mock API failed to start", error))
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (!ready) return <p className="p-4 text-base text-muted">Starting mock data…</p>;
  return <>{children}</>;
}

const RealtimeStatusContext = createContext<ConnectionStatus>("idle");

/**
 * Opens the notification socket for `destination` and refetches on every message:
 * the WebSocket is a signal only, the data always comes from the normal endpoints (CLAUDE.md rule 5).
 */
export function RealtimeProvider({ destination, children }: { destination: string | null; children: ReactNode }) {
  const queryClient = useQueryClient();
  const onMessage = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);
  const status = useNotificationSocket(destination, onMessage);
  return <RealtimeStatusContext.Provider value={status}>{children}</RealtimeStatusContext.Provider>;
}

export function useRealtimeStatus(): ConnectionStatus {
  return useContext(RealtimeStatusContext);
}

/** "Emergency network connected" line, reading the status from RealtimeProvider. */
export function LiveConnectionStatus({ className }: { className?: string }) {
  return <ConnectionStatusLine status={useRealtimeStatus()} className={className} />;
}
