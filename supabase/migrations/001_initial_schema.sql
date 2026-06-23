-- Common Ground — Initial Schema Migration
-- Run against a Supabase project via: npx supabase db push
-- or paste into the Supabase SQL editor.

BEGIN;

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE case_status AS ENUM (
  'draft',
  'awaiting_initiator',
  'awaiting_recipient',
  'ready_for_analysis',
  'analysing',
  'report_ready',
  'needs_safety_review',
  'declined',
  'closed'
);

CREATE TYPE participant_role AS ENUM ('initiator', 'recipient');

CREATE TYPE message_role AS ENUM ('participant', 'assistant');

CREATE TYPE analysis_status AS ENUM ('pending', 'running', 'complete', 'failed');

CREATE TYPE safety_category AS ENUM (
  'ordinary_conflict',
  'high_conflict',
  'possible_coercion_or_abuse',
  'possible_self_harm_or_violence',
  'possible_child_safety_issue',
  'legal_or_professional_support_needed'
);

CREATE TYPE notification_channel AS ENUM ('whatsapp', 'email', 'sms', 'in_app');

CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'delivered', 'failed');

CREATE TYPE agreement_response AS ENUM ('agreed', 'needs_modification', 'not_agreed');

-- ─── cases ────────────────────────────────────────────────────────────────────
CREATE TABLE cases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference      TEXT NOT NULL UNIQUE,          -- short, non-predictable human-readable ref
  topic                 TEXT NOT NULL,
  status                case_status NOT NULL DEFAULT 'draft',
  initiator_name        TEXT NOT NULL,
  recipient_name        TEXT NOT NULL,
  initiator_email       TEXT,
  initiator_phone       TEXT,
  recipient_email       TEXT,
  recipient_phone       TEXT NOT NULL,
  consent_version       TEXT NOT NULL DEFAULT '1.0',
  -- Invitation token (recipient): stored as SHA-256 hash
  invitation_token_hash TEXT,
  invite_expires_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analysis_started_at   TIMESTAMPTZ,
  analysis_completed_at TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ
);

CREATE INDEX idx_cases_public_reference ON cases (public_reference);
CREATE INDEX idx_cases_status ON cases (status);
CREATE INDEX idx_cases_invite_token_hash ON cases (invitation_token_hash) WHERE invitation_token_hash IS NOT NULL;

-- ─── participants ──────────────────────────────────────────────────────────────
CREATE TABLE participants (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  role                   participant_role NOT NULL,
  display_name           TEXT NOT NULL,
  email                  TEXT,
  phone                  TEXT,
  -- Access token: stored as SHA-256 hash; plain token is only ever given to the user
  access_token_hash      TEXT NOT NULL,
  invitation_accepted_at TIMESTAMPTZ,
  consented_at           TIMESTAMPTZ,
  intake_completed_at    TIMESTAMPTZ,
  last_accessed_at       TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (case_id, role)
);

CREATE INDEX idx_participants_case_id ON participants (case_id);
CREATE INDEX idx_participants_access_token_hash ON participants (access_token_hash);

-- ─── intake_messages ──────────────────────────────────────────────────────────
CREATE TABLE intake_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  participant_id    UUID NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  role              message_role NOT NULL,
  -- AES-256-GCM encrypted content stored as base64
  encrypted_content TEXT NOT NULL,
  encryption_iv     TEXT NOT NULL,    -- hex-encoded 12-byte IV
  encryption_tag    TEXT NOT NULL,    -- hex-encoded 16-byte auth tag
  sequence_number   INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (participant_id, sequence_number)
);

CREATE INDEX idx_intake_messages_participant ON intake_messages (participant_id, sequence_number);

-- ─── submissions ──────────────────────────────────────────────────────────────
CREATE TABLE submissions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                     UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  participant_id              UUID NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  encrypted_summary           TEXT NOT NULL,
  encryption_iv               TEXT NOT NULL,
  encryption_tag              TEXT NOT NULL,
  submitted_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consented_for_shared_analysis BOOLEAN NOT NULL DEFAULT FALSE,
  revision_number             INTEGER NOT NULL DEFAULT 1,

  UNIQUE (participant_id, revision_number)
);

CREATE INDEX idx_submissions_case_participant ON submissions (case_id, participant_id);

-- ─── analyses ─────────────────────────────────────────────────────────────────
CREATE TABLE analyses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  status           analysis_status NOT NULL DEFAULT 'pending',
  model            TEXT,
  prompt_version   TEXT,
  -- JSONB structured report (shared, not private — no raw submissions stored here)
  structured_result JSONB,
  safety_category  safety_category,
  safety_explanation TEXT,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (case_id)  -- one analysis per case
);

CREATE INDEX idx_analyses_case_id ON analyses (case_id);

-- ─── agreements ───────────────────────────────────────────────────────────────
CREATE TABLE agreements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  analysis_id         UUID NOT NULL REFERENCES analyses (id) ON DELETE CASCADE,
  agreement_text      TEXT NOT NULL,
  initiator_response  agreement_response,
  recipient_response  agreement_response,
  initiator_note      TEXT,
  recipient_note      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agreements_case_id ON agreements (case_id);

-- ─── notification_logs ────────────────────────────────────────────────────────
CREATE TABLE notification_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  participant_id      UUID REFERENCES participants (id) ON DELETE SET NULL,
  channel             notification_channel NOT NULL,
  template_name       TEXT NOT NULL,
  provider_message_id TEXT,
  status              notification_status NOT NULL DEFAULT 'queued',
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_case_id ON notification_logs (case_id);

-- ─── audit_events ─────────────────────────────────────────────────────────────
-- NEVER store decrypted submission text here.
CREATE TABLE audit_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID REFERENCES cases (id) ON DELETE SET NULL,
  participant_id UUID REFERENCES participants (id) ON DELETE SET NULL,
  event_type   TEXT NOT NULL,   -- e.g. 'invitation_accepted', 'intake_completed', 'token_expired'
  metadata     JSONB,           -- safe, non-sensitive metadata only
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_case_id ON audit_events (case_id);
CREATE INDEX idx_audit_events_event_type ON audit_events (event_type);

-- ─── Trigger: updated_at ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agreements_updated_at BEFORE UPDATE ON agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- All access goes through the service role key server-side.
-- RLS is enabled for defence in depth — no direct client access is permitted.
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — application uses service role key server-side only.
-- No anon or authenticated policies are created intentionally.

COMMIT;
