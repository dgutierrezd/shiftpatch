import { complianceReportSchema } from "@/lib/product-validation";
import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { generateComplianceReport } from "@/server/services/reporting.service";

/** Audited inspection report (replaces the bulk document export — see ESCALATION.md). */
export const POST = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "admin");
  const input = await readJson(req, complianceReportSchema);
  return Response.json(await generateComplianceReport(getDb(), actor, input), {
    headers: { "cache-control": "private, no-store" },
  });
});
