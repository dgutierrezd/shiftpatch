import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Admin dashboard" };

const NAV = [{ href: "/admin", label: "Dashboard" }];

/** Thin server shell; session + data load client-side through the REST routes. */
export default function AdminPage() {
  return (
    <AppShell role="admin" nav={NAV}>
      <AdminDashboard />
    </AppShell>
  );
}
