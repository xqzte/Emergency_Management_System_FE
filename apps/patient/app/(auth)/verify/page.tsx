"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Button, Input, resendOtp, verifyOtp } from "@ems/shared";
import { AuthShell, FormNotice } from "../../_components/AuthShell";
import { OTP_PATTERN, fieldErrors, formMessage } from "../../_lib/forms";

const RESEND_SECONDS = 30;

function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [local, setLocal] = useState<string>();
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const verify = useMutation({
    mutationFn: () => verifyOtp(email, otp),
    onSuccess: () => router.replace("/login?verified=1"),
  });
  const resend = useMutation({
    mutationFn: () => resendOtp(email),
    onSuccess: () => setCooldown(RESEND_SECONDS),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!OTP_PATTERN.test(otp)) return setLocal("Enter the 6-digit code");
    setLocal(undefined);
    verify.mutate();
  }

  if (!email) {
    return (
      <AuthShell title="Verify your email">
        <p className="text-base">We do not know which email to verify. Start again from sign up.</p>
        <Link href="/register" className="text-base font-semibold text-link underline">
          Create an account
        </Link>
      </AuthShell>
    );
  }

  const message = formMessage(verify.error) ?? formMessage(resend.error);
  return (
    <AuthShell title="Enter your code" intro={`We sent a 6-digit code to ${email}.`}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {message && <FormNotice kind="error">{message}</FormNotice>}
        {resend.isSuccess && !message && <FormNotice kind="success">A new code has been sent.</FormNotice>}
        <Input
          id="otp"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          error={local ?? fieldErrors(verify.error).otp}
        />
        <Button type="submit" fullWidth disabled={verify.isPending}>
          {verify.isPending ? "Checking…" : "Verify"}
        </Button>
      </form>
      <Button variant="secondary" fullWidth disabled={cooldown > 0 || resend.isPending} onClick={() => resend.mutate()}>
        {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
      </Button>
    </AuthShell>
  );
}

// Screen 12.
export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
