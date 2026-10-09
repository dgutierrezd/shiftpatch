"use client";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Section } from "@/components/ui/primitives";
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
    <Section title="Credentials" dek="Verified by an admin before they count toward claims.">
      <SectionStatus resource={credentials} label="credentials" />
      {credentials.data !== null && list.length === 0 ? (
        <div className="mb-5">
          <EmptyState>No credentials on file yet.</EmptyState>
        </div>
      ) : (
        <ul className="mb-5 border-t border-ink">
          {list.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{CREDENTIAL_LABELS[c.type] ?? c.type}</p>
                <p className="text-small break-all text-muted">
                  Expires {formatLongDay(c.expiresAt)}
                  {c.fileName ? ` · ${c.fileName}` : ""}
                </p>
              </div>
              <StatusBadge status={credentialBadge(c, today)} />
            </li>
          ))}
        </ul>
      )}
      <div className="pt-4">
        <h3 className="mb-4 text-lead text-ink">Add or renew a credential</h3>
        <CredentialUploadForm today={today} onChanged={onChanged} />
      </div>
    </Section>
  );
}
