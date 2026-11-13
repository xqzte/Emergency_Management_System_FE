/**
 * The access token lives in memory only (CLAUDE.md rule 4). Never write it to storage.
 * The refresh token is an HttpOnly cookie the browser sends because every request uses credentials: 'include'.
 */
let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  if (token === accessToken) return;
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

/** Called on every change, e.g. so the WebSocket reconnects with the fresh token. Returns an unsubscribe function. */
export function onAccessTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface TokenClaims {
  userId?: number;
  role?: string;
  hospitalId?: number | null;
  userName?: string;
  userEmail?: string;
  exp?: number;
}

/** Reads the JWT payload for display and routing only. The backend does the real checks. */
export function decodeTokenClaims(token: string | null = accessToken): TokenClaims | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(base64), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
    );
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}
