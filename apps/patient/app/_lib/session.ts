"use client";

import { useEffect, useState } from "react";
import { getAccessToken, refreshAccessToken, useAccessToken } from "@ems/shared";

export type SessionState = "loading" | "signed-in" | "signed-out";

/**
 * The access token lives in memory, so after a page reload the session is restored from the refresh cookie
 * (POST /auth/refresh, once). Until that answers the state is "loading".
 */
export function useSession(): SessionState {
  const token = useAccessToken();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getAccessToken()) return; // already signed in: the token alone decides the state
    let live = true;
    refreshAccessToken()
      .catch(() => null) // offline: treat as signed out for now
      .finally(() => {
        if (live) setChecked(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (token) return "signed-in";
  return checked ? "signed-out" : "loading";
}

const ONBOARDED_KEY = "quicksave-onboarded";

/** Storage can be blocked (private window), so every access is guarded. */
export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    /* not saved; onboarding shows again next time */
  }
}
