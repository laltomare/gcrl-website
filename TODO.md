# Golden Compasses Research Lodge - TODO & Future Tasks

## 🚨 CRITICAL PRIORITY TASKS

### 1. 🔴 CRITICAL: Fix Admin Panel Error 1101 - ROOT CAUSE IDENTIFIED

**Status**: 🚨 CRITICAL - Admin panel completely broken - ROOT CAUSE FOUND

**Root Cause Analysis** (Completed January 2, 2026):
- **Issue**: `/admin` route returns `TwoFactorSetupPage()` instead of admin dashboard
- **Location**: `src/index.ts` line 630-632
- **Problem**: 
  1. `AdminDashboardPage()` function does not exist in `src/lib/pages.ts`
  2. No authentication check on `/admin` route
  3. Route incorrectly returns 2FA setup page
- **Likely Cause**: 
  - Admin dashboard function may have been accidentally deleted during hamburger menu cleanup (commit 435abaa)
  - OR was never implemented in the first place
- **Evidence**: File header only lists AdminLoginPage, TwoFactorPage, TwoFactorSetupPage - no AdminDashboardPage

**Impact**: 
- ❌ Admin cannot access web interface
- ❌ No way to manage documents via web UI
- ❌ No way to view membership requests via web UI
- ❌ No way to manage users or content
- ⚠️ Currently must use API directly (impractical for regular use)

**Fix Required**:
1. **Create AdminDashboardPage()** function in `src/lib/pages.ts`
   - Document list with download statistics
   - Membership requests list with status
   - Quick action buttons (upload document, add user)
   - Statistics overview
2. **Fix `/admin` route** in `src/index.ts` (line 630-632)
   - Add authentication check before showing dashboard
   - Redirect to login if not authenticated
   - Only show dashboard after successful login + 2FA
3. **Add comprehensive inline comments** documenting:
   - Why changes were made
   - When function was created
   - What dependencies exist
4. **Create Root Cause Analysis document**:
   - Document when admin dashboard was lost
   - Prevent similar issues in future
   - Add to project documentation

**Documentation Requirements**:
- Add inline comments explaining all recent changes
- Document code dependencies clearly
- Add change log at top of modified files
- Create RCA (Root Cause Analysis) document

**Priority**: 🔴 CRITICAL - Blocks all admin functionality

**Next Steps** (in order):
1. **Investigate git history** to find when AdminDashboardPage was removed
   - Run: `git log --all --oneline --grep="admin" -10`
   - Search commits related to "admin" to identify when changes were made
   - Check commit 435abaa (hamburger menu cleanup) specifically
   - Look for any commit that mentions "AdminDashboardPage" or "admin dashboard"
   
2. **Create AdminDashboardPage() function** in `src/lib/pages.ts`
   - Document list with download statistics
   - Membership requests list with status
   - Quick action buttons (upload document, add user)
   - Statistics overview
   
3. **Fix `/admin` route** in `src/index.ts` (line 630-632)
   - Add authentication check before showing dashboard
   - Redirect to login if not authenticated
   - Only show dashboard after successful login + 2FA
   
4. **Add comprehensive inline comments** documenting:
   - Why changes were made
   - When function was created
   - What dependencies exist
   
5. **Create Root Cause Analysis document**:
   - Document when admin dashboard was lost
   - Prevent similar issues in future
   - Add to project documentation
   
6. **Test all admin functionality**
7. **Deploy to staging**

---

### 2. 🔴 CRITICAL: Implement Complete Member Authentication System

**Status**: 🚨 CRITICAL - Current member experience is poor

**Current Problems**:
- ❌ No dedicated member login button on library page
- ❌ Members must login individually for EACH file download
- ❌ No session management - must re-enter password constantly
- ❌ No enhanced library view for authenticated members
- ❌ Cannot see paper metadata (author, title, date) without downloading
- ❌ Cannot download multiple papers at once
- ❌ No session timeout

**Required Features**:

