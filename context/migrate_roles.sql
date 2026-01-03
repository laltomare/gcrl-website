-- Migration: Update User Roles
-- Date: 2026-01-03
-- Description: Update user roles from old system (admin, secretary, member, guest)
--              to new system (super_admin, admin, member)
--
-- Old Role -> New Role Mapping:
--   admin -> super_admin (existing admins become super admins)
--   secretary -> admin (secretaries become regular admins)
--   member -> member (unchanged)
--   guest -> (removed - any guests should be deleted or set to member)

-- Step 1: Update existing users to new role structure
UPDATE users SET role = 'super_admin' WHERE role = 'admin';
UPDATE users SET role = 'admin' WHERE role = 'secretary';
-- Members stay as members
-- Guests should be reviewed and either deleted or changed to members

-- Step 2: Update the CHECK constraint to only allow new roles
-- Note: SQLite doesn't support ALTER CONSTRAINT, so we need to recreate the table

-- Begin transaction for safety
BEGIN TRANSACTION;

-- Create new users table with updated constraints
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1,
  CHECK (role IN ('super_admin', 'admin', 'member'))
);

-- Copy data from old table to new table
INSERT INTO users_new 
  SELECT id, email, name, role, created_at, updated_at, last_login, is_active 
  FROM users;

-- Drop old table
DROP TABLE users;

-- Rename new table
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Commit transaction
COMMIT;

-- Verification query (run this to verify migration)
SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- Expected output:
-- super_admin: X (former admins)
-- admin: X (former secretaries)
-- member: X (existing members)
