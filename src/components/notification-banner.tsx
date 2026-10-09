"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Kind = "success" | "error";
interface Notice {
  id: number;
  kind: Kind;
  message: string;
  /** True during the short exit fade; the text stays rendered until unmount. */
  leaving: boolean;
}

const NotifyContext = createContext<(kind: Kind, message: string) => void>(() => {});

const VISIBLE_MS = 10_000;
/** Exit fade length; starts only after the full visible window has elapsed. */
const EXIT_MS = 150;

/**
 * One banner at a time with a single `notification-banner` test ID for both success and
 * error (spec) — distinguished by text and the color of its left rule. It mounts
 * synchronously with the notify() call, stays fully readable for 10 s, then fades out.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (removeTimer.current) clearTimeout(removeTimer.current);
    hideTimer.current = null;
    removeTimer.current = null;
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setNotice((n) => (n ? { ...n, leaving: true } : n));
    removeTimer.current = setTimeout(() => setNotice(null), EXIT_MS);
  }, [clearTimers]);

  const notify = useCallback(
    (kind: Kind, message: string) => {
      clearTimers();
      setNotice({ id: Date.now(), kind, message, leaving: false });
      hideTimer.current = setTimeout(dismiss, VISIBLE_MS);
    },
    [clearTimers, dismiss],
  );

  useEffect(() => clearTimers, [clearTimers]);

  const isError = notice?.kind === "error";

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      {notice && (
        <div
          key={notice.id}
          data-testid="notification-banner"
          role={isError ? "alert" : "status"}
          data-kind={notice.kind}
          className={`fixed top-3 right-3 left-3 z-50 ml-auto flex max-w-[26rem] items-start gap-4 rounded-[4px] border border-l-[3px] border-rule bg-paper py-3 pr-2.5 pl-4 text-body text-ink sm:top-4 sm:right-6 ${
            notice.leaving ? "animate-fade-out" : "animate-note-in"
          } ${isError ? "border-l-danger" : "border-l-success"}`}
        >
          <span className="min-w-0 flex-1 pt-px">{notice.message}</span>
          <button
            type="button"
            onClick={dismiss}
            className="-my-0.5 rounded-[3px] p-1.5 text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Dismiss notification"
          >
            <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth={1.25} />
            </svg>
          </button>
        </div>
      )}
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}
