import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DemoAccounts } from "./demo-accounts";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="animate-rise w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" aria-label="ShiftPatch home" className="inline-flex">
            <Logo />
          </Link>
          <p className="mt-2 text-sm text-muted">Sign in to post, pick up, or monitor shifts.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
        <DemoAccounts />
      </div>
    </main>
  );
}
