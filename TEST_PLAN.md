# User CRUD System Test Plan

**Project:** GCRL Website - User Management System  
**Deployment URL:** https://gcrl-website.lawrence-675.workers.dev  
**Test Base URL:** https://gcrl-website.lawrence-675.workers.dev/admin/users  
**Date:** 2026-01-03  
**Version:** 1.0

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Data](#test-data)
4. [Functional Test Cases](#functional-test-cases)
5. [UI/UX Testing](#uiux-testing)
6. [Security Testing](#security-testing)
7. [Edge Case Testing](#edge-case-testing)
8. [Performance Observations](#performance-observations)
9. [Success Criteria](#success-criteria)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Prerequisites

### Required Access
- [ ] Admin access to GCRL website (verify you can login at `/admin`)
- [ ] Access to Cloudflare D1 database (via Wrangler or dashboard)
- [ ] Browser with developer tools (Chrome/Firefox recommended)

### Before Testing Begins
- [ ] Verify deployment is live: https://gcrl-website.lawrence-675.workers.dev
- [ ] Check browser console for errors on page load
- [ ] Confirm database tables exist (run: `npx wrangler d1 execute GCRL_DB --local --command "SELECT name FROM sqlite_master WHERE type='table'"`)

---

## Test Environment Setup

### 1. Verify Database Tables
```bash
# Local check
npx wrangler d1 execute GCRL_DB --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# Expected output:
# users
# sessions
# (other existing tables)
```

### 2. Verify Indexes Created
```bash
npx wrangler d1 execute GCRL_DB --local --command "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users'"
```

Expected indexes:
- `idx_users_email`
- `idx_users_role`
- `idx_users_active`
- `idx_users_created_at`

### 3. Access Admin Panel
1. Navigate to: https://gcrl-website.lawrence-675.workers.dev/admin
2. Login with admin credentials
3. Navigate to: https://gcrl-website.lawrence-675.workers.dev/admin/users

---

## Test Data

### Sample Users for Testing

| Email | Name | Role | Purpose |
|-------|------|------|---------|
| john.doe@example.com | John Doe | member | Basic member testing |
| jane.smith@example.com | Jane Smith | secretary | Secretary role testing |
| admin.test@example.com | Admin Test | admin | Admin functionality |
| guest.user@example.com | Guest User | guest | Guest role testing |
| inactive@example.com | Inactive User | member | Deactivation testing |

---

## Functional Test Cases

### Test Suite 1: User List Page

#### TC-1.1: View Empty User List
**Precondition:** Database has no users (or start fresh)  
**Steps:**
1. Navigate to `/admin/users`
2. Observe the page

**Expected Results:**
- [ ] Page loads without errors
- [ ] Statistics show "0" for all counts
- [ ] Empty state message displayed or "No users found"
- [ ] Filter controls are visible
- [ ] "Create New User" button is visible

---

#### TC-1.2: View User List with Data
**Precondition:** At least one user exists in database  
**Steps:**
1. Navigate to `/admin/users`
2. Observe the user table

**Expected Results:**
- [ ] Users displayed in table format
- [ ] Each row shows: Name, Email, Role, Status, Created Date, Actions
- [ ] Statistics cards show correct counts
- [ ] Role badges have correct colors (admin=purple, secretary=blue, member=green, guest=gray)
- [ ] Active users show green "Active" badge
- [ ] Inactive users show gray "Inactive" badge
- [ ] Actions column has "View", "Edit", "Activate/Deactivate", "Delete" buttons

---

#### TC-1.3: Filter Users by Role
**Steps:**
1. Navigate to `/admin/users`
2. Click role filter dropdown
3. Select "admin"
4. Observe filtered results

**Expected Results:**
- [ ] Only admin users displayed
- [ ] Statistics update to show filtered count
- [ ] Filter indicator visible
- [ ] Can clear filter

**Repeat for:** secretary, member, guest

---

#### TC-1.4: Filter Users by Status
**Steps:**
1. Navigate to `/admin/users`
2. Click status filter
3. Select "Active" or "Inactive"

**Expected Results:**
- [ ] Only users matching status displayed
- [ ] Statistics update accordingly
- [ ] Filter can be cleared

---

### Test Suite 2: Create User

#### TC-2.1: Create User - All Valid Fields
**Steps:**
1. Navigate to `/admin/users`
2. Click "Create New User" button
3. Fill in form:
   - Email: `test.user@example.com`
   - Name: `Test User`
   - Role: `member`
4. Click "Create User"

**Expected Results:**
- [ ] Redirects to user detail page
- [ ] Success message displayed
- [ ] User visible in database
- [ ] All fields saved correctly
- [ ] Created_at timestamp set correctly
- [ ] User is active by default

---

#### TC-2.2: Create User - Duplicate Email
**Steps:**
1. Attempt to create user with email that already exists
2. Click "Create User"

**Expected Results:**
- [ ] Error message displayed
- [ ] Message indicates duplicate email
- [ ] User not created
- [ ] Form pre-filled with submitted values

---

#### TC-2.3: Create User - Invalid Email
**Steps:**
1. Create user with email: `invalid-email`
2. Click "Create User"

**Expected Results:**
- [ ] Validation error displayed
- [ ] User not created

**Test with:** 
- Empty email
- Email without @
- Email without domain

---

#### TC-2.4: Create User - Empty Required Fields
**Steps:**
1. Leave email empty
2. Leave name empty
3. Click "Create User"

**Expected Results:**
- [ ] Validation error for email
- [ ] Validation error for name
- [ ] User not created

---

#### TC-2.5: Create User - All Roles
**Steps:**
1. Create users with each role type:
   - admin
   - secretary
   - member
   - guest

**Expected Results:**
- [ ] All users created successfully
- [ ] Role badges display correctly
- [ ] Can filter by each role

---

### Test Suite 3: View User Details

#### TC-3.1: View User Profile
**Steps:**
1. Navigate to `/admin/users`
2. Click "View" button on any user
3. Observe user detail page

**Expected Results:**
- [ ] User information displayed:
  - Name
  - Email
  - Role badge
  - Status (Active/Inactive)
  - Created date (formatted)
  - Updated date (formatted)
  - Last login date (or "Never")
- [ ] "Active Sessions" section visible
- [ ] Action buttons available (Edit, Deactivate/Delete, Back to List)

---

#### TC-3.2: View User with Sessions
**Precondition:** User has active sessions  
**Steps:**
1. View user detail page
2. Scroll to "Active Sessions" section

**Expected Results:**
- [ ] Session list displayed
- [ ] Each session shows:
  - Created date
  - Expiration date
  - Token (masked or truncated)
- [ ] "Revoke" button for each session
- [ ] "Revoke All Sessions" button

---

#### TC-3.3: View User Without Sessions
**Precondition:** User has no sessions  
**Steps:**
1. View user detail page
2. Scroll to "Active Sessions" section

**Expected Results:**
- [ ] "No active sessions" message displayed
- [ ] No "Revoke" buttons visible

---

### Test Suite 4: Edit User

#### TC-4.1: Update User Name
**Steps:**
1. Navigate to user detail page
2. Click "Edit" button
3. Change name field
4. Click "Update User"

**Expected Results:**
- [ ] Redirects to user detail page
- [ ] Success message displayed
- [ ] Name updated
- [ ] Updated_at timestamp changed

---

#### TC-4.2: Update User Email (Valid, Non-Duplicate)
**Steps:**
1. Edit user
2. Change email to new unique email
3. Click "Update User"

**Expected Results:**
- [ ] Email updated successfully
- [ ] User can login with new email (if auth implemented)

---

#### TC-4.3: Update User Email (Duplicate)
**Steps:**
1. Edit user
2. Change email to email that exists for another user
3. Click "Update User"

**Expected Results:**
- [ ] Error message displayed
- [ ] Email not changed
- [ ] Can correct and resubmit

---

#### TC-4.4: Update User Role
**Steps:**
1. Edit user
2. Change role to different value
3. Click "Update User"

**Expected Results:**
- [ ] Role updated successfully
- [ ] Role badge color changes
- [ ] Updated_at timestamp changed

**Test all role transitions:**
- member → admin
- admin → member
- member → secretary
- secretary → guest
- etc.

---

#### TC-4.5: Partial Update (Name Only)
**Steps:**
1. Edit user
2. Change only name
3. Leave other fields unchanged
4. Click "Update User"

**Expected Results:**
- [ ] Only name updated
- [ ] Email and role unchanged
- [ ] Update successful

---

### Test Suite 5: Deactivate/Activate User

#### TC-5.1: Deactivate Active User
**Steps:**
1. Navigate to user detail page
2. Click "Deactivate" button
3. Confirm action

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] After confirm, user deactivated
- [ ] Status badge shows "Inactive" (gray)
- [ ] User disappears from "Active" filter
- [ ] User appears in "Inactive" filter
- [ ] Success message displayed

---

#### TC-5.2: Activate Inactive User
**Steps:**
1. Navigate to inactive user detail page
2. Click "Activate" button
3. Confirm action

**Expected Results:**
- [ ] User activated successfully
- [ ] Status badge shows "Active" (green)
- [ ] User appears in "Active" filter
- [ ] Success message displayed

---

#### TC-5.3: Cancel Deactivation
**Steps:**
1. Click "Deactivate" button
2. Click "Cancel" in confirmation dialog

**Expected Results:**
- [ ] Dialog closes
- [ ] User remains active
- [ ] No changes made

---

### Test Suite 6: Delete User

#### TC-6.1: Delete User Without Sessions
**Precondition:** User has no active sessions  
**Steps:**
1. Navigate to user detail page
2. Click "Delete" button
3. Confirm deletion

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] After confirm, user deleted
- [ ] Redirected to user list
- [ ] User no longer in list
- [ ] User removed from database
- [ ] Success message displayed

---

#### TC-6.2: Delete User With Sessions (Cascade)
**Precondition:** User has active sessions  
**Steps:**
1. Navigate to user detail page
2. Note the number of sessions
3. Click "Delete" button
4. Confirm deletion

**Expected Results:**
- [ ] User deleted
- [ ] All associated sessions deleted (cascade)
- [ ] Verify sessions table: no orphaned sessions with that user_id

**Verification Query:**
```sql
SELECT * FROM sessions WHERE user_id = '[deleted_user_id]'
-- Should return 0 rows
```

---

#### TC-6.3: Cancel Deletion
**Steps:**
1. Click "Delete" button
2. Click "Cancel" in confirmation dialog

**Expected Results:**
- [ ] Dialog closes
- [ ] User not deleted
- [ ] Remain on detail page

---

### Test Suite 7: Session Management

#### TC-7.1: Revoke Single Session
**Precondition:** User has multiple active sessions  
**Steps:**
1. Navigate to user detail page
2. Find "Active Sessions" section
3. Click "Revoke" button on one session
4. Confirm action

**Expected Results:**
- [ ] Session deleted from database
- [ ] Session disappears from list
- [ ] Other sessions remain intact
- [ ] Success message displayed

---

#### TC-7.2: Revoke All Sessions
**Precondition:** User has multiple active sessions  
**Steps:**
1. Navigate to user detail page
2. Click "Revoke All Sessions" button
3. Confirm action

**Expected Results:**
- [ ] All sessions deleted
- [ ] "No active sessions" message displayed
- [ ] Success message displayed
- [ ] User account remains intact

---

#### TC-7.3: View Session Details
**Precondition:** User has active sessions  
**Steps:**
1. Navigate to user detail page
2. Observe session information

**Expected Results:**
- [ ] Session created date shown (human-readable format)
- [ ] Session expiration date shown
- [ ] Can identify which sessions expire soon

---

### Test Suite 8: Navigation

#### TC-8.1: Breadcrumb Navigation
**Steps:**
1. Navigate from user list → user detail
2. Click "Users" breadcrumb or "Back to List"

**Expected Results:**
- [ ] Returns to user list page
- [ ] Filters preserved (if any were active)

---

#### TC-8.2: Direct URL Access
**Steps:**
1. Navigate directly to: `/admin/users/[user_id]`

**Expected Results:**
- [ ] User detail page loads
- [ ] If user_id doesn't exist: 404 or error page

---

#### TC-8.3: Browser Back/Forward
**Steps:**
1. Navigate through multiple pages
2. Use browser back button
3. Use browser forward button

**Expected Results:**
- [ ] Navigation works correctly
- [ ] Page state maintained
- [ ] No errors in console

---

## UI/UX Testing

### Test Suite 9: Responsive Design

#### TC-9.1: Desktop View (1920x1080)
**Steps:**
1. Open browser at full screen
2. Navigate through user management pages

**Expected Results:**
- [ ] Layout looks good
- [ ] No horizontal scrolling
- [ ] Buttons and links easily clickable
- [ ] Table readable

---

#### TC-9.2: Tablet View (768x1024)
**Steps:**
1. Resize browser to tablet width
2. Navigate pages

**Expected Results:**
- [ ] Layout adapts
- [ ] Table may scroll horizontally
- [ ] Buttons still accessible
- [ ] No overlapping elements

---

#### TC-9.3: Mobile View (375x667)
**Steps:**
1. Resize browser to mobile width
2. Navigate pages

**Expected Results:**
- [ ] Layout stacks vertically
- [ ] Horizontal scroll on table acceptable
- [ ] Buttons large enough for touch
- [ ] Text readable

---

### Test Suite 10: Visual Consistency

#### TC-10.1: Role Badge Colors
**Verification:**
- [ ] Admin: Purple/pink badge
- [ ] Secretary: Blue badge
- [ ] Member: Green badge
- [ ] Guest: Gray badge

---

#### TC-10.2: Status Indicators
**Verification:**
- [ ] Active: Green badge or indicator
- [ ] Inactive: Gray badge
- [ ] Clear visual distinction

---

#### TC-10.3: Button Styling
**Verification:**
- [ ] Primary action (Create, Update): Prominent style
- [ ] Destructive action (Delete): Red/warning color
- [ ] Secondary action (Cancel): Muted style
- [ ] Hover states on all buttons

---

#### TC-10.4: Form Validation
**Verification:**
- [ ] Error messages in red/warning color
- [ ] Success messages in green
- [ ] Field-level errors displayed near field
- [ ] Clear visual feedback

---

### Test Suite 11: Accessibility

#### TC-11.1: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate through pages
2. Use Enter to activate buttons
3. Use Shift+Tab to go backwards

**Expected Results:**
- [ ] All interactive elements reachable via Tab
- [ ] Logical tab order
- [ ] Focus indicators visible
- [ ] Enter key activates buttons

---

#### TC-11.2: Screen Reader Compatibility
**Steps:**
1. Use browser screen reader (if available)
2. Navigate pages

**Expected Results:**
- [ ] Form fields have labels
- [ ] Buttons have descriptive text
- [ ] Table headers announced
- [ ] Status and role read correctly

---

## Security Testing

### Test Suite 12: Input Validation

#### TC-12.1: SQL Injection Attempts
**Steps:**
1. Create user with email: `test@example.com'; DROP TABLE users; --`
2. Create user with name: `<script>alert('xss')</script>`

**Expected Results:**
- [ ] Input sanitized or rejected
- [ ] No SQL errors
- [ ] No XSS execution
- [ ] Characters properly escaped in display

---

#### TC-12.2: Email Validation
**Test Cases:**
- `plainaddress` → [ ] Rejected
- `@missinglocal.com` → [ ] Rejected
- `missingdomain@.com` → [ ] Rejected
- `test@example..com` → [ ] Rejected
- `test+tag@example.com` → [ ] Accepted (valid)
- `test@example.co.uk` → [ ] Accepted (valid)

---

#### TC-12.3: Role Validation
**Steps:**
1. Try to create user with role: `hacker`
2. Try to edit user to role: `superadmin`

**Expected Results:**
- [ ] Invalid roles rejected
- [ ] Only allowed roles: admin, secretary, member, guest

---

### Test Suite 13: Authorization

#### TC-13.1: Access Without Authentication
**Steps:**
1. Logout (if possible)
2. Navigate directly to: `/admin/users`

**Expected Results:**
- [ ] Redirected to login
- [ ] Or 403/401 error
- [ ] Cannot access without proper auth

---

#### TC-13.2: Cross-User Data Access
**Steps:**
1. Create user A
2. Try to access user A's data via different user session (if multi-user auth works)

**Expected Results:**
- [ ] Cannot access other users' data
- [ ] Proper isolation

---

## Edge Case Testing

### Test Suite 14: Boundary Cases

#### TC-14.1: Very Long Names
**Steps:**
1. Create user with name: `A very long name that exceeds typical limits...` (200+ characters)

**Expected Results:**
- [ ] Accepted or gracefully truncated
- [ ] No database errors
- [ ] Display handles long text (wrapping or truncation)

---

#### TC-14.2: Special Characters in Names
**Test Cases:**
- `O'Brien` → [ ] Accepted
- `José María` → [ ] Accepted
- `张三` → [ ] Accepted (Unicode)
- `John "The Rock" Doe` → [ ] Accepted

---

#### TC-14.3: Rapid Actions
**Steps:**
1. Create user
2. Immediately edit
3. Immediately delete
4. All within seconds

**Expected Results:**
- [ ] All actions complete successfully
- [ ] No race conditions
- [ ] Database consistency maintained

---

#### TC-14.4: Concurrent User Creation
**Steps:**
1. Open two browser tabs
2. Create users simultaneously in both tabs

**Expected Results:**
- [ ] Both users created
- [ ] No conflicts (unless same email)
- [ ] Proper error if duplicate email

---

#### TC-14.5: Non-Existent User ID
**Steps:**
1. Navigate to: `/admin/users/non-existent-id`

**Expected Results:**
- [ ] 404 error or "User not found" message
- [ ] No crash or database error
- [ ] Can navigate back to list

---

### Test Suite 15: Data Consistency

#### TC-15.1: Timestamp Consistency
**Steps:**
1. Create user
2. Note created_at time
3. Wait a few seconds
4. Update user
5. Note updated_at time

**Expected Results:**
- [ ] created_at remains unchanged
- [ ] updated_at is later than created_at
- [ ] Timezone handling correct

---

#### TC-15.2: Cascade Delete Verification
**Steps:**
1. Create user with sessions
2. Delete user
3. Check sessions table

**Expected Results:**
- [ ] No orphaned sessions remain
- [ ] Foreign key constraint working

**Verification Query:**
```sql
SELECT COUNT(*) FROM sessions WHERE user_id NOT IN (SELECT id FROM users);
-- Should be 0
```

---

## Performance Observations

### Test Suite 16: Load Testing

#### TC-16.1: Large User List
**Steps:**
1. Create 50+ users (via script or manual)
2. Navigate to user list page

**Expected Results:**
- [ ] Page loads within 2 seconds
- [ ] Pagination or infinite scroll (if implemented)
- [ ] Browser remains responsive

---

#### TC-16.2: Filter Performance
**Steps:**
1. With 50+ users
2. Apply filters

**Expected Results:**
- [ ] Filters apply quickly (< 1 second)
- [ ] No page reloads (ideally client-side)

---

#### TC-16.3: Database Query Performance
**Steps:**
1. Monitor query execution time (via browser dev tools)

**Expected Results:**
- [ ] User list query: < 500ms
- [ ] User detail query: < 200ms
- [ ] Create/update operations: < 300ms

---

## Success Criteria

### Overall Pass/Fail Criteria

**Test Suite Pass Threshold:** Each suite must pass at least 90% of test cases

**Critical Test Cases (Must Pass):**
- [x] TC-2.1: Create User - All Valid Fields
- [x] TC-2.2: Create User - Duplicate Email
- [x] TC-4.1: Update User Name
- [x] TC-5.1: Deactivate Active User
- [x] TC-5.2: Activate Inactive User
- [x] TC-6.1: Delete User Without Sessions
- [x] TC-6.2: Delete User With Sessions (Cascade)
- [x] TC-12.1: SQL Injection Attempts
- [x] TC-14.2: Special Characters in Names

**All critical test cases must pass for the system to be considered ready for production.**

---

## Troubleshooting Guide

### Issue: Page Won't Load
**Symptoms:** 404 error or blank page  
**Possible Causes:**
1. Deployment not complete
2. Route not registered in `src/index.ts`
3. Cloudflare Worker error

**Solutions:**
1. Verify deployment: `npx wrangler deployments list`
2. Check console for errors
3. Check Worker logs: `npx wrangler tail`
4. Re-deploy: `npm run deploy`

---

### Issue: "User Not Found" Error
**Symptoms:** Error when viewing user detail  
**Possible Causes:**
1. User ID doesn't exist
2. Database connection issue
3. Incorrect ID format

**Solutions:**
1. Verify user exists in database
2. Check browser console for actual error
3. Try re-navigating from user list

---

### Issue: Create/Update Fails Silently
**Symptoms:** Form submits but no success message  
**Possible Causes:**
1. Database constraint violation
2. Network error
3. Validation error not displayed

**Solutions:**
1. Check browser console for errors
2. Check Cloudflare Worker logs
3. Verify input data meets requirements

---

### Issue: Cascade Delete Not Working
**Symptoms:** Sessions remain after user deletion  
**Possible Causes:**
1. Foreign key constraint not set up
2. Database schema issue

**Solutions:**
1. Verify schema: `SELECT sql FROM sqlite_master WHERE name='sessions'`
2. Check for FOREIGN KEY clause
3. Re-run migration if needed

---

### Issue: Filters Not Working
**Symptoms:** Clicking filter shows no change  
**Possible Causes:**
1. JavaScript error
2. Filter parameters not passed
3. No users matching filter

**Solutions:**
1. Check console for JavaScript errors
2. Verify URL has query parameters
3. Confirm users exist with matching criteria

---

## Test Execution Log

### Date: _______________
### Tester: _______________

| Test Case | Status | Notes | Bug ID |
|-----------|--------|-------|--------|
| TC-1.1 | [ ] Pass / Fail | | |
| TC-1.2 | [ ] Pass / Fail | | |
| TC-2.1 | [ ] Pass / Fail | | |
| TC-2.2 | [ ] Pass / Fail | | |
| TC-2.3 | [ ] Pass / Fail | | |
| ... | ... | ... | ... |

---

## Bug Report Template

### Bug ID: ___
**Title:** [Brief description]

**Test Case:** TC-XX.X

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Environment:**
- Browser: 
- URL: 
- Database: (local/remote)

**Screenshots/Error Messages:**


---

## Sign-Off

### Tester Approval
**Name:** _______________  
**Date:** _______________  
**Status:** [ ] Approved for Production  [ ] Needs Fixes  [ ] Failed

### Notes:
_________________________________________________________________________________
_________________________________________________________________________________
_________________________________________________________________________________

---

## Appendix: Useful Queries

### Check User Count
```sql
SELECT COUNT(*) as total, 
       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
FROM users;
```

### Check Users by Role
```sql
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;
```

### Find Orphaned Sessions
```sql
SELECT s.* 
FROM sessions s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;
```

### Check Recent Activity
```sql
SELECT name, email, updated_at, last_login
FROM users
ORDER BY updated_at DESC
LIMIT 10;
```

---

**End of Test Plan**