#### A. Member Login System
- **Login Button**: Add prominent "Member Login" button on Library page
- **Session Management**: 
  - Persistent login session (don't require password for each download)
  - Session timeout: 30 minutes of inactivity (industry standard)
  - Option to "Remember me" for trusted devices (7 days)
- **Authentication Flow**:
  - Single login for entire session
  - Clear visual indication when logged in
  - Logout button always visible when authenticated

#### B. Enhanced Library View for Members
- **Display Metadata**:
  - Paper title
  - Author name(s)
  - Publication date
  - File size
  - Brief description/abstract
- **Bulk Operations**:
  - Select multiple papers
  - Download selected papers as ZIP
  - Add to reading list/favorites (future)
- **Search & Filter**:
  - Search by title, author, date
  - Filter by date range, author
  - Sort by various criteria

#### C. Session Management
- **Timeout**: 30 minutes of inactivity (industry standard)
- **Warnings**: 
  - 5-minute warning before timeout
  - Option to extend session
- **Security**:
  - Automatic logout after timeout
  - Clear session data on logout
- **User Experience**:
  - "Remember me" option (7-day persistent session)
  - Active session indicator
  - Last login timestamp

**Priority**: 🔴 CRITICAL - Major UX issue affecting member experience

---

### 3. 🔴 HIGH: Multi-User Authentication System

**Status**: 🔴 HIGH PRIORITY - Currently single-user system

**Current Limitation**:
- ❌ Only one admin account (shared password)
- ❌ No individual member accounts
- ❌ No way to track which user did what
- ❌ No granular permissions

**Required Features**:

#### A. User Management System (CRUD)
- **Create**: 
  - Admin can create new member accounts
  - Admin can create other admin accounts
  - Email verification for new accounts
- **Read**:
  - List all users
  - View user details (name, email, role, join date)
  - View user activity logs
- **Update**:
  - Edit user information
  - Change user roles (member ↔ admin)
  - Reset user passwords
  - Enable/disable accounts
- **Delete**:
  - Remove users who are no longer members
  - Soft delete (keep data) vs hard delete
  - Confirmation required

#### B. User Roles & Permissions
- **Roles**:
  - **Super Admin**: Full access, can manage other admins
  - **Admin**: Can manage content and members, cannot manage admins
  - **Member**: Can access library, download papers
- **Permissions Matrix**:
  - View library (all users)
  - Download papers (members only)
  - Submit membership requests (public)
  - Access admin dashboard (admin only)
  - Manage users (admin only)
  - Manage documents (admin only)

#### C. Individual Authentication
- **Separate Credentials**:
  - Each user has unique username/email
  - Each user has own password
  - Password reset flow (email-based)
- **User Profiles**:
  - Name, email, join date
  - Last login timestamp
  - Activity history

**Priority**: 🔴 HIGH - Essential for proper member management

---

### 4. 🟡 HIGH: Admin Dashboard CRUD System

**Status**: 🟡 HIGH PRIORITY - Need content management interface

**Required Features**:

#### A. Document Management (CRUD)
- **Create**:
  - Upload new research papers
  - Add metadata (title, author, date, description)
  - Store in R2 with D1 database reference
- **Read**:
  - List all documents
  - View document details
  - Search/filter documents
  - Download statistics
- **Update**:
  - Edit document metadata
  - Replace document file
  - Update document status
- **Delete**:
  - Remove documents
  - Confirm deletion
  - Audit log of deletions

#### B. User Management (CRUD)
- (See Task #3 above)

#### C. Dashboard Features
- **Statistics**:
  - Total members
  - Total documents
  - Recent activity
  - Download statistics
- **Quick Actions**:
  - Add new document
  - Add new user
  - View recent submissions

**Priority**: 🟡 HIGH - Essential for content management

---

### 5. 🟡 MEDIUM: Two-Factor Authentication (2FA) for Admins

**Status**: 🟡 MEDIUM PRIORITY - Security enhancement

**Requirements**:
- **Grace Period**: 
  - New admins have 7 days to set up 2FA
  - Reminder emails after 3 days, 5 days
  - Forced 2FA after 7 days
- **Implementation**:
  - TOTP (Time-based One-Time Password)
  - Google Authenticator, Authy, etc.
  - Backup codes for recovery
- **Scope**:
  - Required for all admin accounts
  - Optional for regular members
- **User Experience**:
  - QR code setup
  - Backup codes generation
  - Clear instructions

**Priority**: 🟡 MEDIUM - Important security enhancement, but can wait

---

## 📋 Lower Priority Tasks

### 6. Domain DNS Configuration (When You Get DNS Access)

**Status**: ⏳ Waiting for DNS access

**Tasks**:
1. Point `goldencompasses.org` to your Cloudflare Worker
2. Add SPF record for better email deliverability:
   ```
   TXT: v=spf1 include:resend.com ~all
   ```
3. Optional: Add DKIM record (Resend provides this)

**Benefits**:
- Professional domain URL (not workers.dev subdomain)
- Better email deliverability
- Branded emails from `@goldencompasses.org`

**Priority**: 🟢 LOW - Nice to have, doesn't affect functionality

---

### 7. Update Secretary Email

**Status**: 🟡 MEDIUM - Currently using placeholder email

**Current Setting**:
- File: `wrangler.toml` (line 21)
- Value: `lawrence@altomare.org` (placeholder)
- This email receives ALL form submissions (contact forms, membership requests)

**Action Required**:
When you receive Bill's secretary's email address:

1. Open `wrangler.toml` in a text editor
2. Find line 21:
   ```toml
   SECRETARY_EMAIL = "lawrence@altomare.org" # TODO: Update to Bill's secretary email when available
   ```
3. Replace `lawrence@altomare.org` with the actual secretary email
4. Save the file
5. Deploy changes:
   ```bash
   npm run deploy
   ```
6. Test by submitting a contact form and verify email arrives at the new address

**Priority**: 🟡 MEDIUM - Works currently, but needs correct email for production

---

### 8. 🟢 VERY LOW: Progressive Web App (PWA) - Phase 2 Bonus Feature

**Status**: 🟢 VERY LOW PRIORITY - Should be LAST task completed

**Important Notes**:
- ⚠️ **DO NOT attempt until web app is deployed to production domain** (goldencompasses.org)
- ⚠️ Adds significant troubleshooting complexity
- ✅ Great bonus feature for membership engagement
- ✅ Can be quick Phase 2 deliverable

**Why This Should Be LAST**:
1. PWA requires HTTPS on production domain (currently on workers.dev subdomain)
2. Service workers have caching complexities that can cause issues
3. Debugging PWA issues is more difficult than standard web features
4. Should be implemented after ALL core functionality is complete and stable
5. Testing should be done on production domain, not staging

**Required PWA Features**:
- **Service Worker**: Offline caching of core pages and resources
- **Web App Manifest**: 
  - App name and icons
  - Theme colors
  - Display mode (standalone)
  - Start URL
- **Installability**: 
  - "Add to Home Screen" prompt
  - Desktop install support
  - App-like experience on mobile
- **Offline Functionality**:
  - Cached library pages
  - Offline access to previously viewed content
  - "You're offline" messaging

**Implementation Timeline**:
```
Phase 1: Complete all core functionality (Tasks 1-5)
Phase 1: Deploy to production domain (goldencompasses.org)
Phase 1: Test and verify all features work perfectly

--- ONLY THEN ---

Phase 2: Implement PWA features
Phase 2: Test PWA on production domain
Phase 2: Deploy to membership as bonus feature
```

**Prerequisites** (MUST be completed first):
- [ ] All core functionality working (Tasks 1-5)
- [ ] Deployed to production domain (goldencompasses.org)
- [ ] DNS fully configured and propagating
- [ ] SSL certificate active on production domain
- [ ] All features tested and stable
- [ ] No critical bugs or issues

**PWA Benefits**:
- Members can "install" app on mobile devices
- Faster loading times (caching)
- Works offline for cached content
- App-like experience on mobile and desktop
- Push notifications capability (future)

**PWA Challenges** (Why to wait):
- Service worker debugging is complex
- Cache invalidation requires careful planning
- Can cause issues if not implemented correctly
- Updates to cached content require strategy
- Browser compatibility considerations

**Priority**: 🟢 VERY LOW - Nice bonus feature, but definitely LAST

**Recommended Order**: Complete this ONLY after all other tasks are done AND deployed to production domain

---

## ✅ Completed Tasks

- [x] Security audit and hardening
- [x] Email notification system (Resend)
- [x] Thank you pages for forms
- [x] Form submission UX improvements
- [x] Rate limiting implementation
- [x] Security logging
- [x] Input sanitization
- [x] Deployment to Cloudflare Workers
- [x] Contact page map buttons and spacing
- [x] Git history cleanup (API key removal)

---

## 📞 Quick Reference

**Live Site**: https://gcrl-website.lawrence-675.workers.dev

**Contact Form**: https://gcrl-website.lawrence-675.workers.dev/contact

**Membership Form**: https://gcrl-website.lawrence-675.workers.dev/join

**Admin Dashboard**: https://gcrl-website.lawrence-675.workers.dev/admin

**Email Service**: Resend (3,000 emails/month free)

**Database**: Cloudflare D1

**Storage**: Cloudflare R2

---

## 🔄 Regular Maintenance

**Weekly**:
- Check for new form submissions
- Review security logs

**Monthly**:
- Review email deliverability
- Check rate limiting effectiveness

**As Needed**:
- Update content in pages
- Add/remove library documents
- Rotate passwords (optional)

---

*Last Updated: January 2, 2026*
