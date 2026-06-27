-- Add user_id to cases (links initiator's Supabase account)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases (user_id);

-- Add user_id to participants (links any participant's Supabase account)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants (user_id);
