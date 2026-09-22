-- Remove demo user if it exists
DELETE FROM sessions WHERE user_id = 'demo-user';
DELETE FROM users WHERE id = 'demo-user';

-- Add missing indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_lower_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_org_members_org_status ON org_members(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sermons_author_date ON sermons(author_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_status ON subscriptions(organization_id, status);
