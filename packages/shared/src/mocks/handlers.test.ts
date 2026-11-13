import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgotPassword,
  login,
  registerPatient,
  resendOtp,
  resetPassword,
  verifyOtp,
  verifyTwoFactor,
} from "../api/auth";
import { api } from "../api/client";
import { getAccessToken, setAccessToken } from "../api/token";
import type { Assignment, HospitalResponse, MeResponse } from "../api/types";
import { mockNotificationBus } from "../realtime/mockBus";
import { PATIENT_DESTINATION } from "../realtime/types";
import { MOCK_ACCEPT_DELAY_MS, handlers, resetMockDb } from "./handlers";
import { MOCK_ACCESS_TOKEN_TTL_MS, setMockSession } from "./session";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => {
  resetMockDb();
  setMockSession(null);
  setAccessToken(null);
});
afterEach(() => vi.useRealTimers());
afterAll(() => server.close());

describe("mock API through the real client", () => {
  it("logs in, then refreshes after the token expires", async () => {
    await login("patient@example.test", "password123");
    expect((await api.get<MeResponse>("/auth/me")).fullName).toBe("Adam Test");

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + MOCK_ACCESS_TOKEN_TTL_MS + 1000);
    const before = getAccessToken();
    expect((await api.get<MeResponse>("/auth/me")).email).toBe("patient@example.test");
    expect(getAccessToken()).not.toBe(before);
  });

  it("returns plain text on register and field errors on bad input", async () => {
    await expect(
      api.post("/auth/register", { fullName: "A", email: "a@b.co", phoneNumber: "080", password: "password1", role: "PATIENT" }, { auth: false }),
    ).resolves.toMatch(/Registration successful/);
    await expect(
      api.post("/auth/register", { fullName: "A", email: "bad", phoneNumber: "080", password: "short" }, { auth: false }),
    ).rejects.toMatchObject({ kind: "validation", fields: { email: expect.any(String), password: expect.any(String) } });
  });

  it("runs the sign-up and password reset helpers end to end", async () => {
    await expect(
      registerPatient({ fullName: "New Person", email: "new@example.test", phoneNumber: "08011111111", password: "password1" }),
    ).resolves.toMatch(/Registration successful/);
    await expect(verifyOtp("new@example.test", "000000")).rejects.toMatchObject({ status: 400 });
    await expect(verifyOtp("new@example.test", "123456")).resolves.toMatch(/verified/i);
    await expect(resendOtp("new@example.test")).resolves.toMatch(/new code/i);
    await expect(forgotPassword("new@example.test")).resolves.toMatch(/reset code/i);
    await expect(resetPassword("new@example.test", "123456", "short")).rejects.toMatchObject({ kind: "validation" });
    await expect(resetPassword("new@example.test", "123456", "newpassword1")).resolves.toMatch(/reset successful/i);
    expect((await login("new@example.test", "newpassword1")).role).toBe("PATIENT");
  });

  it("rejects wrongpass1 and rate limits the sixth login", async () => {
    await expect(login("patient@example.test", "wrongpass1")).rejects.toMatchObject({ status: 400 });
    for (let i = 0; i < 4; i++) await login("patient@example.test", "password123");
    await expect(login("patient@example.test", "password123")).rejects.toMatchObject({ kind: "rate_limited" });
  });

  it("asks the admin for 2FA, then signs in with 123456", async () => {
    const first = await login("admin@example.test", "password123");
    expect(first.requiresTwoFactor).toBe(true);
    expect(getAccessToken()).toBeNull();
    await verifyTwoFactor("admin@example.test", "123456");
    expect((await api.get<MeResponse>("/auth/me")).role).toBe("HOSPITAL_ADMIN");
  });

  it("lists nearest hospitals with distance, nearest first", async () => {
    const list = await api.get<HospitalResponse[]>("/hospital/nearest", {
      query: { latitude: 9.0579, longitude: 7.4951, limit: 5 },
      auth: false,
    });
    expect(list).toHaveLength(5);
    expect(list[0].name).toBe("Central District Hospital");
    expect(list.map((h) => h.distanceKm)).toEqual([...list.map((h) => h.distanceKm)].sort((a, b) => a! - b!));
  });

  it("returns 409 when another hospital took the case", async () => {
    await login("staff@example.test", "password123");
    const board = await api.get<Assignment[]>("/emergency/assignments/1");
    expect(board).toHaveLength(5);
    await expect(api.put("/emergency/assignments/904/accept")).rejects.toMatchObject({ kind: "conflict" });
    await expect(api.put("/emergency/assignments/901/accept")).resolves.toMatchObject({ status: "ACCEPTED" });
  });

  it("sends EMERGENCY_ACCEPTED to the patient after the SOS", async () => {
    await login("patient@example.test", "password123");
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const received = vi.fn();
    const off = mockNotificationBus.subscribe((dest, msg) => dest === PATIENT_DESTINATION && received(msg.type));
    const req = await api.post<{ id: number; status: string }>("/emergency/request", {
      latitude: 9.0579, longitude: 7.4951, patientCount: 1, description: "Chest pain",
      requestMode: "BROADCAST", transportMode: "SELF", triageLevel: "RED",
    });
    expect(req.status).toBe("ASSIGNED");
    vi.advanceTimersByTime(MOCK_ACCEPT_DELAY_MS);
    expect(received).toHaveBeenCalledWith("EMERGENCY_ACCEPTED");
    off();
    const a = await api.get<Assignment>(`/emergency/requests/${req.id}/assignment`);
    expect(a.status).toBe("ACCEPTED");
    expect(new Date(a.timeoutAt).getTime() - new Date(a.assignedAt).getTime()).toBe(2 * 60_000);
  });

  it("answers no hospital available with 409", async () => {
    await login("patient@example.test", "password123");
    await expect(
      api.post("/emergency/request", {
        latitude: 9.0579, longitude: 7.4951, patientCount: 1, description: "no hospital please",
        requestMode: "BROADCAST", transportMode: "SELF",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
