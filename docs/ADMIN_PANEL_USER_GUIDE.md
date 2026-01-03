# Golden Compasses Research Lodge - Admin Panel User Guide

**Version:** 1.0  
**Last Updated:** January 2, 2026  
**Software Version:** dc763f83  
**Author:** Lawrence Altomare  
**Copyright:** © 2026 Lawrence & Shelley Altomare Trust

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication & Security](#authentication--security)
4. [Dashboard Features](#dashboard-features)
5. [Membership Request Management](#membership-request-management)
6. [Document Management](#document-management)
7. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
8. [Security & Audit Logs](#security--audit-logs)
9. [Feature Roadmap](#feature-roadmap)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

### What is the Admin Panel?

The Golden Compasses Research Lodge Admin Panel is a web-based administrative interface that enables lodge administrators to:

- Manage membership requests and track prospects
- Upload and organize research documents
- Monitor system statistics
- Configure security settings
- Review audit logs

### Who Should Use This Guide?

This guide is intended for:
- **Lodge Secretaries** - Managing memberships and communications
- **Lodge Officers** - Overseeing operations and documents
- **System Administrators** - Managing technical configuration

### System Architecture

**Technology Stack:**
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Cloudflare Workers (serverless edge computing)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (object storage)
- **Authentication:** Password + TOTP 2FA

**Access URL:**
- Development: https://gcrl-website.lawrence-675.workers.dev/admin
- Production: https://goldencompasses.org/admin

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Admin credentials (password + 2FA if enabled)
- Recommended: Screen resolution 1280x720 or higher

### First-Time Login

1. **Navigate to Admin Panel**
   - Go to: `https://goldencompasses.org/admin`

2. **Enter Admin Password**
   - Minimum 14 characters
   - Case-sensitive

3. **Enter 2FA Code** (if enabled)
   - Open your authenticator app
   - Enter the 6-digit code
   - Or use a backup code

4. **Dashboard Loads**
   - View statistics
   - Manage requests and documents
   - Configure settings

### Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard          [View Site] [Logout]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │  Docs   │ │ Pending │ │  Total  │              │
│  │    5    │ │    2    │ │   12    │              │
│  └─────────┘ └─────────┘ └─────────┘              │
│                                                     │
│  ┌─────────────────────┐ ┌─────────────────────┐  │
│  │   📄 Documents      │ │  📧 Membership      │  │
│  │                     │ │     Requests        │  │
│  │  [Upload Document]  │ │                     │  │
│  │                     │ │  [Request List]      │  │
│  │  Document Table     │ │                     │  │
│  │                     │ │                     │  │
│  └─────────────────────┘ └─────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  🔐 Two-Factor Authentication                │  │
│  │  Status: Enabled                             │  │
│  │  [Enable 2FA] [Disable 2FA]                  │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Authentication & Security

### Login Process

**Step 1: Password Verification**
```
POST /admin/verify
Content-Type: application/json

{
  "password": "your-admin-password-min-14-chars"
}
```

**Step 2: Two-Factor Authentication** (if enabled)
```
POST /admin/verify-2fa
Content-Type: application/json

{
  "code": "123456",  // TOTP code from authenticator app
  "backup_code": "ABCD-1234-EFGH-5678"  // OR backup code
}
```

**Step 3: Receive JWT Token**
- Token stored in `localStorage`
- Valid for session duration
- Sent with all API requests

### Security Features

- **Password Requirements:** Minimum 14 characters
- **Rate Limiting:** 5 attempts per 15 minutes
- **2FA Support:** TOTP-based (Google Authenticator, Authy, etc.)
- **Audit Logging:** All security events logged
- **Session Management:** JWT tokens with expiration
- **Secure Headers:** CSP, HSTS, X-Frame-Options

### Best Practices

✅ **DO:**
- Enable 2FA for all admin accounts
- Use strong, unique passwords
- Log out when finished
- Keep backup codes secure
- Monitor audit logs regularly

❌ **DON'T:**
- Share admin credentials
- Write passwords down
- Use public WiFi for admin access
- Ignore security alerts
- Leave dashboard unattended

---

## Dashboard Features

### Statistics Overview

The dashboard displays three key statistics:

**Documents Count**
- Total number of documents in the library
- Updated in real-time
- Click to view document list

**Pending Requests**
- Number of pending membership requests
- Requires attention
- Click to manage requests

**Total Requests**
- All membership requests in system
- Includes all statuses
- Overall system activity

### Navigation

**Header Actions:**
- **View Site** - Opens public website in new tab
- **Logout** - Securely ends admin session

**Dashboard Sections:**
- **Documents** - Manage research documents
- **Membership Requests** - Handle membership applications
- **2FA Settings** - Configure two-factor authentication

---

## Membership Request Management

### Understanding the 4-Status Workflow

The membership request system uses a 4-status workflow designed for prospect management:

```
┌──────────┐
│ PENDING  │  ← New requests start here
└────┬─────┘
     │
     ├───► CONTACTED ──► APPROVED ──► DELETE
     │        │
     │        └───────────┬───────┘
     │                    │
     └────────────────────┴───────► REJECTED ──► DELETE
```

**Status Descriptions:**

| Status | Description | Available Actions |
|--------|-------------|-------------------|
| **Pending** | New request awaiting review | Contact, Approve, Reject |
| **Contacted** | Marked as contacted, follow-up in progress | Approve, Reject, Delete |
| **Approved** | Membership approved, member onboarded | Delete (archive) |
| **Rejected** | Membership denied | Delete (archive) |

### Managing Requests

**View Requests:**
1. Navigate to "Membership Requests" section
2. View all requests with status badges
3. See request details (name, email, date, status)

**Change Request Status:**

**Option A: Contact First**
1. Click "Contact" button on pending request
2. Status changes to "Contacted"
3. Follow up with prospect via email/phone
4. Later: Approve or Reject

**Option B: Direct Decision**
1. Click "Approve" to accept membership
2. Click "Reject" to decline membership
3. Status updates immediately

**Delete Requests:**
- Available for non-pending requests
- Permanently removes from database
- Confirmation dialog required
- Cannot be undone

### Prospect Management Workflow

**Best Practice Workflow:**

1. **New Request Arrives** (Status: Pending)
   - Review request details
   - Check if prospect meets criteria

2. **Initial Contact** (Status: Contacted)
   - Send welcome email
   - Schedule call or meeting
   - Provide lodge information
   - Answer questions

3. **Decision** (Status: Approved/Rejected)
   - **Approved:** Begin onboarding process
   - **Rejected:** Send polite decline notification

4. **Archival** (Delete)
   - Remove old/approved requests from active view
   - Keeps system clean
   - Approved members moved to member database (Phase 3)

### API Endpoints

**Update Status:**
```http
PATCH /admin/api/requests/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "contacted"  // or "approved", "rejected"
}
```

**Delete Request:**
```http
DELETE /admin/api/requests/{id}
Authorization: Bearer <token>
```

---

## Document Management

### Uploading Documents

**Supported Formats:**
- PDF files only (.pdf)
- Maximum file size: 10 MB

**Upload Process:**
1. Click "Upload Document" button
2. Fill in document details:
   - **Title** (required) - Document name
   - **Description** (optional) - Brief summary
   - **Category** (optional) - Organize by topic
3. Select PDF file from computer
4. Click "Upload"
5. Document appears in table immediately

**Best Practices:**
- Use descriptive titles
- Add meaningful descriptions
- Categorize documents for easy browsing
- Use consistent naming conventions

### Viewing Documents

Documents are stored in Cloudflare R2 and served via:
- Public library page at `/library`
- Direct download links
- Secure access control

### Deleting Documents

**Process:**
1. Find document in Documents table
2. Click "Delete" button
3. Confirm deletion in dialog
4. Document removed from:
   - Database (metadata)
   - R2 Storage (file)
   - Library page

**Warning:** Deletion is permanent and cannot be undone.

### API Endpoints

**Upload Document:**
```http
POST /admin/api/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF file>
title: "Document Title"
description: "Document description"
category: "Category name"
```

**Delete Document:**
```http
DELETE /admin/api/documents/{id}
Authorization: Bearer <token>
```

---

## Two-Factor Authentication (2FA)

### What is 2FA?

Two-factor authentication adds an extra layer of security by requiring:
1. Something you know (password)
2. Something you have (authenticator app/backup codes)

### Enabling 2FA

**Step 1: Start Setup**
1. Navigate to 2FA section in dashboard
2. Click "Enable 2FA" button
3. Click "Continue" to proceed

**Step 2: Scan QR Code**
1. Open authenticator app on mobile device
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - Any TOTP-compatible app
2. Scan QR code displayed on screen
3. App generates 6-digit codes

**Step 3: Save Backup Codes**
1. **CRITICAL:** Write down backup codes
2. Store in secure location (safe, password manager)
3. Each code can be used once
4. Cannot be recovered if lost

**Step 4: Verify Setup**
1. Enter 6-digit code from authenticator app
2. Click "Enable 2FA"
3. 2FA is now active

### Using 2FA

**Daily Login:**
1. Enter password
2. Open authenticator app
3. Enter current 6-digit code
4. Codes change every 30 seconds

**If Device Lost:**
1. Use backup code instead of app
2. Backup codes never expire
3. Each code single-use

### Disabling 2FA

**Warning:** Not recommended - reduces security

**Process:**
1. Navigate to 2FA section
2. Click "Disable 2FA"
3. Confirm decision
4. 2FA is disabled
5. Old backup codes are invalidated

### Troubleshooting 2FA

**Code Not Working:**
- Wait for next code (30-second timer)
- Check device time is correct
- Try backup code

**Lost Authenticator:**
- Use backup code to login
- Disable 2FA
- Re-enable with new device

---

## Security & Audit Logs

### What Gets Logged?

All security-related events are logged to the database:

- Login attempts (success/failure)
- 2FA verification
- Password changes
- Request status updates
- Document uploads/deletes
- Failed authentication attempts
- Rate limit violations

### Viewing Logs

**Current Version:** Logs stored in database
**Future:** Log viewer in dashboard

### Audit Trail

Every action in the admin panel creates an audit record including:
- Timestamp
- IP address
- User agent
- Action performed
- Details

---

## Feature Roadmap

### ✅ Phase 1: Complete (Current Version)

**Website & Basic Admin:**
- ✅ Public website pages (Home, About, Library, Links, Contact, Join)
- ✅ Contact form with email notifications
- ✅ Document library with PDF uploads
- ✅ Basic admin authentication (password)
- ✅ Membership request collection
- ✅ Security features (rate limiting, headers, logging)
- ✅ Thank you pages
- ✅ Responsive design

**Admin Dashboard (Current):**
- ✅ Login with password
- ✅ 2FA support (TOTP + backup codes)
- ✅ Document management (upload, delete, list)
- ✅ Membership request management (4-status workflow)
- ✅ Statistics overview
- ✅ Security headers
- ✅ Audit logging

### 🔄 Phase 2: In Development

**Prospect Management System:**
- ✅ 4-status workflow (pending → contact → approved/rejected)
- ✅ Contact tracking
- ✅ Request notes/comments (planned)
- ✅ Email history tracking (planned)
- ✅ Advanced filtering and search (planned)

**Enhanced Admin Features:**
- [ ] Bulk operations (approve/reject multiple)
- [ ] Export data (CSV, PDF)
- [ ] Advanced analytics and reporting
- [ ] Email campaign integration
- [ ] Task reminders and follow-ups

### 📋 Phase 3: Future Plans

**Member Database & CRUD:**
- [ ] Member profiles with full details
- [ ] Member directory (public/private views)
- [ ] Member search and filtering
- [ ] Member communication tools
- [ ] Membership tiers/levels
- [ ] Dues/payment tracking
- [ ] Member portal for self-service

**Advanced Features:**
- [ ] Event management and registration
- [ ] Newsletter system
- [ ] Document versioning
- [ ] Role-based access control (RBAC)
- [ ] Multi-admin support with permissions
- [ ] API for third-party integrations
- [ ] Mobile app companion

### 💡 Phase 4: Long-term Vision

**Full Outreach System:**
- CRM-style contact management
- Automated email workflows
- Social media integration
- Analytics and insights
- Integration with lodge management tools
- Member engagement tracking

---

## Troubleshooting

### Common Issues

**Dashboard Won't Load**
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Try incognito/private mode
- Check internet connection
- Verify URL is correct

**Login Fails**
- Check password (case-sensitive, 14+ characters)
- Verify 2FA code is current
- Use backup code if device unavailable
- Check rate limit (wait 15 minutes if exceeded)

**Documents Won't Upload**
- Verify file is PDF format
- Check file size (max 10 MB)
- Ensure all fields filled correctly
- Check internet connection

**Buttons Not Working**
- Wait for page to fully load
- Check browser console for errors (F12)
- Try different browser
- Clear cache and reload

### Error Messages

**"Invalid JSON format"**
- Login form issue
- Ensure JavaScript is enabled
- Try different browser

**"Unauthorized"**
- Session expired
- Login again
- Check token hasn't been cleared

**"Too many attempts"**
- Rate limit exceeded
- Wait 15 minutes
- Contact admin if persistent

### Getting Help

**Check Documentation:**
- This user guide
- Root Cause Analysis (docs/ROOT_CAUSE_ANALYSIS.md)
- Code comments in source

**Contact Information:**
- Lodge Secretary: [Email]
- System Administrator: [Email]
- GitHub Issues: [Repository URL]

---

## Best Practices

### Security Best Practices

1. **Enable 2FA** - Always use two-factor authentication
2. **Strong Passwords** - Use unique, complex passwords
3. **Regular Updates** - Keep browser and software updated
4. **Logout** - Always log out when finished
5. **Monitor Logs** - Review audit logs regularly
6. **Secure Backup Codes** - Store in safe, accessible location

### Operational Best Practices

1. **Regular Backups** - Export data periodically
2. **Test Restores** - Verify backup integrity
3. **Document Changes** - Note configuration updates
4. **Review Requests** - Check membership requests daily
5. **Update Documents** - Keep library current
6. **Monitor Statistics** - Track system usage

### Workflow Best Practices

1. **Prompt Response** - Respond to requests quickly
2. **Status Updates** - Keep prospects informed
3. **Clear Communication** - Be professional and courteous
4. **Detailed Notes** - Document interactions (Phase 2)
5. **Follow Up** - Don't let prospects fall through cracks
6. **Archive Old Data** - Delete processed requests regularly

---

## Appendix

### Keyboard Shortcuts

*(Future enhancement - planned for Phase 2)*

### System Requirements

**Minimum:**
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Screen resolution: 1024x768
- Internet: 1 Mbps

**Recommended:**
- Latest browser version
- Screen resolution: 1280x720 or higher
- Internet: 5 Mbps+

### Data Retention

**Membership Requests:**
- Pending: Retained until processed
- Contacted: Retained 6 months after last action
- Approved: Moved to member database (Phase 3)
- Rejected: Retained 1 year for audit purposes

**Documents:**
- Retained indefinitely
- Version history (Phase 2)

**Audit Logs:**
- Retained 1 year
- Exportable (Phase 2)

### Glossary

- **JWT** - JSON Web Token, used for authentication
- **TOTP** - Time-based One-Time Password, 2FA method
- **R2** - Cloudflare's object storage service
- **D1** - Cloudflare's SQLite database service
- **CRUD** - Create, Read, Update, Delete operations
- **RBAC** - Role-Based Access Control

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2026  
**Next Review:** When new features are added

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial documentation - Admin Panel User Guide |

---

**© 2026 Golden Compasses Research Lodge. All rights reserved.**

This documentation is part of the Golden Compasses Research Lodge website project. For the latest version, check the project repository.
