"use client";

import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/primitives";
import { CredentialUploadForm } from "./credential-upload-form";
import { CREDENTIAL_LABELS, credentialBadge, formatLongDay } from "./format";
import { SectionStatus } from "./section-status";
import type { CredentialDto } from "./types";
import type { Resource } from "./use-resource";

export function CredentialsSection({
  credentials,
  today,
  onChanged,
}: {
  credentials: Resource<CredentialDto[]>;
  today: string;
  onChanged: () => void;
}) {
  const list = credentials.data ?? [];

  return (
    <Card title="Credentials">
      <SectionStatus resource={credentials} label="credentials" />
      {credentials.data !== null && list.length === 0 ? (
        <p className="mb-5 text-sm text-muted">No credentials on file yet.</p>
      ) : (
        <ul className="mb-5 divide-y divide-border">
          {list.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm font-medium">{CREDENTIAL_LABELS[c.type] ?? c.type}</p>
                <p className="text-xs text-muted">
                  Expires {formatLongDay(c.expiresAt)}
                  {c.fileName ? ` · ${c.fileName}` : ""}
                </p>
              </div>
              <StatusBadge status={credentialBadge(c, today)} />
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border pt-5">
        <h3 className="mb-3 text-sm font-semibold">Add or renew a credential</h3>
        <CredentialUploadForm today={today} onChanged={onChanged} />
      </div>
    </Card>
  );
}
