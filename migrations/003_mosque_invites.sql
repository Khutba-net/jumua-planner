-- Add mosque invite system: institution admins can invite mosque admins

ALTER TABLE mosques ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS admin_user_id TEXT REFERENCES users(id);
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS invite_expires_at TEXT;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_mosques_invite_code ON mosques(invite_code);
CREATE INDEX IF NOT EXISTS idx_mosques_admin_user_id ON mosques(admin_user_id);
