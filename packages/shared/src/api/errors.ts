export type ApiErrorKind =
  | "validation"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server"
  | "network";

export const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a minute, then try again.";
export const NETWORK_MESSAGE = "No connection. Check your internet and try again.";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  /** Field messages from a 400 validation error. Show them next to the inputs. */
  readonly fields?: Record<string, string>;
  readonly body?: unknown;

  constructor(status: number, kind: ApiErrorKind, message: string, fields?: Record<string, string>, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.fields = fields;
    this.body = body;
  }
}

function errorText(body: unknown): string | undefined {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error;
  if (typeof body === "string" && body.trim() && body.length < 300 && !body.trimStart().startsWith("<")) {
    return body.trim();
  }
  return undefined;
}

/** Turns a failed response into one error type with a message that is safe to show to the user. */
export function toApiError(status: number, body: unknown): ApiError {
  const text = errorText(body);

  if (status === 400) {
    const fields =
      body && typeof body === "object" && "fields" in body && body.fields && typeof body.fields === "object"
        ? (body.fields as Record<string, string>)
        : undefined;
    if (fields) return new ApiError(400, "validation", text ?? "Please check the highlighted fields.", fields, body);
    return new ApiError(400, "bad_request", text ?? "Something in the request was not right.", undefined, body);
  }
  // 401 and 403 are Spring defaults (not JSON), so the text is ours.
  if (status === 401) return new ApiError(401, "unauthorized", "Your session has ended. Please sign in again.", undefined, body);
  if (status === 403) return new ApiError(403, "forbidden", "You do not have access to this.", undefined, body);
  if (status === 404) return new ApiError(404, "not_found", text ?? "We could not find that.", undefined, body);
  if (status === 409) return new ApiError(409, "conflict", text ?? "This was already taken.", undefined, body);
  if (status === 429) return new ApiError(429, "rate_limited", RATE_LIMIT_MESSAGE, undefined, body);
  if (status >= 500) {
    return new ApiError(status, "server", text ?? "Something went wrong on our side. Please try again.", undefined, body);
  }
  return new ApiError(status, "bad_request", text ?? "The request failed. Please try again.", undefined, body);
}
