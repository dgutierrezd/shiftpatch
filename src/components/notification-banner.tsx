"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Kind = "success" | "error";
interface Notice {
  id: number;
  kind: Kind;
  message: string;
}

const NotifyContext = createContext<(kind: Kind, message: string) => void>(() => {});

const VISIBLE_MS = 10_000;

/**
 * One banner at a time with a single `notification-banner` test ID for both success and
 * error (spec) — distinguished by text and styling. Stays up long enough for scripted checks.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((kind: Kind, message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ id: Date.now(), kind, message });
    timer.current = setTimeout(() => setNotice(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        {notice && (
          <div
            key={notice.id}
            data-testid="notification-banner"
            role={notice.kind === "error" ? "alert" : "status"}
            data-kind={notice.kind}
            className={`pointer-events-auto flex max-w-lg items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              notice.kind === "error"
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-success/30 bg-success-soft text-success"
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-2 text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}
