"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  MockApiGate,
  RealtimeProvider,
  USE_MOCKS,
  createQueryClient,
  decodeTokenClaims,
  hospitalDestination,
  useAccessToken,
} from "@ems/shared";

/** Mock mode only, before sign-in exists (Day 4): listen to the mock hospital so the status line can be checked. */
const MOCK_HOSPITAL_ID = 1;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const token = useAccessToken();
  const hospitalId = decodeTokenClaims(token)?.hospitalId ?? (USE_MOCKS ? MOCK_HOSPITAL_ID : null);
  const destination = hospitalId != null ? hospitalDestination(hospitalId) : null;

  return (
    <QueryClientProvider client={queryClient}>
      <MockApiGate>
        <RealtimeProvider destination={destination}>{children}</RealtimeProvider>
      </MockApiGate>
    </QueryClientProvider>
  );
}
