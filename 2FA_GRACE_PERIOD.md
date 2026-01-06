# Two-Factor Authentication (2FA) Grace Period

## Overview

Admin and super_admin users are required to enable two-factor authentication (2FA) for security. However, to allow for initial account setup, there is a **7-day grace period** before 2FA becomes mandatory.

## Grace Period Rules

### Admin and Super Admin Users
- **Grace Period:** 7 days from account creation
- **Requirement:** Must enable 2FA before grace period ends
- **During Grace Period:** Can access admin panel without 2FA enabled
- **After Grace Period:** Must enable 2FA to continue accessing admin features

### Member Users
- **No Requirement:** 2FA is optional for members
- **No Grace Period:** Members are never required to use 2FA

## Implementation Details

### Database Schema

The `users` table includes three new columns for 2FA:

```sql
two_factor_enabled BOOLEAN DEFAULT 0,           -- Whether 2FA is enabled
two_factor_secret TEXT,                          -- TOTP secret key
two_factor_grace_period_ends DATETIME,          -- When grace period ends
```

### Automatic Grace Period Assignment

When creating a new user via the admin panel:

1. **Admin/Super Admin Users:** Automatically get `two_factor_grace_period_ends` set to 7 days in the future
2. **Member Users:** `two_factor_grace_period_ends` is set to `NULL` (not required)

### Example Code

```typescript
// From src/lib/users.ts - createUser() function
let gracePeriodEnds = null;
if (role === 'admin' || role === 'super_admin') {
  // Set grace period to 7 days from now
  gracePeriodEnds = "datetime('now', '+7 days')";
}
```

## Testing the Grace Period

When you create an admin or super admin user during testing:

1. **Create the user** in the admin panel
2. **View user details** - you should see the grace period end date
3. **Verify the date** is approximately 7 days from creation

## Future Implementation

The 2FA grace period is now **database-ready**, but the following features are still needed:

1. **2FA Setup Interface:** UI for users to enable 2FA (scan QR code, enter TOTP code)
2. **Grace Period Enforcement:** Check if grace period has expired and require 2FA setup
3. **Login Flow:** Verify 2FA code during authentication (after grace period ends)
4. **Grace Period Warning:** Show countdown/warning when grace period is ending

## Migration

All existing admin and super_admin users have been given a 7-day grace period starting from 2026-01-03.

Migration file: `context/add_2fa_columns.sql`

```sql
-- Set grace period for existing admin and super_admin users
UPDATE users 
SET two_factor_grace_period_ends = datetime('now', '+7 days')
WHERE role IN ('admin', 'super_admin');
```

## Security Notes

- The grace period is designed to allow admins to set up their accounts without being immediately blocked
- After the grace period ends, admins must enable 2FA to access admin features
- Members are never required to use 2FA (it's optional for them)
- The TOTP secret (`two_factor_secret`) is only generated when the user enables 2FA

## Files Modified

1. `src/types.ts` - Added 2FA fields to User interface
2. `src/lib/users.ts` - Updated createUser() to set grace period, updated all queries to fetch 2FA fields
3. `context/schema_users.sql` - Added 2FA columns to table definition
4. `context/add_2fa_columns.sql` - Migration script for existing databases

## Deployment

✅ **Deployed to production** - 2026-01-03
- Both local and remote databases migrated
- Code deployed to Cloudflare Workers
- Grace period automatically assigned to new admin users
