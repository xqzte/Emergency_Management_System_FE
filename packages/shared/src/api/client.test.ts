import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, apiRequest, setAuthFailureHandler } from "./client";
import { ApiError, RATE_LIMIT_MESSAGE } from "./errors";
import { getAccessToken, setAccessToken } from "./token";

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
function text(status: number, body: string) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain" } });
}
function authHeader(call: number) {
  return (fetchMock.mock.calls[call][1]?.headers as Record<string, string>).Authorization;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setAccessToken("old-token");
  setAuthFailureHandler(null);
});
afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("sends credentials and the bearer token", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await api.get("/auth/me");
    const init = fetchMock.mock.calls[0][1]!;
    expect(init.credentials).toBe("include");
    expect(authHeader(0)).toBe("Bearer old-token");
  });

  it("omits the token on public calls", async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await api.post("/auth/login", { email: "a", password: "b" }, { auth: false });
    expect(authHeader(0)).toBeUndefined();
  });

  it("returns plain text without trying to parse it as JSON", async () => {
    fetchMock.mockResolvedValueOnce(text(200, "Registration successful"));
    await expect(api.post("/auth/register", {}, { auth: false })).resolves.toBe("Registration successful");
  });

  it("returns null for 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api.put("/hospital/1/beds/increment")).resolves.toBeNull();
  });

  it("refreshes once on 401 and retries once with the new token", async () => {
    fetchMock
      .mockResolvedValueOnce(text(401, ""))
      .mockResolvedValueOnce(json(200, { accessToken: "new-token", role: "PATIENT", userId: 1 }))
      .mockResolvedValueOnce(json(200, { id: 1 }));
    await expect(api.get("/auth/me")).resolves.toEqual({ id: 1 });
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[1][1]?.credentials).toBe("include");
    expect(authHeader(2)).toBe("Bearer new-token");
    expect(getAccessToken()).toBe("new-token");
  });

  it("gives up after one retry and reports the auth failure", async () => {
    const onFail = vi.fn();
    setAuthFailureHandler(onFail);
    fetchMock
      .mockResolvedValueOnce(text(401, ""))
      .mockResolvedValueOnce(json(200, { accessToken: "new-token" }))
      .mockResolvedValueOnce(text(401, ""));
    await expect(api.get("/auth/me")).rejects.toMatchObject({ status: 401, kind: "unauthorized" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onFail).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
  });

  it("does not retry when the refresh fails", async () => {
    fetchMock.mockResolvedValueOnce(text(401, "")).mockResolvedValueOnce(text(401, ""));
    await expect(api.get("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one refresh between parallel 401s", async () => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/auth/refresh")) return json(200, { accessToken: "new-token" });
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === "Bearer new-token" ? json(200, { ok: url }) : text(401, "");
    });
    await Promise.all([api.get("/auth/me"), api.get("/notifications/my"), api.get("/emergency/my-requests")]);
    const refreshCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
  });

  it("does not refresh on 401 for public calls", async () => {
    fetchMock.mockResolvedValueOnce(text(401, ""));
    await expect(api.post("/auth/login", {}, { auth: false })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tells the user to wait on 429", async () => {
    fetchMock.mockResolvedValueOnce(text(429, "Too many requests"));
    await expect(api.post("/auth/login", {}, { auth: false })).rejects.toMatchObject({
      kind: "rate_limited",
      message: RATE_LIMIT_MESSAGE,
    });
  });

  it("keeps validation field messages", async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, { error: "Validation failed", fields: { email: "Must be a valid email address" } }),
    );
    await expect(api.post("/auth/register", {}, { auth: false })).rejects.toMatchObject({
      kind: "validation",
      fields: { email: "Must be a valid email address" },
    });
  });

  it("uses the backend message on 409", async () => {
    fetchMock.mockResolvedValueOnce(json(409, { error: "Already accepted by another hospital" }));
    await expect(api.put("/emergency/assignments/9/accept")).rejects.toMatchObject({
      kind: "conflict",
      message: "Already accepted by another hospital",
    });
  });

  it("turns a failed fetch into a network error", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(api.get("/auth/me")).rejects.toMatchObject({ kind: "network", status: 0 });
  });

  it("blocks forbidden endpoints before any request", async () => {
    for (const path of [
      "/auth/internal/users",
      "/notifications/hospital/assignment",
      "/notifications/patient/accepted",
      "/notifications/hospital/timeout-warning",
    ]) {
      await expect(apiRequest(path)).rejects.toThrow(/forbidden/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adds query parameters and skips empty ones", async () => {
    fetchMock.mockResolvedValueOnce(json(200, []));
    await api.get("/hospital/nearest", { query: { latitude: 9.05, longitude: 7.49, limit: 5, extra: undefined } });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/hospital/nearest?latitude=9.05&longitude=7.49&limit=5");
  });
});
