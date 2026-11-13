import { API_BASE_URL } from "./config";
import { ApiError, NETWORK_MESSAGE, toApiError } from "./errors";
import { getAccessToken, setAccessToken } from "./token";

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Plain objects are sent as JSON. FormData is sent as multipart. */
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** false for Public endpoints: no Authorization header and no refresh on 401. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
}

/** CLAUDE.md rule 2: these must never be called. Checked before every request. */
const FORBIDDEN_PATHS = [
  /^\/auth\/internal(\/|$)/,
  /^\/notifications\/hospital\/assignment(\/|$)/,
  /^\/notifications\/patient\//,
  /^\/notifications\/hospital\/timeout-warning(\/|$)/,
];

export function assertAllowedPath(path: string): void {
  if (FORBIDDEN_PATHS.some((re) => re.test(path))) {
    throw new Error(`Blocked call to a forbidden endpoint: ${path}`);
  }
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Many responses are plain text (CLAUDE.md rule 3). Only parse JSON when the content type says so. */
export async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

let refreshInFlight: Promise<string | null> | null = null;
let authFailureHandler: (() => void) | null = null;

/** Called once the session cannot be refreshed (send the user to sign in). */
export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

/**
 * POST /auth/refresh with the cookie only. Requests that fail at the same time share one refresh call.
 * Resolves to the new token, or null when the session is over. Throws ApiError("network") when offline.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      let res: Response;
      try {
        res = await fetch(buildUrl("/auth/refresh"), { method: "POST", credentials: "include" });
      } catch {
        throw new ApiError(0, "network", NETWORK_MESSAGE);
      }
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const body = await parseBody(res);
      const token =
        body && typeof body === "object" && "accessToken" in body && typeof body.accessToken === "string"
          ? body.accessToken
          : null;
      setAccessToken(token);
      return token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions, auth: boolean): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" };
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body,
      credentials: "include", // the refresh cookie must travel (CLAUDE.md rule 4)
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network", NETWORK_MESSAGE);
  }
}

/**
 * The single way to call the backend. Returns parsed JSON, plain text, or null (empty body).
 * On 401: refresh once, retry once. Throws ApiError for every failure.
 */
export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  assertAllowedPath(path);
  const auth = options.auth ?? true;

  let res = await send(path, options, auth);

  if (res.status === 401 && auth) {
    const token = await refreshAccessToken();
    if (token) res = await send(path, options, auth);
    if (res.status === 401) {
      setAccessToken(null);
      authFailureHandler?.();
    }
  }

  const body = await parseBody(res);
  if (!res.ok) throw toApiError(res.status, body);
  return body as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  delete: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
