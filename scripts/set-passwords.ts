/**
 * Password Migration Utility
 * ==========================
 * 
 * This script sets initial passwords for existing users in the database.
 * It's a one-time utility to migrate existing users to the new authentication system.
 * 
 * Usage:
 * npm run migrate-passwords
 * 
 * IMPORTANT: After running this, change these passwords immediately!
 */

import bcrypt from 'bcryptjs';

// User IDs and their initial passwords
const users = [
  {
    id: '04c1f6a6-35e9-4343-9874-c8f24f118d08', // Lawrence Altomare
    email: 'lawrence@altomre.org',
    initialPassword: 'Golden$Compass2024!Temp', // CHANGE IMMEDIATELY
  },
  {
    id: '87f34795-7375-4521-abf9-2f9271ea651a', // Test User
    email: 'test@example.com',
    initialPassword: 'TestAccount1234!Temp', // CHANGE IMMEDIATELY
  },
];

// Generate password hashes
async function generatePasswordHashes() {
  console.log('-- Password Hashes for Migration\n');
  console.log('-- Run these SQL commands to set passwords:\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.initialPassword, 10);
    console.log(`-- User: ${user.email}`);
    console.log(`-- Password: ${user.initialPassword}`);
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE id = '${user.id}';`);
    console.log('');
  }

  console.log('-- IMPORTANT: Change these passwords immediately after first login!');
}

// Execute
generatePasswordHashes().catch(console.error);
