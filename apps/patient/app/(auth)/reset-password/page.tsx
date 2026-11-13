"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button, Input, forgotPassword, resetPassword } from "@ems/shared";
import { AuthShell, FormNotice } from "../../_components/AuthShell";
import { MIN_PASSWORD, OTP_PATTERN, fieldErrors, formMessage, isEmail } from "../../_lib/forms";

function ResetForm() {
  const router = useRouter();
  const [email, setEmail] = useState(useSearchParams().get("email") ?? "");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [local, setLocal] = useState<Record<string, string>>({});

  const request = useMutation({
    mutationFn: () => forgotPassword(email.trim()),
    onSuccess: () => setStep("reset"),
  });
  const reset = useMutation({
    mutationFn: () => resetPassword(email.trim(), otp, password),
    onSuccess: () => router.replace(`/login?reset=1&email=${encodeURIComponent(email.trim())}`),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problems: Record<string, string> = {};
    if (step === "request") {
      if (!isEmail(email)) problems.email = "Enter a valid email address";
    } else {
      if (!OTP_PATTERN.test(otp)) problems.otp = "Enter the 6-digit code";
      if (password.length < MIN_PASSWORD) problems.newPassword = `Use at least ${MIN_PASSWORD} characters`;
      if (confirmPassword !== password) problems.confirm = "The passwords do not match";
    }
    setLocal(problems);
    if (Object.keys(problems).length) return;
    (step === "request" ? request : reset).mutate();
  }

  const active = step === "request" ? request : reset;
  const server = fieldErrors(active.error);
  const message = formMessage(active.error);

  return (
    <AuthShell
      title="Reset your password"
      intro={
        step === "request"
          ? "Enter your email and we will send you a 6-digit code."
          : `If ${email} has an account, we sent it a 6-digit code.`
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {message && <FormNotice kind="error">{message}</FormNotice>}
        {step === "request" ? (
          <Input id="email" label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={local.email ?? server.email} />
        ) : (
          <>
            <Input id="otp" label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} error={local.otp ?? server.otp} />
            <Input id="newPassword" label="New password" type="password" autoComplete="new-password" hint={`At least ${MIN_PASSWORD} characters`} value={password} onChange={(e) => setPassword(e.target.value)} error={local.newPassword ?? server.newPassword} />
            <Input id="confirm" label="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={local.confirm} />
          </>
        )}
        <Button type="submit" fullWidth disabled={active.isPending}>
          {step === "request" ? (request.isPending ? "Sending…" : "Send code") : reset.isPending ? "Saving…" : "Change password"}
        </Button>
      </form>
      {step === "reset" && (
        <Button variant="secondary" fullWidth disabled={request.isPending} onClick={() => request.mutate()}>
          Send a new code
        </Button>
      )}
      <Link href="/login" className="text-base font-semibold text-link underline">
        Back to sign in
      </Link>
    </AuthShell>
  );
}

// Screen 13.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
