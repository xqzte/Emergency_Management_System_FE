/**
 * Mock auth: unsigned JWT-shaped tokens and a stand-in for the HttpOnly refresh cookie.
 * The real app keeps the access token in memory only; this file only fakes the server side.
 */
import type { MockUser } from "./data";

/** Short on purpose so 401 then refresh happens while testing. */
export const MOCK_ACCESS_TOKEN_TTL_MS = 2 * 60_000;

const SESSION_KEY = "ems-mock-refresh-session";
let memorySession: number | null = null;

function b64url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function issueMockToken(user: MockUser): string {
  const payload = {
    userId: user.id,
    role: user.role,
    hospitalId: user.hospitalId,
    userName: user.fullName,
    userEmail: user.email,
    exp: Math.floor((Date.now() + MOCK_ACCESS_TOKEN_TTL_MS) / 1000),
  };
  return `${b64url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${b64url(JSON.stringify(payload))}.mock`;
}

export function readMockToken(authorization: string | null): { userId: number; exp: number } | null {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const part = token?.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as {
      userId: number;
      exp: number;
    };
    return payload.exp * 1000 > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

/** The "refresh cookie": survives a reload in the browser like the real 7-day cookie would. */
export function setMockSession(userId: number | null): void {
  memorySession = userId;
  try {
    if (userId === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, String(userId));
  } catch {
    // No localStorage (tests): memory only.
  }
}

export function getMockSession(): number | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return Number(stored);
  } catch {
    // fall through
  }
  return memorySession;
}
