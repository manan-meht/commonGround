-- Safe to run on existing data: adds nullable columns only.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS invitation_brief TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS invitation_brief_approved_at TIMESTAMPTZ;
