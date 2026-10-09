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
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            data-testid="login-password-input"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls="password"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
      </Field>
      {error && (
        <p
          className="animate-fade rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full py-2.5"
        disabled={pending}
        data-testid="login-submit-button"
      >
        {pending ? (
          <>
            <span
              aria-hidden="true"
              className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:hidden"
            />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4.5" fill="none">
      <path
        d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth={1.5} />
      {off && <path d="M3 17 17 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />}
    </svg>
  );
}
