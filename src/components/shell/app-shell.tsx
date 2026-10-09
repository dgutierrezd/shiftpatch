"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
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
        else setUser(me);
      })
      .catch(() => router.replace("/login"));
    return () => {
      active = false;
    };
  }, [role, router]);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href={HOME_BY_ROLE[role]} className="text-lg font-bold tracking-tight text-brand">
              ShiftPatch
            </Link>
            <nav className="flex gap-1 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 ${
                    pathname === item.href
                      ? "bg-brand-soft font-medium text-brand-strong"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user && (
              <span className="text-muted">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              className="rounded-md px-2 py-1 text-muted hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {user ? (
          <UserContext.Provider value={user}>{children}</UserContext.Provider>
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </main>
    </div>
  );
}
