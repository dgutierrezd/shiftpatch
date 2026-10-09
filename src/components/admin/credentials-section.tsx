"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  Button,
  EmptyState,
  linkClass,
  LoadingLine,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { credentialLabel, daysUntil, expiryHint, formatDateTime } from "./format";
import { AdminSection, TableScroll, TableStatus } from "./section";
import type { CredentialDto, ExpiringCredential, Loadable } from "./types";

type Decision = "verified" | "rejected";

const COLUMNS = ["Nurse", "Type", "Expires", "Uploaded", "File", "Status", "Review"];

export function CredentialsSection({
  credentials,
  expiringSoon,
  onChanged,
}: {
  credentials: Loadable<CredentialDto[]>;
  expiringSoon: ExpiringCredential[] | null;
  onChanged: () => Promise<void>;
}) {
  const notify = useNotify();
  const [busy, setBusy] = useState<{ id: string; decision: Decision } | null>(null);
  const rows = credentials.data ?? [];

  async function review(credential: CredentialDto, decision: Decision) {
    setBusy({ id: credential.id, decision });
    try {
      await api(`/api/credentials/${encodeURIComponent(credential.id)}/review`, {
        body: { decision },
      });
      notify("success", decision === "verified" ? "Credential verified" : "Credential rejected");
      track("credential_reviewed", { decision });
      await onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminSection
      id="credentials"
      title="Credential review queue"
      description="Only verified credentials count toward claim eligibility. Files open through an authorized, audited link."
      error={credentials.data ? credentials.error : null}
    >
      <TableScroll>
        <table className={tableClass}>
          <caption className="sr-only">Credentials awaiting review</caption>
          <thead className={theadClass}>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className={thClass}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const isBusy = busy?.id === c.id;
              return (
                <tr key={c.id} className={trClass}>
                  <td className={tdClass}>{c.nurseName}</td>
                  <td className={tdClass}>{credentialLabel(c.type)}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <span className="font-mono text-small">{c.expiresAt}</span>
                    <span className="block text-small text-muted">{expiryHint(c.expiresAt)}</span>
                  </td>
                  <td className={`${tdClass} font-mono text-small whitespace-nowrap text-muted`}>
                    {formatDateTime(c.uploadedAt)}
                  </td>
                  <td className={tdClass}>
                    {c.fileName ? (
                      <a
                        href={`/api/credentials/${encodeURIComponent(c.id)}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        View file<span className="sr-only"> for {c.nurseName}</span>
                      </a>
                    ) : (
                      <span className="font-serif text-muted italic">attestation</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className={tdClass}>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isBusy}
                        aria-label={`Verify ${credentialLabel(c.type)} for ${c.nurseName}`}
                        onClick={() => void review(c, "verified")}
                      >
                        {isBusy && busy?.decision === "verified" ? "Verifying…" : "Verify"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={isBusy}
                        aria-label={`Reject ${credentialLabel(c.type)} for ${c.nurseName}`}
                        onClick={() => void review(c, "rejected")}
                      >
                        {isBusy && busy?.decision === "rejected" ? "Rejecting…" : "Reject"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            <TableStatus
              colSpan={COLUMNS.length}
              resource={credentials}
              rows={rows.length}
              empty="No credentials waiting for review."
            />
          </tbody>
        </table>
      </TableScroll>

      <div className="mt-10">
        <h3 className="mb-2 text-lead text-ink">Expiring within 30 days</h3>
        {expiringSoon === null ? (
          <LoadingLine label="Loading expiring credentials…" />
        ) : expiringSoon.length === 0 ? (
          <EmptyState>No credentials expire in the next 30 days.</EmptyState>
        ) : (
          <ul className="border-t border-ink">
            {expiringSoon.map((e) => (
              <li
                key={`${e.nurseId}-${e.type}-${e.expiresAt}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule py-3 last:border-0"
              >
                <span>
                  <span className="text-ink">{e.nurseName}</span>
                  <span className="text-muted"> · {credentialLabel(e.type)}</span>
                </span>
                <span
                  className={(daysUntil(e.expiresAt) ?? 0) < 0 ? "text-danger" : "text-warning"}
                >
                  <span className="font-mono text-small">{e.expiresAt}</span>{" "}
                  <span className="text-small">({expiryHint(e.expiresAt)})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSection>
  );
}
