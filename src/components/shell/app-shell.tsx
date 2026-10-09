"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { focusRing } from "@/components/ui/primitives";
import { identifyUser, resetAnalytics } from "@/lib/analytics";
import { api } from "@/lib/api-client";
import { HOME_BY_ROLE, type Role, type SessionUser } from "@/lib/session";

const UserContext = createContext<SessionUser | null>(null);

export function useSessionUser(): SessionUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useSessionUser must be used inside <AppShell>");
  return user;
}

const ROLE_LABEL: Record<Role, string> = { nurse: "Nurse", agency: "Agency", admin: "Admin" };

/**
 * Client shell for signed-in areas: resolves the session via /api/auth/me, enforces the
 * role for this area (server routes enforce it again), and renders a thin top bar.
 */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
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
      <header className="border-b border-rule print:hidden">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link href={HOME_BY_ROLE[role]} className={`shrink-0 rounded-[2px] ${focusRing}`}>
              <Logo />
            </Link>
            <span className="text-small text-muted">
              <span aria-hidden="true" className="mr-3 text-rule">
                |
              </span>
              {ROLE_LABEL[role]}
            </span>
          </div>
          <div className="flex min-w-0 items-baseline gap-5 text-small">
            {user && (
              <span className="hidden min-w-0 truncate text-ink sm:inline">
                <span className="sr-only">Signed in as </span>
                {user.name}
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              className={`shrink-0 rounded-[2px] text-muted transition-colors hover:text-ink ${focusRing}`}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pt-10 pb-20 sm:px-8 sm:pt-14">
        {user ? (
          <UserContext.Provider value={user}>
            <div className="animate-fade-in">{children}</div>
          </UserContext.Provider>
        ) : (
          <p role="status" className="text-muted">
            Loading your dashboard…
          </p>
        )}
      </main>
    </div>
  );
}
