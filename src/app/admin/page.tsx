import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Admin dashboard" };

/** Thin server shell; session + data load client-side through the REST routes. */
export default function AdminPage() {
  return (
    <AppShell role="admin">
      <AdminDashboard />
    </AppShell>
  );
}
