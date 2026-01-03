-- Migration: Update User Roles (Simplified for D1)
-- Date: 2026-01-03
-- Description: Update user roles from old system to new system
-- This script runs individual statements without transactions

-- Step 1: Update existing users to new role structure
UPDATE users SET role = 'super_admin' WHERE role = 'admin';
UPDATE users SET role = 'admin' WHERE role = 'secretary';
-- Members stay as members (no change needed)
-- Guests should be reviewed - you can delete or update them manually:
-- UPDATE users SET role = 'member' WHERE role = 'guest';
-- DELETE FROM users WHERE role = 'guest';

-- Step 2: Since SQLite doesn't support ALTER CONSTRAINT and D1 doesn't support transactions,
-- we need to create a new table and migrate data

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

-- Copy data from old table to new table (with updated roles)
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

-- Verification query - run this to check results
SELECT role, COUNT(*) as count FROM users GROUP BY role;
