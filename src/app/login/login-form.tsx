"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Field, Input } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { HOME_BY_ROLE, type SessionUser } from "@/lib/session";

export function LoginForm() {
  const router = useRouter();
  const notify = useNotify();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        body: { email: form.get("email"), password: form.get("password") },
      });
      router.replace(HOME_BY_ROLE[user.role]);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      notify("error", message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="login-email-input"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          data-testid="login-password-input"
        />
      </Field>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending} data-testid="login-submit-button">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
