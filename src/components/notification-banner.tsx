"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Kind = "success" | "error";
interface Notice {
  id: number;
  kind: Kind;
  message: string;
  /** True during the short exit animation; the text stays rendered until unmount. */
  leaving: boolean;
}

const NotifyContext = createContext<(kind: Kind, message: string) => void>(() => {});

const VISIBLE_MS = 10_000;
/** Exit animation length; starts only after the full visible window has elapsed. */
const EXIT_MS = 180;

/**
 * One banner at a time with a single `notification-banner` test ID for both success and
 * error (spec) — distinguished by text and styling. It mounts synchronously with the
 * notify() call, stays fully readable for 10 s, then plays a short exit before unmounting.
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
          className={`fixed inset-x-4 top-4 z-50 mx-auto flex w-fit max-w-lg items-start gap-3 overflow-hidden rounded-lg border py-3 pr-3 pl-3.5 text-sm font-medium shadow-lift ${
            notice.leaving ? "animate-banner-out" : "animate-banner-in"
          } ${
            isError
              ? "border-danger/30 bg-danger-soft text-danger"
              : "border-success/30 bg-success-soft text-success"
          }`}
        >
          {isError ? <ErrorIcon /> : <SuccessIcon />}
          <span className="pt-px">{notice.message}</span>
          <button
            type="button"
            onClick={dismiss}
            className="-my-1 ml-1 rounded p-1 text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-current"
            aria-label="Dismiss notification"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* Countdown to auto-dismiss; purely decorative, hidden for reduced motion. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-countdown bg-current opacity-25 motion-reduce:hidden"
            style={{ animationDuration: `${VISIBLE_MS}ms` }}
          />
        </div>
      )}
    </NotifyContext.Provider>
  );
}

function SuccessIcon() {
  return (
    <span
      aria-hidden="true"
      className="mt-px flex size-5 shrink-0 animate-pop items-center justify-center rounded-full bg-success text-white"
    >
      <svg viewBox="0 0 16 16" className="size-3" fill="none">
        <path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={24}
          className="animate-draw"
        />
      </svg>
    </span>
  );
}

function ErrorIcon() {
  return (
    <span
      aria-hidden="true"
      className="mt-px flex size-5 shrink-0 animate-pop items-center justify-center rounded-full bg-danger text-white"
    >
      <svg viewBox="0 0 16 16" className="size-3" fill="none">
        <path d="M8 4v5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <circle cx="8" cy="12" r="1.1" fill="currentColor" />
      </svg>
    </span>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}
