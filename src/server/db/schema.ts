import {
  bigserial,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Keep in sync with migrations/0001_init.sql — the contract tests run against the SQL file.

export const userRole = pgEnum("user_role", ["nurse", "agency", "admin"]);
export const shiftRole = pgEnum("shift_role", ["RN", "LPN", "CNA"]);
export const shiftStatus = pgEnum("shift_status", ["open", "filled", "cancelled"]);
export const cancellationReason = pgEnum("cancellation_reason", ["no-show", "advance"]);
export const credentialType = pgEnum("credential_type", ["license", "tb_screening"]);
export const credentialStatus = pgEnum("credential_status", ["pending", "verified", "rejected"]);
export const timesheetStatus = pgEnum("timesheet_status", [
  "pending",
  "submitted",
  "approved",
  "void",
]);
export const emailStatus = pgEnum("email_status", ["queued", "sent", "skipped"]);

export const agencies = pgTable("agencies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRole("role").notNull(),
  passwordHash: text("password_hash").notNull(),
  // Set for role = agency; the agency login's user id equals its agency id.
  agencyId: text("agency_id").references(() => agencies.id),
  licenseNumber: text("license_number"),
});

export const shifts = pgTable(
  "shifts",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id),
    role: shiftRole("role").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    status: shiftStatus("status").notNull().default("open"),
    claimedBy: text("claimed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shifts_agency_idx").on(t.agencyId), index("shifts_claimed_idx").on(t.claimedBy)],
);

export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nurseId: text("nurse_id")
      .notNull()
      .references(() => users.id),
    type: credentialType("type").notNull(),
    // TB screening is stored as an attested status only (no document) — see ESCALATION.md.
    blobPathname: text("blob_pathname"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    expiresAt: date("expires_at", { mode: "string" }).notNull(),
    status: credentialStatus("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credentials_nurse_idx").on(t.nurseId)],
);

export const cancellations = pgTable("cancellations", {
  id: uuid("id").primaryKey().defaultRandom(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id),
  reason: cancellationReason("reason").notNull(),
  previousNurseId: text("previous_nurse_id")
    .notNull()
    .references(() => users.id),
  cancelledBy: text("cancelled_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timesheets = pgTable("timesheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id),
  nurseId: text("nurse_id")
    .notNull()
    .references(() => users.id),
  scheduledHours: numeric("scheduled_hours", { precision: 5, scale: 2, mode: "number" }).notNull(),
  workedHours: numeric("worked_hours", { precision: 5, scale: 2, mode: "number" }),
  status: timesheetStatus("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: text("actor_id"),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    emailStatus: emailStatus("email_status").notNull().default("queued"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  organization: text("organization"),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShiftRow = typeof shifts.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type CredentialRow = typeof credentials.$inferSelect;
export type TimesheetRow = typeof timesheets.$inferSelect;
export type AuditRow = typeof auditLog.$inferSelect;
