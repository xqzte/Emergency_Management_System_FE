import { ApiError } from "@ems/shared";

/** Field messages from a 400 validation error, to show next to the inputs. */
export function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError && error.fields ? error.fields : {};
}

/** A message for the alert above the form. Null when the field messages already say it all. */
export function formMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    return error.kind === "validation" ? null : error.message;
  }
  return "Something went wrong. Please try again.";
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const isEmail = (value: string) => EMAIL_PATTERN.test(value.trim());
export const OTP_PATTERN = /^\d{6}$/;
export const MIN_PASSWORD = 8;
