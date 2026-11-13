"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  MockApiGate,
  PATIENT_DESTINATION,
  RealtimeProvider,
  USE_MOCKS,
  createQueryClient,
  useAccessToken,
} from "@ems/shared";

/**
 * The PWA service worker and MSW's worker cannot both control the page (one worker per scope),
 * so the app worker is registered only in production builds with mocks off (decisions-and-gaps D14).
 */
function useServiceWorker() {
  useEffect(() => {
    if (USE_MOCKS || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  }, []);
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const token = useAccessToken();
  useServiceWorker();

  // Real backend: connect only with a session. Mocks: connect straight away so the status line can be checked.
  const destination = token || USE_MOCKS ? PATIENT_DESTINATION : null;

  return (
    <QueryClientProvider client={queryClient}>
      <MockApiGate>
        <RealtimeProvider destination={destination}>{children}</RealtimeProvider>
      </MockApiGate>
    </QueryClientProvider>
  );
}
