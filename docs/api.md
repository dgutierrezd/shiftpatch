# ShiftPatch API reference

Required routes (exact shapes): see `docs/spec.md`. This file documents the additional
product routes. All routes accept `Authorization: Bearer <token>` or the `sp_session`
cookie set by login. Errors are always `{ "error": "<message>" }`.

`ShiftDto` = `{ id, agencyId, agencyName, role, date, startTime, endTime, status, claimedBy }`.

**List routes wrap their array in a named key**, like the spec's `{ "shifts": [...] }`:
`/api/credentials` → `{ credentials }`, `/api/timesheets` → `{ timesheets }`,
`/api/audit-log` → `{ entries }`, `/api/notifications` → `{ notifications }`.
The item shapes below describe one element of that array.

## Auth
| Route | Who | Response |
|---|---|---|
| `POST /api/auth/login` | public | `{ token, user: { id, name, role } }` + session cookie |
| `GET /api/auth/me` | any | `{ id, name, role, agencyId }` |
| `POST /api/auth/logout` | any | clears cookie |

## Shifts (required — see spec)
`GET /api/shifts` · `POST /api/shifts` (agency) · `POST /api/shifts/:id/claim` (nurse) ·
`POST /api/shifts/:id/cancel` `{ reason: "no-show" | "advance" }` (claiming nurse, owning agency, admin) ·
`GET /api/agencies/:agencyId/shifts` (that agency, admin).

## Credentials
| Route | Who | Notes |
|---|---|---|
| `GET /api/credentials[?status=pending]` | nurse (own) · admin (all) | `[{ id, nurseId, nurseName, type, fileName, expiresAt, status, uploadedAt, reviewedAt }]` |
| `POST /api/credentials` | nurse | multipart: `type` = `license` \| `tb_screening`, `expiresAt` (YYYY-MM-DD, not in the past), `file` (license only; pdf/png/jpeg ≤ 4 MB). TB screening is an attestation — no file. New records are `pending`. |
| `POST /api/credentials/:id/review` | admin | `{ decision: "verified" \| "rejected" }` |
| `GET /api/credentials/:id/file` | owning nurse · admin | file download (audited) |

`type` is `"license" | "tb_screening"`; `status` is `"pending" | "verified" | "rejected"`.
Only `verified` records count toward claim eligibility.

## Timesheets
| Route | Who | Notes |
|---|---|---|
| `GET /api/timesheets` | nurse (own) · agency (its shifts) · admin (all) | `[{ id, shiftId, nurseId, nurseName, agencyId, agencyName, date, startTime, endTime, scheduledHours, workedHours, status }]` |
| `POST /api/timesheets/:id/submit` | owning nurse | `{ workedHours: 0..24 }`, from `pending` |
| `POST /api/timesheets/:id/approve` | owning agency · admin | from `submitted` |

`status` is `"pending" | "submitted" | "approved" | "void"` (void = shift was cancelled).

## Audit, notifications, reporting, admin
| Route | Who | Response |
|---|---|---|
| `GET /api/audit-log[?limit=n]` | admin | `[{ id, actorId, actorRole, action, entity, entityId, metadata, createdAt }]` newest first |
| `GET /api/notifications` | any (own) | `[{ id, kind, subject, body, readAt, createdAt }]` newest 50 |
| `POST /api/notifications/:id/read` | owner | |
| `GET /api/admin/report` | admin | `{ totals: { open, filled, cancelled, total }, fillRate, cancellationsByReason: { "no-show", "advance" }, credentialsExpiringSoon: [{ nurseId, nurseName, type, expiresAt }], pendingCredentialReviews, byAgency: [{ agencyId, agencyName, open, filled }] }` |
| `POST /api/admin/compliance-report` | admin | body `{ reason, nurseIds? }` → `{ generatedAt, generatedBy, reason, nurses: [{ nurseId, name, licenseNumber, licenseExpiresAt, licenseStatus, tbScreeningExpiresAt, tbStatus, eligibleToday }] }` (audited) |
| `POST /api/admin/reset` | admin, `ALLOW_DEMO_RESET=true` | restores spec sample data |
| `POST /api/waitlist` | public | `{ email, organization?, role? }` → 201 |
| `GET /api/cron/deliver-email` | `Bearer CRON_SECRET` | delivers queued notification emails |
