"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button, Input, login, logout, verifyTwoFactor, type LoginResponse } from "@ems/shared";
import { AuthShell, FormNotice } from "../../_components/AuthShell";
import { OTP_PATTERN, fieldErrors, formMessage, isEmail } from "../../_lib/forms";

const NOT_PATIENT = "This app is for patients. Hospital staff, please use the hospital website.";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [roleError, setRoleError] = useState<string>();

  async function finish(res: LoginResponse) {
    if (res.requiresTwoFactor) {
      setNeedsCode(true);
      return;
    }
    if (res.role !== "PATIENT") {
      await logout().catch(() => undefined);
      setRoleError(NOT_PATIENT);
      return;
    }
    router.replace("/");
  }

  const signIn = useMutation({
    mutationFn: () => login(email.trim(), password),
    onMutate: () => setRoleError(undefined),
    onSuccess: finish,
  });
  const confirm = useMutation({
    mutationFn: () => verifyTwoFactor(email.trim(), otp),
    onMutate: () => setRoleError(undefined),
    onSuccess: finish,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problems: Record<string, string> = {};
    if (needsCode) {
      if (!OTP_PATTERN.test(otp)) problems.otp = "Enter the 6-digit code";
    } else {
      if (!isEmail(email)) problems.email = "Enter a valid email address";
      if (!password) problems.password = "Enter your password";
    }
    setLocal(problems);
    if (Object.keys(problems).length) return;
    (needsCode ? confirm : signIn).mutate();
  }

  const active = needsCode ? confirm : signIn;
  const server = fieldErrors(active.error);
  const message = roleError ?? formMessage(active.error);
  const notice = params.get("verified")
    ? "Email verified. Sign in to continue."
    : params.get("reset")
      ? "Password changed. Sign in with your new password."
      : null;

  return (
    <AuthShell title="Sign in" intro={needsCode ? `Enter the 6-digit code we sent to ${email}.` : undefined}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {notice && !message && <FormNotice kind="success">{notice}</FormNotice>}
        {message && <FormNotice kind="error">{message}</FormNotice>}
        {needsCode ? (
          <Input
            id="otp"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            error={local.otp ?? server.otp}
          />
        ) : (
          <>
            <Input id="email" label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={local.email ?? server.email} />
            <Input id="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={local.password ?? server.password} />
          </>
        )}
        <Button type="submit" fullWidth disabled={active.isPending}>
          {active.isPending ? "Signing in…" : needsCode ? "Verify and sign in" : "Sign in"}
        </Button>
      </form>
      {needsCode ? (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setNeedsCode(false);
            setOtp("");
            confirm.reset();
          }}
        >
          Back
        </Button>
      ) : (
        <div className="flex flex-col gap-2 text-base">
          <Link
            href={`/reset-password${isEmail(email) ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
            className="font-semibold text-link underline"
          >
            Forgot your password?
          </Link>
          <p>
            New here?{" "}
            <Link href="/register" className="font-semibold text-link underline">
              Create an account
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}

// Screen 6.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
