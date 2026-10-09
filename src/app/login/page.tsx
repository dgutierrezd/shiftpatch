import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { focusRing } from "@/components/ui/primitives";
import { DemoAccounts } from "./demo-accounts";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 animate-fade-in flex-col px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[26rem]">
        <Link href="/" className={`inline-block rounded-[2px] ${focusRing}`}>
          <Logo />
        </Link>
        <h1 className="mt-14 text-title text-ink">Sign in</h1>
        <p className="mt-2 text-muted">Post, pick up or monitor shifts.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <DemoAccounts />
      </div>
    </main>
  );
}
