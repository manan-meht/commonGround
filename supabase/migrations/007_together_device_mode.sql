-- Together Mode: add device_mode and person_b_token_hash to together_sessions

ALTER TABLE together_sessions
  ADD COLUMN IF NOT EXISTS device_mode TEXT NOT NULL DEFAULT 'shared'
    CHECK (device_mode IN ('shared', 'separate'));

ALTER TABLE together_sessions
  ADD COLUMN IF NOT EXISTS person_b_token_hash TEXT UNIQUE;

-- Index for fast token lookup on join
CREATE INDEX IF NOT EXISTS idx_together_sessions_person_b_token_hash
  ON together_sessions (person_b_token_hash)
  WHERE person_b_token_hash IS NOT NULL;
