"use client";

import { useRef, useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { CREDENTIAL_LABELS } from "./format";
import type { CredentialDto, CredentialType } from "./types";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

function validate(type: CredentialType, file: File | null, expiresAt: string, today: string) {
  if (type === "license") {
    if (!file) return "Choose a PDF, PNG or JPEG of your license.";
    if (file.size > MAX_BYTES) return "The file must be 4 MB or smaller.";
    if (file.type && !ACCEPTED.includes(file.type))
      return "Only PDF, PNG or JPEG files are accepted.";
  }
  if (!expiresAt) return "Enter the expiry date.";
  if (expiresAt < today) return "The expiry date can't be in the past.";
  return null;
}

/** Multipart upload to POST /api/credentials. New records stay pending until an admin verifies. */
export function CredentialUploadForm({
  today,
  onChanged,
}: {
  today: string;
  onChanged: () => void;
}) {
  const notify = useNotify();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<CredentialType>("license");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isTb = type === "tb_screening";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const picked = data.get("file");
    const file = !isTb && picked instanceof File && picked.size > 0 ? picked : null;
    const expiresAt = String(data.get("expiresAt") ?? "");
    const problem = validate(type, file, expiresAt, today);
    setError(problem);
    if (problem) return;

    const form = new FormData();
    form.set("type", type);
    form.set("expiresAt", expiresAt);
    if (file) form.set("file", file);

    setPending(true);
    try {
      await api<CredentialDto>("/api/credentials", { form });
      notify("success", "Credential submitted for verification");
      track("credential_submitted");
      formRef.current?.reset();
      setType("license");
      onChanged();
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      notify("error", message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Credential type" htmlFor="credential-type">
          <Select
            id="credential-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as CredentialType)}
          >
            {(Object.keys(CREDENTIAL_LABELS) as CredentialType[]).map((t) => (
              <option key={t} value={t}>
                {CREDENTIAL_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Document"
          htmlFor="credential-file"
          hint={
            isTb
              ? "TB screening is recorded as an attestation — don't upload medical documents"
              : "PDF, PNG or JPEG, up to 4 MB."
          }
        >
          <input
            id="credential-file"
            name="file"
            type="file"
            data-testid="credential-upload-input"
            accept="application/pdf,image/png,image/jpeg"
            disabled={isTb}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-slate-50 disabled:opacity-50"
          />
        </Field>
        <Field label="Expiry date" htmlFor="credential-expiry">
          <Input
            id="credential-expiry"
            name="expiresAt"
            type="date"
            min={today}
            required
            data-testid="credential-expiry-date-input"
          />
        </Field>
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit for verification"}
        </Button>
        <p className="text-xs text-muted">
          An admin verifies each upload before it counts toward claiming shifts.
        </p>
      </div>
    </form>
  );
}
