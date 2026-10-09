"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Field, Input, Note } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { HOME_BY_ROLE, type SessionUser } from "@/lib/session";

export function LoginForm() {
  const router = useRouter();
  const notify = useNotify();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            data-testid="login-password-input"
            className="pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-controls="password"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-[4px] px-3 text-small text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      {error && (
        <Note tone="danger" role="alert" className="animate-fade-in">
          {error}
        </Note>
      )}
      <Button
        type="submit"
        className="h-10 w-full"
        disabled={pending}
        data-testid="login-submit-button"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
