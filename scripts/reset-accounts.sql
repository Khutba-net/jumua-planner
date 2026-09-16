-- Run this in Neon SQL Editor to reset all accounts
-- https://console.neon.tech → your project → SQL Editor

TRUNCATE feedback, friday_assignments, sermon_versions, sermons, sub_topics, themes, notifications, org_members, mosques, organizations, magic_links, sessions, users CASCADE;

-- Demo account for recruiters (login via "Try Demo" button)
INSERT INTO users (id, email, name, account_type, role, onboarding_complete, planning_year, is_platform_admin, created_at)
VALUES ('demo-user', 'ahmed@example.com', 'Ahmed', 'individual', 'khatib', 1, 2026, 0, NOW());

-- Platform admin account (login via magic link)
INSERT INTO users (id, email, name, account_type, role, onboarding_complete, planning_year, is_platform_admin, created_at)
VALUES ('platform-admin', 'admin@khutba.net', 'Platform Admin', 'individual', 'khatib', 1, 2026, 1, NOW());
