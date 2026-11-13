import { api } from "./client";
import { setAccessToken } from "./token";
import type { LoginResponse } from "./types";

/** POST /auth/login. Keeps the token in memory. If requiresTwoFactor is true there is no token yet: call verifyTwoFactor. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", { email, password }, { auth: false });
  if (res?.token) setAccessToken(res.token);
  return res;
}

/** POST /auth/verify-2fa. The response shape is assumed to match login (decisions-and-gaps Q9). */
export async function verifyTwoFactor(email: string, otp: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/verify-2fa", { email, otp }, { auth: false });
  if (res?.token) setAccessToken(res.token);
  return res;
}

/** POST /auth/logout, then forget the token even if the call fails. */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}
