"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  Button,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { credentialLabel, expiryHint, formatDateTime } from "./format";
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
                  <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                    {c.expiresAt}
                    <span className="block text-xs text-muted">{expiryHint(c.expiresAt)}</span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-xs text-muted`}>
                    {formatDateTime(c.uploadedAt)}
                  </td>
                  <td className={tdClass}>
                    {c.fileName ? (
                      <a
                        href={`/api/credentials/${encodeURIComponent(c.id)}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand underline-offset-2 hover:underline"
                      >
                        View file<span className="sr-only"> for {c.nurseName}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted">Attestation</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className={tdClass}>
                    <div className="flex gap-2">
                      <Button
                        className="px-2.5 py-1 text-xs"
                        disabled={isBusy}
                        aria-label={`Verify ${credentialLabel(c.type)} for ${c.nurseName}`}
                        onClick={() => void review(c, "verified")}
                      >
                        {isBusy && busy?.decision === "verified" ? "Verifying…" : "Verify"}
                      </Button>
                      <Button
                        variant="danger"
                        className="px-2.5 py-1 text-xs"
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

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Expiring within 30 days</h3>
        {expiringSoon === null ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : expiringSoon.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No credentials expire in the next 30 days.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {expiringSoon.map((e) => (
              <li
                key={`${e.nurseId}-${e.type}-${e.expiresAt}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <span>
                  <span className="font-medium">{e.nurseName}</span>
                  <span className="text-muted"> · {credentialLabel(e.type)}</span>
                </span>
                <span className="tabular-nums text-warning">
                  {e.expiresAt} <span className="text-xs">({expiryHint(e.expiresAt)})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSection>
  );
}
