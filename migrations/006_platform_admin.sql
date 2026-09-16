-- Platform admin role and institution quotas

-- Super admin flag for platform-level management
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin INTEGER NOT NULL DEFAULT 0;

-- Institution quotas (set manually by platform admin)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_mosques INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_khatibs INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_price_cents INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_notes TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_users_platform_admin ON users(is_platform_admin) WHERE is_platform_admin = 1;
