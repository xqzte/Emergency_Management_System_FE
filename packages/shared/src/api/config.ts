/**
 * Runtime configuration. NEXT_PUBLIC_* values are inlined at build time.
 * Switching from mocks to the real backend = change NEXT_PUBLIC_USE_MOCKS and the URLs (docs/mock-data.md).
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

/** SockJS endpoint of the notification service (decisions-and-gaps G7: port 8084 directly for now). */
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8084/ws";

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
