# Login Authentication Testing Checklist

**Project**: Golden Compasses Research Lodge Website  
**Date**: January 6, 2026  
**Purpose**: Comprehensive testing checklist for all login scenarios  
**Status**: Ready for Testing (Post-Break)

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test Credentials](#test-credentials)
3. [Member Login Testing](#member-login-testing)
4. [Admin Dashboard Login Testing](#admin-dashboard-login-testing)
5. [Super Admin Login Testing](#super-admin-login-testing)
6. [Invalid Login Error Handling](#invalid-login-error-handling)
7. [Session Management Testing](#session-management-testing)
8. [Security Testing](#security-testing)
9. [Cross-Browser Testing](#cross-browser-testing)
10. [Edge Cases](#edge-cases)

---

## Test Environment Setup

### Pre-Testing Checklist

```markdown
## Environment Setup
- [ ] Clear browser cache and cookies
- [ ] Use private/incognito window for testing
- [ ] Open browser developer tools (F12)
- [ ] Navigate to Console tab to watch for errors
- [ ] Navigate to Network tab to monitor requests
- [ ] Have test credentials ready (see below)
- [ ] Verify deployment is live: https://gcrl-website.lawrence-675.workers.dev
```

### Browser Setup

**Recommended Browsers for Testing**:
- Safari (primary - as requested)
- Chrome (secondary)
- Firefox (optional)

**Developer Tools Setup**:
```
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Keep Console tab open for errors
5. Go to Application tab → Local Storage to verify session storage
```

---

## Test Credentials

### Current Test Users in Database

#### 1. Test Admin User
```yaml
Email: testadmin@example.com
Password: TestPassword123!
Role: admin
ID: D9AF3F93-74CB-4F60-AE5A-8BF62C7EE74B
Status: active
```

**Access**:
- ✅ Admin Dashboard
- ✅ Member Library

---

#### 2. Test Super Admin User
```yaml
Email: lawrence@altomare.org
Password: [REDACTED - User knows password]
Role: super_admin
ID: 04c1f6a6-35e9-4343-9874-c8f24f118d08
Status: active
```

**Access**:
- ✅ Admin Dashboard
- ✅ Super Admin features (if implemented)
- ✅ Member Library

---

#### 3. Test Regular Member User
```yaml
Email: test@example.com
Password: [UNKNOWN - needs to be set or reset]
Role: admin (currently, should be member)
ID: 87f34795-7375-4521-abf9-2f9271ea651a
Status: active
```

**Note**: This user has `admin` role but should test as a regular member. Consider creating a proper test member user.

---

#### 4. Need to Create: Test Member User

```sql
-- Run this to create a proper test member user
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES (
  'test-member-id',
  'testmember@example.com',
  'Test Member',
  '$2b$10$PE96pj63cOLnepsYNwlJkO9yhZI89212JkTjxOc4Cdz74AIf8BCqu',
  'member',
  1
);
```

**Test Member Credentials** (after creation):
```yaml
Email: testmember@example.com
Password: TestPassword123!
Role: member
Access: Member Library only
```

---

## Member Login Testing

### Test Case 1: Member Access to Library

**Objective**: Verify members can log in and access the document library.

#### Steps:

1. **Navigate to Library Login**
   ```
   URL: https://gcrl-website.lawrence-675.workers.dev/library
   OR: https://gcrl-website.lawrence-675.workers.dev/documents
   ```

2. **Enter Credentials**
   ```
   Email: testmember@example.com
   Password: TestPassword123!
   ```

3. **Click "Login" or "Sign In" button**

#### Expected Results:

```markdown
## Success Criteria
- [ ] Login form accepts credentials without errors
- [ ] User is redirected to library/documents page
- [ ] Session token is stored (check Application → Local Storage)
- [ ] User can see document list
- [ ] User can download documents (if role allows)
- [ ] User name/email displayed on page (if applicable)
- [ ] No console errors in browser
- [ ] Network requests show 200 status codes

## What to Check
- [ ] Session token in localStorage or cookies
- [ ] JWT/session token returned in response
- [ ] Subsequent requests include authentication header
- [ ] Page refresh maintains login session
```

#### Network Tab Verification:

```markdown
## Request Headers to Check
POST /admin/login OR /member/login OR /library/login
- Request Payload: { "email": "...", "password": "..." }
- Response Status: 200 OK
- Response Body: { "success": true, "token": "...", "user": {...} }

## Subsequent Requests
- Authorization header present: Bearer <token>
- OR Cookie header with session ID
- Response Status: 200 OK
```

---

### Test Case 2: Member Access Denied to Admin Dashboard

**Objective**: Verify members CANNOT access the admin dashboard.

#### Steps:

1. **Log in as member** (use testmember@example.com)
2. **Attempt to access admin dashboard**
   ```
   URL: https://gcrl-website.lawrence-675.workers.dev/admin
   OR: https://gcrl-website.lawrence-675.workers.dev/admin/dashboard
   ```

#### Expected Results:

```markdown
## Access Denied Criteria
- [ ] Request to /admin returns 403 Forbidden
- [ ] OR request redirects to login page
- [ ] OR request shows "Access Denied" message
- [ ] Admin dashboard is NOT displayed
- [ ] User remains on member pages only

## What to Check
- [ ] Network tab shows 403 status code
- [ ] Error message is user-friendly (not technical)
- [ ] No sensitive admin data is exposed
- [ ] Console shows authorization check
```

---

## Admin Dashboard Login Testing

### Test Case 3: Admin Login to Dashboard

**Objective**: Verify admin users can log in and access the admin dashboard.

#### Steps:

1. **Navigate to Admin Login**
   ```
   URL: https://gcrl-website.lawrence-675.workers.dev/admin/login
   ```

2. **Enter Admin Credentials**
   ```
   Email: testadmin@example.com
   Password: TestPassword123!
   ```

3. **Click "Login" button**

#### Expected Results:

```markdown
## Success Criteria
- [ ] Login form submits without errors
- [ ] POST request to /admin/login returns 200 OK
- [ ] Response includes: { "success": true, "token": "...", "user": {...} }
- [ ] User is redirected to admin dashboard
   URL: /admin OR /admin/dashboard
- [ ] Admin dashboard loads and displays correctly
- [ ] Dashboard STAYS visible (does not disappear)
- [ ] User information displayed (name, email, role)
- [ ] Session token stored (localStorage or cookie)
- [ ] No console errors
- [ ] All admin features accessible

## What to Check
- [ ] Response contains user object with role: "admin"
- [ ] Session token is a valid UUID
- [ ] Subsequent requests include authentication
- [ ] Page refresh maintains session
- [ ] Dashboard navigation works
```

#### Visual Verification:

```markdown
## Dashboard Elements to Verify
- [ ] Header/navigation bar visible
- [ ] User profile/name displayed
- [ ] Logout button present
- [ ] Admin menu items visible
- [ ] No layout broken
- [ ] No loading spinners stuck
```

---

### Test Case 4: Admin Can Access Admin Features

**Objective**: Verify admin users can perform admin actions.

#### Steps:

1. **Log in as admin** (testadmin@example.com)
2. **Navigate through admin features**
   - Document management
   - User management (if exists)
   - Settings (if exists)
   - Any admin-only features

#### Expected Results:

```markdown
## Admin Access Criteria
- [ ] All admin features are accessible
- [ ] Can upload documents (if applicable)
- [ ] Can delete documents (if applicable)
- [ ] Can manage users (if applicable)
- [ ] Can view admin reports/statistics (if applicable)
- [ ] No 403 Forbidden errors
- [ ] No "Access Denied" messages
```

---

## Super Admin Login Testing

### Test Case 5: Super Admin Login to Dashboard

**Objective**: Verify super admin users can log in and access all features.

#### Steps:

1. **Navigate to Admin Login**
   ```
   URL: https://gcrl-website.lawrence-675.workers.dev/admin/login
   ```

2. **Enter Super Admin Credentials**
   ```
   Email: lawrence@altomare.org
   Password: [YOUR PASSWORD]
   ```

3. **Click "Login" button**

#### Expected Results:

```markdown
## Success Criteria
- [ ] Login form submits without errors
- [ ] POST request to /admin/login returns 200 OK
- [ ] Response includes: { "success": true, "token": "...", "user": {...} }
- [ ] Response user.role === "super_admin"
- [ ] Redirected to admin dashboard successfully
- [ ] Dashboard loads and stays visible
- [ ] Super admin badge/indicator visible (if implemented)
- [ ] All admin features accessible
- [ ] Super admin-only features accessible (if any)

## What to Check
- [ ] User role is correctly identified as "super_admin"
- [ ] Additional super admin permissions work
- [ ] Can perform admin actions
- [ ] Can manage other admins (if applicable)
- [ ] No access control errors
```

---

### Test Case 6: Super Admin Has Additional Privileges

**Objective**: Verify super admin has access beyond regular admin.

**Note**: If super admin features are not yet implemented, mark as N/A.

#### Steps:

1. **Log in as super admin** (lawrence@altomare.org)
2. **Access super admin features** (if any)
   - Manage admin users
   - System settings
   - Security logs
   - Advanced configuration

#### Expected Results:

```markdown
## Super Admin Criteria (if implemented)
- [ ] Can manage admin users
- [ ] Can view security logs
- [ ] Can access system settings
- [ ] Can perform destructive actions (delete all, reset, etc.)
- [ ] Has elevated privileges beyond regular admin

## If Not Implemented
- [ ] Super admin treated same as admin (acceptable)
- [ ] Document missing features for future implementation
```

---

## Invalid Login Error Handling

### Test Case 7: Wrong Password

**Objective**: Verify system handles incorrect password gracefully.

#### Steps:

1. **Navigate to login page** (/admin/login or /library/login)
2. **Enter correct email but wrong password**
   ```
   Email: testadmin@example.com
   Password: WrongPassword123!
   ```
3. **Click "Login" button**

#### Expected Results:

```markdown
## Error Handling Criteria
- [ ] Login does NOT succeed
- [ ] Error message displayed: "Invalid email or password"
- [ ] Response status: 401 Unauthorized
- [ ] Error message is user-friendly (not technical)
- [ ] No sensitive information leaked
- [ ] Page does NOT crash or hang
- [ ] User can try again immediately
- [ ] Rate limiting NOT triggered (first 5 attempts)

## Security Verification
- [ ] Error message does NOT reveal which field is wrong
- [ ] Error message does NOT reveal if user exists
- [ ] Response time similar to valid login (prevent timing attacks)
- [ ] No stack traces or technical errors shown
```

---

### Test Case 8: Non-Existent User

**Objective**: Verify system handles non-existent user gracefully.

#### Steps:

1. **Navigate to login page**
2. **Enter email that does NOT exist in database**
   ```
   Email: nonexistent@example.com
   Password: AnyPassword123!
   ```
3. **Click "Login" button**

#### Expected Results:

```markdown
## Error Handling Criteria
- [ ] Login does NOT succeed
- [ ] Error message displayed: "Invalid email or password"
- [ ] Same error message as wrong password (security best practice)
- [ ] Response status: 401 Unauthorized
- [ ] Error does NOT reveal that user doesn't exist
- [ ] No enumeration possible (cannot check which emails exist)

## Security Verification
- [ ] Cannot determine if email is registered
- [ ] Response time similar to valid login
- [ ] No different error for "user not found" vs "wrong password"
```

---

### Test Case 9: Empty/Missing Fields

**Objective**: Verify system validates required fields.

#### Steps:

1. **Navigate to login page**
2. **Test variations:**
   ```
   a) Leave both fields empty, click Login
   b) Enter email only, leave password empty
   c) Enter password only, leave email empty
   d) Enter spaces in both fields
   ```

#### Expected Results:

```markdown
## Validation Criteria
- [ ] Client-side validation catches empty fields
- [ ] OR server-side validation returns error
- [ ] Error message: "Email and password are required"
- [ ] Response status: 400 Bad Request (if server validates)
- [ ] OR form does not submit (if client validates)
- [ ] No server crash
- [ ] Clear indication of which field is missing

## What to Check
- [ ] Form validation happens before submit (preferred)
- [ ] OR API returns clear error (acceptable)
- [ ] Error messages are helpful
```

---

### Test Case 10: Invalid Email Format

**Objective**: Verify system validates email format.

#### Steps:

1. **Navigate to login page**
2. **Enter invalid email formats**
   ```
   a) plainaddress (no @)
   b) @missingdomain.com
   c) missing@.com
   d) spaces@in email.com
   ```

#### Expected Results:

```markdown
## Validation Criteria
- [ ] Client-side validation catches invalid email
- [ ] OR server-side validation returns error
- [ ] Error message: "Invalid email format"
- [ ] Form does NOT submit with invalid email
- [ ] Clear indication of what's wrong

## What to Check
- [ ] Email format validation present
- [ ] User-friendly error message
- [ ] Cannot submit with malformed email
```

---

### Test Case 11: Rate Limiting (After 5 Failed Attempts)

**Objective**: Verify rate limiting prevents brute force attacks.

#### Steps:

1. **Navigate to login page**
2. **Attempt login 6 times with wrong credentials**
   ```
   Attempt 1-5: Wrong password
   Attempt 6: Any credentials
   ```

#### Expected Results:

```markdown
## Rate Limiting Criteria
- [ ] First 5 attempts return "Invalid email or password"
- [ ] 6th attempt returns different error
- [ ] Error message: "Too many attempts. Please wait 15 minutes."
- [ ] Response status: 429 Too Many Requests
- [ ] Account is NOT locked (temporary rate limit only)
- [ ] Cannot attempt login for 15 minutes

## What to Check
- [ ] Rate limiting works per IP address
- [ ] Rate limiting works per email address (optional)
- [ ] Clear error message about waiting period
- [ ] No permanent account lockout
- [ ] Can try again after 15 minutes
```

**Note**: Rate limiting is implemented in `/admin/login`:
```typescript
if (!checkRateLimit(ip, 5, 900000)) {  // 5 attempts, 15 minutes
  return new Response(JSON.stringify({ 
    error: 'Too many attempts. Please wait 15 minutes.' 
  }), { status: 429 });
}
```

---

### Test Case 12: SQL Injection Attempts

**Objective**: Verify system is protected against SQL injection.

#### Steps:

1. **Navigate to login page**
2. **Enter SQL injection payloads in email field**
   ```
   a) ' OR '1'='1
   b) admin'--
   c) ' UNION SELECT * FROM users--
   d) '; DROP TABLE users; --
   ```

#### Expected Results:

```markdown
## Security Criteria
- [ ] Login fails (as expected)
- [ ] No database errors exposed
- [ ] No stack traces
- [ ] Generic error message
- [ ] Database NOT compromised
- [ ] Parameterized queries prevent injection

## What to Check
- [ ] Input sanitization working
- [ ] Prepared statements used
- [ ] No SQL errors in response
- [ ] No data leakage
```

---

### Test Case 13: Account Status - Inactive User

**Objective**: Verify inactive users cannot log in.

#### Prerequisites:
Need to create an inactive test user:

```sql
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES (
  'inactive-test-id',
  'inactive@example.com',
  'Inactive User',
  '$2b$10$PE96pj63cOLnepsYNwlJkO9yhZI89212JkTjxOc4Cdz74AIf8BCqu',
  'member',
  0  -- is_active = false
);
```

#### Steps:

1. **Navigate to login page**
2. **Enter inactive user credentials**
   ```
   Email: inactive@example.com
   Password: TestPassword123!
   ```

#### Expected Results:

```markdown
## Inactive Account Criteria
- [ ] Login does NOT succeed
- [ ] Error message: "Account is inactive" or "Invalid credentials"
- [ ] Response status: 401 Unauthorized OR 403 Forbidden
- [ ] No access to any features
- [ ] Generic error message (preferred for security)

## What to Check
- [ ] is_active field is checked during login
- [ ] Inactive users cannot authenticate
- [ ] No session created for inactive users
```

---

## Session Management Testing

### Test Case 14: Session Persistence (Page Refresh)

**Objective**: Verify session persists across page refreshes.

#### Steps:

1. **Log in successfully** (any user)
2. **Refresh the page** (F5 or Cmd+R)
3. **Navigate to different pages**
4. **Refresh again**

#### Expected Results:

```markdown
## Session Persistence Criteria
- [ ] Page refresh does NOT log user out
- [ ] User stays logged in after refresh
- [ ] Session token still valid
- [ ] User can access features after refresh
- [ ] No need to re-authenticate

## What to Check
- [ ] Session token stored in localStorage OR cookie
- [ ] Token sent with subsequent requests
- [ ] verifySession() endpoint returns valid user
- [ ] Session not expired (7-day expiry)
```

---

### Test Case 15: Session Expiration

**Objective**: Verify sessions expire after 7 days.

**Note**: This is difficult to test without waiting 7 days. Use database inspection.

#### Steps:

1. **Log in successfully**
2. **Check database for session record**
   ```sql
   SELECT * FROM user_sessions WHERE user_id = '<your-user-id>';
   ```
3. **Note the expires_at timestamp**

#### Expected Results:

```markdown
## Session Expiration Criteria
- [ ] Session record has expires_at timestamp
- [ ] expires_at is approximately 7 days from now
- [ ] After expires_at, session is invalid
- [ ] Attempting to use expired token returns 401

## Manual Test (Optional)
- [ ] Manually update expires_at to past timestamp in database
- [ ] Try to access protected page
- [ ] Should be redirected to login

SQL to force expire:
UPDATE user_sessions 
SET expires_at = datetime('now', '-1 day') 
WHERE user_id = '<your-user-id>';
```

---

### Test Case 16: Logout Functionality

**Objective**: Verify logout properly invalidates session.

#### Steps:

1. **Log in successfully**
2. **Click "Logout" button**
3. **Attempt to access protected page**

#### Expected Results:

```markdown
## Logout Criteria
- [ ] Logout button is visible
- [ ] Clicking logout removes session
- [ ] Redirected to login page
- [ ] Session token deleted from localStorage/cookies
- [ ] Database session record deleted
- [ ] Cannot access protected pages after logout
- [ ] Attempting to access protected page redirects to login

## What to Check
- [ ] POST /admin/logout OR /logout endpoint called
- [ ] deleteUserSession() function works
- [ ] Session removed from database
- [ ] No trace of session in browser
```

---

### Test Case 17: Multiple Device Login

**Objective**: Verify user can be logged in from multiple devices.

#### Steps:

1. **Log in on Safari** (Device 1)
2. **Log in on Chrome** (Device 2 - different browser)
3. **Check both sessions in database**

#### Expected Results:

```markdown
## Multiple Session Criteria
- [ ] Can log in on multiple browsers
- [ ] Each device gets its own session token
- [ ] Both sessions are valid simultaneously
- [ ] Logging out one device does NOT affect other
- [ ] Database shows multiple session records for same user

## What to Check
- [ ] Each session has unique token
- [ ] Both sessions work independently
- [ ] No session conflicts
```

---

## Security Testing

### Test Case 18: Password Hashing Verification

**Objective**: Verify passwords are properly hashed in database.

#### Steps:

1. **Check database for user password_hash**
   ```sql
   SELECT email, password_hash FROM users WHERE email = 'testadmin@example.com';
   ```
2. **Verify hash format**

#### Expected Results:

```markdown
## Password Hashing Criteria
- [ ] Password hash starts with $2b$10$ (bcrypt)
- [ ] Hash is NOT plaintext password
- [ ] Hash length is 60 characters (bcrypt standard)
- [ ] Cannot reverse hash to get password
- [ ] Same password generates different hash (salt)

## What to Check
- [ ] No plaintext passwords in database
- [ ] Bcrypt cost factor is 10 (or higher)
- [ ] Each user has unique hash (due to salt)
```

---

### Test Case 19: Session Token Security

**Objective**: Verify session tokens are secure.

#### Steps:

1. **Log in successfully**
2. **Inspect session token in response**
3. **Check database for stored token**

#### Expected Results:

```markdown
## Session Token Security Criteria
- [ ] Token is a UUID (random, not guessable)
- [ ] Token length is sufficient (36 chars for UUID)
- [ ] Token stored securely in database
- [ ] Token transmitted over HTTPS (encrypted)
- [ ] Token NOT exposed in URLs
- [ ] Token NOT visible in server logs

## What to Check
- [ ] Token format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- [ ] No predictable patterns in token
- [ ] Token changes on each login
- [ ] Old tokens invalidated after new login (optional)
```

---

### Test Case 20: HTTPS/SSL Verification

**Objective**: Verify all authentication happens over HTTPS.

#### Steps:

1. **Check URL in browser address bar**
2. **Inspect Network tab requests**
3. **Verify SSL certificate**

#### Expected Results:

```markdown
## HTTPS Criteria
- [ ] URL starts with https:// (not http://)
- [ ] Padlock icon visible in browser
- [ ] All login requests use HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate is valid
- [ ] No insecure form submissions

## What to Check
- [ ] POST /admin/login is HTTPS
- [ ] No credentials sent over HTTP
- [ ] Cookies have "Secure" flag (if using cookies)
- [ ] No sensitive data in URL parameters
```

---

## Cross-Browser Testing

### Test Case 21: Safari Testing (Primary)

**Objective**: Verify login works correctly in Safari (user's primary browser).

#### Steps:

1. **Open Safari**
2. **Open private window** (Cmd+Shift+N)
3. **Navigate to login page**
4. **Test all scenarios above**

#### Expected Results:

```markdown
## Safari Criteria
- [ ] Login form renders correctly
- [ ] All JavaScript works
- [ ] localStorage/sessionStorage works
- [ ] Network requests succeed
- [ ] No Safari-specific bugs
- [ ] Responsive design works

## What to Check
- [ ] Console is clear of errors
- [ ] No CORS issues
- [ ] No CSP (Content Security Policy) violations
- [ ] Cookies/LocalStorage accessible
```

---

### Test Case 22: Chrome/Firefox Testing (Secondary)

**Objective**: Verify cross-browser compatibility.

#### Steps:

1. **Test in Chrome**
2. **Test in Firefox** (if available)
3. **Compare behavior with Safari**

#### Expected Results:

```markdown
## Cross-Browser Criteria
- [ ] Login works in Chrome
- [ ] Login works in Firefox
- [ ] Same behavior across browsers
- [ ] No browser-specific bugs
- [ ] Consistent UI/UX

## What to Check
- [ ] localStorage works in all browsers
- [ ] Network requests same across browsers
- [ ] No vendor prefixes needed
- [ ] Progressive enhancement works
```

---

## Edge Cases

### Test Case 23: Special Characters in Password

**Objective**: Verify passwords with special characters work.

#### Steps:

1. **Create user with special character password**
   ```
   Password: Test!@#$%^&*()_+-=[]{}|;':",./<>?
   ```
2. **Log in with these credentials**

#### Expected Results:

```markdown
## Special Character Criteria
- [ ] All special characters work in password
- [ ] No characters break the login
- [ ] Password hashed correctly
- [ ] Login succeeds with special characters

## What to Check
- [ ] Input sanitization doesn't remove valid chars
- [ ] JSON encoding handles special chars
- [ ] Database stores hash correctly
```

---

### Test Case 24: Very Long Email/Password

**Objective**: Verify system handles excessively long input.

#### Steps:

1. **Enter extremely long email**
   ```
   Email: testadmin@example.com (repeated 100 times)
   ```
2. **Enter extremely long password**
   ```
   Password: a (repeated 1000 times)
   ```

#### Expected Results:

```markdown
## Long Input Criteria
- [ ] Input validation prevents excessive length
- [ ] OR system handles long input gracefully
- [ ] No buffer overflows
- [ ] No database errors
- [ ] Clear error message if too long

## What to Check
- [ ] Maximum length enforced
- [ ] Database columns have size limits
- [ ] No truncation issues
```

---

### Test Case 25: Concurrent Login Attempts

**Objective**: Verify system handles rapid simultaneous login attempts.

#### Steps:

1. **Open multiple browser tabs**
2. **Log in simultaneously from all tabs**
3. **Check behavior**

#### Expected Results:

```markdown
## Concurrent Login Criteria
- [ ] All login attempts succeed
- [ ] Multiple session tokens created
- [ ] No race conditions
- [ ] No database locking issues
- [ ] All tabs work independently

## What to Check
- [ ] Each tab gets unique session
- [ ] No session conflicts
- [ ] Database handles concurrent writes
```

---

## Testing Summary

### Test Results Template

Copy this template to record your test results:

```markdown
## Test Results - [Date]

### Environment
- Browser: Safari/Chrome/Firefox
- Device: Desktop/Mobile
- Date/Time: [YYYY-MM-DD HH:MM]
- Tester: [Your Name]

### Test Case Results

| Test Case | Status | Notes | Issues Found |
|-----------|--------|-------|--------------|
| 1. Member Library Access | ✅ Pass / ❌ Fail | | |
| 2. Member Admin Denial | ✅ Pass / ❌ Fail | | |
| 3. Admin Dashboard Login | ✅ Pass / ❌ Fail | | |
| 4. Admin Features Access | ✅ Pass / ❌ Fail | | |
| 5. Super Admin Login | ✅ Pass / ❌ Fail | | |
| 6. Super Admin Privileges | ✅ Pass / ❌ Fail | N/A | |
| 7. Wrong Password | ✅ Pass / ❌ Fail | | |
| 8. Non-Existent User | ✅ Pass / ❌ Fail | | |
| 9. Empty Fields | ✅ Pass / ❌ Fail | | |
| 10. Invalid Email | ✅ Pass / ❌ Fail | | |
| 11. Rate Limiting | ✅ Pass / ❌ Fail | | |
| 12. SQL Injection | ✅ Pass / ❌ Fail | | |
| 13. Inactive Account | ✅ Pass / ❌ Fail | | |
| 14. Session Persistence | ✅ Pass / ❌ Fail | | |
| 15. Session Expiration | ✅ Pass / ❌ Fail | | |
| 16. Logout | ✅ Pass / ❌ Fail | | |
| 17. Multiple Devices | ✅ Pass / ❌ Fail | | |
| 18. Password Hashing | ✅ Pass / ❌ Fail | | |
| 19. Token Security | ✅ Pass / ❌ Fail | | |
| 20. HTTPS | ✅ Pass / ❌ Fail | | |
| 21. Safari | ✅ Pass / ❌ Fail | | |
| 22. Chrome/Firefox | ✅ Pass / ❌ Fail | | |
| 23. Special Characters | ✅ Pass / ❌ Fail | | |
| 24. Long Input | ✅ Pass / ❌ Fail | | |
| 25. Concurrent Logins | ✅ Pass / ❌ Fail | | |

### Overall Assessment
Total Tests: 25
Passed: __
Failed: __
Skipped: __
Success Rate: __%

### Critical Issues Found
1. 
2. 
3. 

### Recommendations
1. 
2. 
3. 

### Next Steps
- [ ] Fix critical issues
- [ ] Re-test failed scenarios
- [ ] Document bugs for future fixes
- [ ] Sign off on authentication system
```

---

## Quick Reference: Common Issues

### Issue: Dashboard Loads Briefly Then Disappears

**Symptoms**: Dashboard appears for a second, then redirects to login

**Possible Causes**:
1. Session verification failing
2. Token not being sent with requests
3. verifySession() returning null
4. Client-side auth check failing

**Debug Steps**:
1. Open Console and look for errors
2. Check Network tab for failed requests
3. Verify token is stored in localStorage
4. Check verifySession() endpoint response

---

### Issue: "Invalid Email or Password" Despite Correct Credentials

**Symptoms**: Cannot log in with known good credentials

**Possible Causes**:
1. User account is inactive (is_active = 0)
2. Wrong password hash in database
3. Email case sensitivity issue
4. Rate limiting triggered

**Debug Steps**:
1. Check user is_active flag in database
2. Verify password hash is correct bcrypt hash
3. Try email in lowercase
4. Wait 15 minutes if rate limited

---

### Issue: Session Lost on Page Refresh

**Symptoms**: Logged out when refreshing page

**Possible Causes**:
1. Token not stored in localStorage/cookie
2. Token expired
3. Token not being sent with requests
4. verifySession() endpoint failing

**Debug Steps**:
1. Check Application → Local Storage for token
2. Check Network tab for Authorization header
3. Verify token exists in database
4. Check token expiration time

---

## Post-Testing Actions

### If All Tests Pass ✅

```markdown
## Deployment Checklist
- [ ] All test cases pass
- [ ] No critical issues found
- [ ] Documentation updated
- [ ] Test users cleaned up (if needed)
- [ ] Ready for production use
```

### If Tests Fail ❌

```markdown
## Bug Fix Process
1. Document failing test case
2. Identify root cause
3. Fix the issue
4. Re-test the specific scenario
5. Regression test (ensure nothing else broke)
6. Update documentation if needed
```

---

## Appendix: Database Queries for Testing

### Useful Queries

```sql
-- Check all users
SELECT id, email, name, role, is_active FROM users;

-- Check active sessions
SELECT * FROM user_sessions WHERE expires_at > datetime('now');

-- Check specific user sessions
SELECT * FROM user_sessions WHERE user_id = 'user-id-here';

-- Deactivate a user (for testing)
UPDATE users SET is_active = 0 WHERE email = 'test@example.com';

-- Expire all sessions (for testing)
UPDATE user_sessions SET expires_at = datetime('now', '-1 day');

-- Delete all sessions (for testing)
DELETE FROM user_sessions;

-- Create test member user
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES (
  'test-member-' || lower(hex(randomblob(16))),
  'testmember@example.com',
  'Test Member',
  '$2b$10$PE96pj63cOLnepsYNwlJkO9yhZI89212JkTjxOc4Cdz74AIf8BCqu',
  'member',
  1
);

-- Create test admin user
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES (
  'test-admin-' || lower(hex(randomblob(16))),
  'testadmin2@example.com',
  'Test Admin 2',
  '$2b$10$PE96pj63cOLnepsYNwlJkO9yhZI89212JkTjxOc4Cdz74AIf8BCqu',
  'admin',
  1
);
```

---

## End of Checklist

**Ready for Testing**: January 6, 2026  
**Test Start Date**: [After break]  
**Test End Date**: [To be determined]  

Good luck with testing! 🚀
