import { StatusBadge } from "@/components/status-badge";
import { numClass, tdClass, thClass } from "@/components/ui/primitives";

const ROWS = [
  {
    unit: "ICU, night",
    role: "RN",
    time: "19:00–07:00",
    hours: 12,
    nurse: "M. Lopez",
    status: "filled",
  },
  { unit: "Med-Surg", role: "LPN", time: "07:00–15:00", hours: 8, nurse: null, status: "open" },
  {
    unit: "Emergency, day",
    role: "CNA",
    time: "08:00–20:00",
    hours: 12,
    nurse: null,
    status: "open",
  },
  {
    unit: "Telemetry",
    role: "RN",
    time: "15:00–23:00",
    hours: 8,
    nurse: null,
    status: "open",
    note: true,
  },
] as const;

/**
 * Fig. 1 on the landing page: an illustrative, report-style table of one evening's shifts.
 * Real markup (not an image), so it reads well at any size and with assistive tech.
 */
export function TonightsBoard() {
  return (
    <figure>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[20rem] border-t border-ink text-left text-[0.875rem]">
          <thead className="border-b border-rule text-small text-muted">
            <tr>
              <th scope="col" className={thClass}>
                Unit
              </th>
              <th scope="col" className={thClass}>
                Role
              </th>
              <th scope="col" className={thClass}>
                Time
              </th>
              <th scope="col" className={`${thClass} ${numClass} hidden sm:table-cell`}>
                Hours
              </th>
              <th scope="col" className={`${thClass} hidden sm:table-cell`}>
                Nurse
              </th>
              <th scope="col" className={thClass}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.unit} className="border-b border-rule last:border-0">
                <td className={tdClass}>{r.unit}</td>
                <td className={`${tdClass} font-mono text-small`}>{r.role}</td>
                <td className={`${tdClass} font-mono text-small whitespace-nowrap`}>{r.time}</td>
                <td className={`${tdClass} ${numClass} hidden sm:table-cell`}>{r.hours}</td>
                <td className={`${tdClass} hidden text-muted sm:table-cell`}>{r.nurse ?? "—"}</td>
                <td className={tdClass}>
                  <StatusBadge status={r.status} />
                  {"note" in r && <sup className="ml-0.5 text-muted">1</sup>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-4 grid gap-1 border-t border-rule pt-3 text-small text-muted sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <span className="font-medium text-ink">Fig. 1 — Tonight&apos;s board</span>
        <span>
          Four shifts at a fictional 300-bed hospital, as an agency sees them. <sup>1</sup> Reopened
          after the assigned nurse cancelled in advance. A claim on it was then declined: the
          nurse&apos;s TB screening had expired.
        </span>
      </figcaption>
    </figure>
  );
}
