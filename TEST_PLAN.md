# GCRL Website - Admin Dashboard Test Plan

## Overview
**Goal:** Verify admin dashboard and user management features work correctly
**Tester:** Single person manual testing
**Estimated Time:** 1-2 hours
**URL:** https://gcrl-website.lawrence-675.workers.dev/admin

---

## 1. Dashboard Home Page (5 min)

Go to `/admin` and verify:

- [x] Page loads without errors
- [x] All 4 stat cards show numbers (Documents, Categories, Users, Downloads)
- [x] User count matches actual number in database
- [x] "👥 User Management" section is visible
- [x] "Manage Users" button navigates to `/admin/users`

**Pass Criteria:** Dashboard displays correctly and navigation works

---

## 2. User List Page (10 min)

Go to `/admin/users` and verify:

- [x] Page loads and shows list of users
- [x] User table displays: name, email, role, status, last login
- [x] "Add New User" button is visible
- [x] Can click on a user's name to view their details
- [x] Role badges show correct colors (purple=super_admin, blue=admin, green=member)

**Pass Criteria:** All users display with correct information

---

## 3. Create User - Test Each Role (15 min)

For each role type (super_admin, admin, member), create one test user:

1. Click "Add New User" button
2. Fill in form:
   - Name: Test [Role] (e.g., "Test Super Admin")
   - Email: test-[role]@example.com
   - Role: [Select role]
   - Password: Use the generate button
3. Click "Create User"
4. Verify user appears in list with correct role badge

**Repeat for:** super_admin, admin, member

- [ ] Super admin user created successfully
- [ ] Admin user created successfully
- [ ] Member user created successfully
- [ ] **Admin/super_admin users have 7-day grace period for 2FA** (verify in user details)

**Pass Criteria:** All three role types can be created and display correctly

**Note:** Admin and super_admin users get a 7-day grace period before they must enable 2FA. Members are NOT required to use 2FA (optional).

---

## 4. View User Details (5 min)

Click on one of the test users and verify:

- [x] User detail page loads
- [x] Shows all user information (name, email, role, status)
- [x] Shows account metadata (created, updated, last login)
- [x] "Edit User" button is visible
- [x] "Delete User" button is visible
- [x] "Back to Users" button returns to list

**Pass Criteria:** User details page displays complete information

---

## 5. Edit User Information (10 min)

1. Select a test user and click "Edit User"
2. Make these changes:
   - Change name to "Updated Name"
   - Change role to a different role
   - Toggle active/inactive status
3. Click "Update User"
4. Verify changes are reflected in user list

- [x] Name update works
- [x] Role change works
- [x] Active/Inactive toggle works
- [x] Changes persist (navigate away and back)

**Pass Criteria:** All editable fields can be updated and changes save correctly

---

## 6. Delete User (5 min)

1. Create a temporary test user
2. Click on that user
3. Click "Delete User" button
4. Confirm deletion
5. Verify user is removed from list

- [ ] Delete confirmation appears
- [ ] User is removed from list after confirmation
- [ ] User cannot be found after deletion

**Pass Criteria:** User deletion works correctly

---

## 7. Filter Users (5 min)

Use the filter dropdowns and verify:

- [ ] Filter by role: "super_admin" shows only super admins
- [ ] Filter by role: "admin" shows only admins
- [ ] Filter by role: "member" shows only members
- [ ] Filter by status: "active" shows only active users
- [ ] Filter by status: "inactive" shows only inactive users
- [ ] "Reset Filters" button clears all filters

**Pass Criteria:** Filters work independently and can be reset

---

## 8. Session Management (10 min)

1. Click on a user who has logged in before
2. Scroll to "Active Sessions" section
3. Verify session information displays (device, location, last active)
4. Click "Revoke" on a session
5. Confirm session is removed

- [ ] Session list displays for user
- [ ] Can see session details (device, IP, location)
- [ ] Revoke button works
- [ ] "Revoke All Sessions" button exists (optional test)

**Pass Criteria:** Can view and revoke user sessions

---

## 9. Navigation Between Pages (5 min)

Test navigation flows:

- [ ] Dashboard → Users List → User Details → Back to List
- [ ] Users List → Create User → Back to List
- [ ] Users List → User Details → Edit User → Back to Details
- [ ] Can use browser back button successfully
- [ ] All pages load quickly (< 2 seconds)

**Pass Criteria:** Navigation is smooth and intuitive

---

## 10. Error Handling (5 min)

Test edge cases:

1. Try to create user with duplicate email
   - [ ] Shows error message
   - [ ] Doesn't create duplicate user

2. Try to create user with invalid email
   - [ ] Shows validation error
   - [ ] Prevents submission

3. Try to edit user with empty name
   - [ ] Shows validation error
   - [ ] Prevents submission

**Pass Criteria:** Appropriate error messages appear for invalid inputs

---

## 11. Role Hierarchy (Important) (10 min)

Test that role permissions work correctly:

1. **Create super admin** (if not exists)
2. **Create regular admin** 
3. **Create member**

Verify:
- [ ] Super admin can see and edit ALL users (including other admins)
- [ ] Regular admin can see members but should NOT be able to edit other admins
- [ ] Member role has appropriate permissions (read-only for documents)

**Note:** The role hierarchy enforcement may not be fully implemented yet. Document any issues.

**Pass Criteria:** Role hierarchy respects the permission model

---

## Summary

**Total Test Cases:** 11 test scenarios (not 60!)
**Estimated Time:** 1-2 hours
**Focus:** Admin dashboard workflows and user CRUD features

### What This Plan Tests:
✅ Core user CRUD operations (create, read, update, delete)
✅ All three role types (super_admin, admin, member)
✅ User filtering and search
✅ Session management
✅ Navigation and UI usability
✅ Basic error handling

### What This Plan Does NOT Test:
❌ Every edge case (we test the happy path)
❌ Performance under load
❌ Security penetration testing
❌ Cross-browser compatibility
❌ Mobile responsiveness (assumed, not tested)
❌ Database integrity (assumed from schema)

---

## Test Results Template

After testing, document your findings:

### ✅ Passed
- List features that worked perfectly

### ⚠️ Issues Found
1. **Issue Description**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Severity (low/medium/high)

### 📝 Notes
- Any observations or suggestions
- Features that were confusing or difficult to use
- Ideas for improvements

### 🔧 Fixes Needed
- List any bugs that need to be addressed
- Prioritize by severity
