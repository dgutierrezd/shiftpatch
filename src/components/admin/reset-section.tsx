"use client";

import { useEffect, useRef, useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Section } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";

const CONFIRM_WINDOW_MS = 5_000;

/** Two-step inline confirm (no native dialog): first click arms for 5 s, second click resets. */
export function ResetSection({ onReset }: { onReset: () => Promise<void> }) {
  const notify = useNotify();
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function disarm() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setArmed(false);
  }

  async function onClick() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
      return;
    }
    disarm();
    setPending(true);
    try {
      await api("/api/admin/reset", { method: "POST" });
      notify("success", "Demo data reset");
      await onReset();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title="Demo data" className="print:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[40rem] text-muted">
          Restore the original sample shifts, users and credentials. Everything created since is
          removed; demo requests are kept.
        </p>
        <Button
          variant="danger"
          onClick={() => void onClick()}
          disabled={pending}
          aria-live="polite"
        >
          {pending ? "Resetting…" : armed ? "Click again to confirm" : "Reset demo data"}
        </Button>
      </div>
    </Section>
  );
}
