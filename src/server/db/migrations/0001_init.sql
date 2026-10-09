-- ShiftPatch initial schema. Mirrors src/server/db/schema.ts.

CREATE TYPE user_role AS ENUM ('nurse', 'agency', 'admin');
CREATE TYPE shift_role AS ENUM ('RN', 'LPN', 'CNA');
CREATE TYPE shift_status AS ENUM ('open', 'filled', 'cancelled');
CREATE TYPE cancellation_reason AS ENUM ('no-show', 'advance');
CREATE TYPE credential_type AS ENUM ('license', 'tb_screening');
CREATE TYPE credential_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE timesheet_status AS ENUM ('pending', 'submitted', 'approved', 'void');
CREATE TYPE email_status AS ENUM ('queued', 'sent', 'skipped');

CREATE SEQUENCE shift_seq START WITH 4;

CREATE TABLE agencies (
  id text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role user_role NOT NULL,
  password_hash text NOT NULL,
  agency_id text REFERENCES agencies(id),
  license_number text
);

CREATE TABLE shifts (
  id text PRIMARY KEY,
  agency_id text NOT NULL REFERENCES agencies(id),
  role shift_role NOT NULL,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  status shift_status NOT NULL DEFAULT 'open',
  claimed_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shifts_agency_idx ON shifts(agency_id);
CREATE INDEX shifts_claimed_idx ON shifts(claimed_by);

CREATE TABLE credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id text NOT NULL REFERENCES users(id),
  type credential_type NOT NULL,
  blob_pathname text,
  file_name text,
  mime_type text,
  size_bytes integer,
  expires_at date NOT NULL,
  status credential_status NOT NULL DEFAULT 'pending',
  reviewed_by text REFERENCES users(id),
  reviewed_at timestamptz,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credentials_nurse_idx ON credentials(nurse_id);

CREATE TABLE cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id text NOT NULL REFERENCES shifts(id),
  reason cancellation_reason NOT NULL,
  previous_nurse_id text NOT NULL REFERENCES users(id),
  cancelled_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id text NOT NULL REFERENCES shifts(id),
  nurse_id text NOT NULL REFERENCES users(id),
  scheduled_hours numeric(5, 2) NOT NULL,
  worked_hours numeric(5, 2),
  status timesheet_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  approved_by text REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor_id text,
  actor_role text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_created_idx ON audit_log(created_at);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id),
  kind text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  email_status email_status NOT NULL DEFAULT 'queued',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id);

CREATE TABLE login_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  organization text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
