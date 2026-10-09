import type { Metadata } from "next";
import { NurseDashboard } from "@/components/nurse/nurse-dashboard";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "My dashboard" };

/** Thin server shell; session, data and interactions live in client components. */
export default function NursePage() {
  return (
    <AppShell role="nurse" nav={[{ href: "/nurse", label: "My dashboard" }]}>
      <NurseDashboard />
    </AppShell>
  );
}
