import type { Metadata } from "next";
import { AgencyDashboard } from "@/components/agency/agency-dashboard";

export const metadata: Metadata = { title: "Agency" };

export default function AgencyPage() {
  return <AgencyDashboard />;
}
