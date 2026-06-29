-- ─── Together Mode ─────────────────────────────────────────────────────────
-- Additive migration. Does not modify existing tables beyond one nullable column.

-- 1. Conversation mode on cases
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS conversation_mode TEXT NOT NULL DEFAULT 'invited'
    CHECK (conversation_mode IN ('invited', 'together'));

-- 2. Together session stage enum
CREATE TYPE together_stage AS ENUM (
  'setup',
  'consent',
  'person_a_sharing',
  'person_a_summary_review',
  'person_b_sharing',
  'person_b_summary_review',
  'sharing_confirmation',
  'shared_understanding',
  'issue_discussion',
  'final_agreement',
  'completed'
);

-- 3. Together sessions (one per together-mode case)
CREATE TABLE together_sessions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  stage                       together_stage NOT NULL DEFAULT 'consent',
  current_speaker             TEXT CHECK (current_speaker IN ('person_a', 'person_b')),
  round_number                INTEGER NOT NULL DEFAULT 1,
  person_a_name               TEXT NOT NULL,
  person_b_name               TEXT NOT NULL,
  topic                       TEXT NOT NULL,
  consent_completed_at        TIMESTAMPTZ,
  person_a_ready_confirmed_at TIMESTAMPTZ,
  person_b_ready_confirmed_at TIMESTAMPTZ,
  shared_understanding        JSONB,
  final_report                JSONB,
  completed_at                TIMESTAMPTZ,
  paused_at                   TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id)
);

-- 4. Together messages (plaintext — both parties present)
CREATE TABLE together_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES together_sessions(id) ON DELETE CASCADE,
  case_id           UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  speaker           TEXT NOT NULL CHECK (speaker IN ('person_a', 'person_b')),
  content           TEXT NOT NULL,
  voice_transcript  TEXT,
  message_review    JSONB,      -- MessageReview JSON from AI
  display_content   TEXT,       -- final approved/rewritten content shown to both
  reply_to_id       UUID REFERENCES together_messages(id) ON DELETE SET NULL,
  round_number      INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Together turn summaries
CREATE TABLE together_turn_summaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES together_sessions(id) ON DELETE CASCADE,
  case_id          UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  speaker          TEXT NOT NULL CHECK (speaker IN ('person_a', 'person_b')),
  round_number     INTEGER NOT NULL DEFAULT 1,
  ai_summary       TEXT NOT NULL,
  approved_summary TEXT,
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, speaker, round_number)
);

-- 6. Together issues (extracted after shared understanding)
CREATE TABLE together_issues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES together_sessions(id) ON DELETE CASCADE,
  case_id             UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  neutral_description TEXT NOT NULL,
  priority            INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'discussing', 'agreed', 'partial', 'unresolved', 'skipped')),
  resolution          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Together issue options (proposed solutions)
CREATE TABLE together_issue_options (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id          UUID NOT NULL REFERENCES together_issues(id) ON DELETE CASCADE,
  session_id        UUID NOT NULL REFERENCES together_sessions(id) ON DELETE CASCADE,
  proposed_by       TEXT NOT NULL CHECK (proposed_by IN ('person_a', 'person_b', 'urushi')),
  description       TEXT NOT NULL,
  person_a_response TEXT CHECK (person_a_response IN ('accept', 'accept_with_changes', 'reject', 'need_info')),
  person_b_response TEXT CHECK (person_b_response IN ('accept', 'accept_with_changes', 'reject', 'need_info')),
  person_a_note     TEXT,
  person_b_note     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_together_sessions_case_id        ON together_sessions(case_id);
CREATE INDEX idx_together_messages_session_id     ON together_messages(session_id);
CREATE INDEX idx_together_messages_speaker_round  ON together_messages(session_id, speaker, round_number);
CREATE INDEX idx_together_summaries_session_id    ON together_turn_summaries(session_id);
CREATE INDEX idx_together_issues_session_id       ON together_issues(session_id);
CREATE INDEX idx_together_options_issue_id        ON together_issue_options(issue_id);
CREATE INDEX idx_cases_conversation_mode          ON cases(conversation_mode);

-- ─── updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER together_sessions_updated_at
  BEFORE UPDATE ON together_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER together_issues_updated_at
  BEFORE UPDATE ON together_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS (service role only — access enforced in route handlers) ──────────────
ALTER TABLE together_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE together_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE together_turn_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE together_issues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE together_issue_options ENABLE ROW LEVEL SECURITY;
