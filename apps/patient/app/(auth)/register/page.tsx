"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Input, registerPatient } from "@ems/shared";
import { AuthShell, FormNotice } from "../../_components/AuthShell";
import { MIN_PASSWORD, fieldErrors, formMessage, isEmail } from "../../_lib/forms";

// Screen 11.
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", password: "", confirm: "" });
  const [local, setLocal] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      registerPatient({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      }),
    onSuccess: () => router.push(`/verify?email=${encodeURIComponent(form.email.trim())}`),
  });

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problems: Record<string, string> = {};
    if (!form.fullName.trim()) problems.fullName = "Enter your full name";
    if (!isEmail(form.email)) problems.email = "Enter a valid email address";
    if (!form.phoneNumber.trim()) problems.phoneNumber = "Enter your phone number";
    if (form.password.length < MIN_PASSWORD) problems.password = `Use at least ${MIN_PASSWORD} characters`;
    if (form.confirm !== form.password) problems.confirm = "The passwords do not match";
    setLocal(problems);
    if (Object.keys(problems).length === 0) mutation.mutate();
  }

  const server = fieldErrors(mutation.error);
  const message = formMessage(mutation.error);
  const err = (key: string) => local[key] ?? server[key];

  return (
    <AuthShell title="Create your account" intro="We will send a 6-digit code to your email to confirm it.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {message && <FormNotice kind="error">{message}</FormNotice>}
        <Input id="fullName" label="Full name" autoComplete="name" value={form.fullName} onChange={set("fullName")} error={err("fullName")} />
        <Input id="email" label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} error={err("email")} />
        <Input id="phoneNumber" label="Phone number" type="tel" autoComplete="tel" inputMode="tel" value={form.phoneNumber} onChange={set("phoneNumber")} error={err("phoneNumber")} />
        <Input id="password" label="Password" type="password" autoComplete="new-password" hint={`At least ${MIN_PASSWORD} characters`} value={form.password} onChange={set("password")} error={err("password")} />
        <Input id="confirm" label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={err("confirm")} />
        <Button type="submit" fullWidth disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-base">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-link underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
