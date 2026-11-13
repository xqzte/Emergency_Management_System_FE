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

export interface RegisterInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  /** Minimum 8 characters. */
  password: string;
}

/** POST /auth/register for a patient. The success body is plain text. Next step: verifyOtp. */
export function registerPatient(input: RegisterInput): Promise<string> {
  return api.post<string>("/auth/register", { ...input, role: "PATIENT" }, { auth: false });
}

/** POST /auth/verify-otp (6 digits). Plain text on success. */
export function verifyOtp(email: string, otp: string): Promise<string> {
  return api.post<string>("/auth/verify-otp", { email, otp }, { auth: false });
}

/** POST /auth/resend-otp. */
export function resendOtp(email: string): Promise<string> {
  return api.post<string>("/auth/resend-otp", { email, channel: "EMAIL" }, { auth: false });
}

/** POST /auth/forgot-password. The backend answers the same whether or not the email exists. */
export function forgotPassword(email: string): Promise<string> {
  return api.post<string>("/auth/forgot-password", { email }, { auth: false });
}

/** POST /auth/reset-password with the code from the email. */
export function resetPassword(email: string, otp: string, newPassword: string): Promise<string> {
  return api.post<string>("/auth/reset-password", { email, otp, newPassword }, { auth: false });
}

/** POST /auth/logout, then forget the token even if the call fails. */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}
