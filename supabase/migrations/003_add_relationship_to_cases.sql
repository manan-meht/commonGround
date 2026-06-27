-- Make recipient_phone nullable (no longer collected at room creation)
-- Add optional relationship field to cases

ALTER TABLE cases
  ALTER COLUMN recipient_phone DROP NOT NULL;

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS relationship TEXT
    CHECK (relationship IN (
      'partner_or_spouse',
      'family_member',
      'friend',
      'colleague',
      'business_partner',
      'manager_or_employee',
      'other'
    ));
