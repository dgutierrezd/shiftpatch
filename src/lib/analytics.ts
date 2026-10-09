"use client";

import posthog from "posthog-js";

/**
 * Product analytics. Privacy rules (health-adjacent app): events carry no names, emails,
 * license numbers, or credential/medical details — only opaque ids, roles, and outcomes.
 * Everything no-ops when PostHog isn't configured.
 */
export type AnalyticsEvent =
  | "shift_claimed"
  | "shift_claim_blocked"
  | "shift_posted"
  | "shift_cancelled"
  | "credential_submitted"
  | "credential_reviewed"
  | "timesheet_submitted"
  | "timesheet_approved"
  | "compliance_report_generated"
  | "demo_requested";

type Props = Record<string, string | number | boolean>;

const enabled = () => typeof window !== "undefined" && posthog.__loaded;

export function track(event: AnalyticsEvent, props: Props = {}): void {
  if (enabled()) posthog.capture(event, props);
}

export function identifyUser(user: { id: string; role: string }): void {
  if (enabled()) posthog.identify(user.id, { role: user.role });
}

export function resetAnalytics(): void {
  if (enabled()) posthog.reset();
}
