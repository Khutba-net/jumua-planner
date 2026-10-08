-- Migration 008: Multi-organization membership
-- Allows a single user to belong to multiple organizations simultaneously.
-- The org_members table becomes the source of truth for memberships.
-- users.organization_id is kept as a legacy fallback but no longer authoritative.

-- Backfill: ensure every user with an organization_id has a matching org_members row
INSERT INTO org_members (id, organization_id, user_id, name, email, role, status, created_at, updated_at)
SELECT
  'om_' || substr(md5(random()::text), 1, 20),
  u.organization_id,
  u.id,
  u.name,
  u.email,
  CASE WHEN u.role = 'admin' THEN 'admin' WHEN u.role = 'mosque_admin' THEN 'mosque_admin' ELSE 'khatib' END,
  'active',
  NOW(),
  NOW()
FROM users u
WHERE u.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.user_id = u.id AND om.organization_id = u.organization_id
  );

-- Index for fast membership lookups by user
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON org_members(user_id, organization_id);
