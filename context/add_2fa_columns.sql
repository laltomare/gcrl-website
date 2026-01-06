-- Migration: Add Two-Factor Authentication Columns
-- Date: 2026-01-03
-- Description: Add 2FA fields to users table with grace period support
-- 
-- Grace Period Logic:
-- - Admin and super_admin users get 7 days from account creation to enable 2FA
-- - Member users are NOT required to enable 2FA (optional)
-- - After grace period ends, admin/super_admin must enable 2FA to continue

-- Add 2FA columns to existing users table
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN two_factor_grace_period_ends DATETIME;

-- Set grace period for existing admin and super_admin users
-- They have 7 days from now (2026-01-03) to enable 2FA
UPDATE users 
SET two_factor_grace_period_ends = datetime('now', '+7 days')
WHERE role IN ('admin', 'super_admin');

-- Members don't need 2FA (optional), so no grace period needed
UPDATE users 
SET two_factor_grace_period_ends = NULL
WHERE role = 'member';

-- Verify the changes
SELECT 
  id,
  name,
  email,
  role,
  two_factor_enabled,
  two_factor_grace_period_ends,
  created_at
FROM users;
