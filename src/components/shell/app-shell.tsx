"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/primitives";
import { identifyUser, resetAnalytics } from "@/lib/analytics";
import { api } from "@/lib/api-client";
import { HOME_BY_ROLE, type Role, type SessionUser } from "@/lib/session";

const UserContext = createContext<SessionUser | null>(null);

export function useSessionUser(): SessionUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useSessionUser must be used inside <AppShell>");
  return user;
}

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Client shell for signed-in areas: resolves the session via /api/auth/me, enforces the
 * role for this area (server routes enforce it again), and renders nav + sign-out.
 */
export function AppShell({
  role,
  nav,
  children,
}: {
  role: Role;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    api<SessionUser>("/api/auth/me")
      .then((me) => {
        if (!active) return;
        if (me.role !== role) router.replace(HOME_BY_ROLE[me.role]);
        else {
          identifyUser(me);
          setUser(me);
        }
      })
      .catch(() => router.replace("/login"));
    return () => {
      active = false;
    };
  }, [role, router]);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    resetAnalytics();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link
              href={HOME_BY_ROLE[role]}
              className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <Logo />
            </Link>
            <nav aria-label="Main" className="flex gap-1 text-sm">
              {nav.map((item) => {
                const current = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                      current
                        ? "bg-brand-soft font-medium text-brand-strong"
                        : "text-muted hover:bg-slate-100 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            {user ? (
              <span className="flex animate-fade items-center gap-2 text-muted">
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong"
                >
                  {initials(user.name)}
                </span>
                <span className="hidden sm:inline">
                  {user.name} · <span className="capitalize">{user.role}</span>
                </span>
                <span className="sr-only sm:hidden">
                  Signed in as {user.name}, {user.role}
                </span>
              </span>
            ) : (
              <Skeleton className="h-7 w-32 rounded-full" />
            )}
            <button
              type="button"
              onClick={signOut}
              className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {user ? (
          <UserContext.Provider value={user}>
            <div className="animate-rise">{children}</div>
          </UserContext.Provider>
        ) : (
          <ShellSkeleton />
        )}
      </main>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

/** Placeholder while the session resolves; announced once for screen readers. */
function ShellSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading your dashboard…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="w-72 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm ${
              i === 0 ? "lg:col-span-2" : ""
            }`}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="w-full" />
            <Skeleton className="w-4/5" />
            <Skeleton className="w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
