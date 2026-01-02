# Architecture Documentation

## Golden Compasses Research Lodge Website

**Version:** v19  
**Last Updated:** December 31, 2025  
**Status:** Production-Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Data Flow](#data-flow)
5. [Security Model](#security-model)
6. [Database Schema](#database-schema)
7. [File Organization](#file-organization)
8. [API Endpoints](#api-endpoints)
9. [Deployment Architecture](#deployment-architecture)

---

## System Overview

The Golden Compasses Research Lodge website is a **serverless web application** built on Cloudflare Workers. It serves as both a public information site and a secure document library for Masonic research papers.

### Core Features

1. **Public Pages:** Home, About, Library (view-only), Links, Contact, Join
2. **Document Library:** Public can view titles, members can download PDFs
3. **Admin Dashboard:** Document management, membership request tracking
4. **Security:** Rate limiting, input sanitization, 2FA authentication
5. **Responsive Design:** Mobile-friendly across all devices

### Design Philosophy

- **Security First:** All user inputs sanitized, rate limiting enforced
- **Simple over Complex:** No frameworks, vanilla TypeScript only
- **Progressive Enhancement:** Works without JavaScript, enhanced with it
- **Serverless:** No server management, auto-scaling on Cloudflare edge

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **TypeScript** | Type-safe JavaScript | 5.x |
| **HTML5** | Semantic markup | - |
| **CSS3** | Styling with custom properties | - |
| **Vanilla JS** | No frameworks/libraries | ES5+ |

### Backend

| Technology | Purpose | Provider |
|------------|---------|----------|
| **Cloudflare Workers** | Serverless compute | Cloudflare |
| **D1 Database** | SQLite-compatible database | Cloudflare |
| **R2 Storage** | Object storage for PDFs/images | Cloudflare |
| **KV (optional)** | Key-value store for caching | Cloudflare |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Wrangler** | Cloudflare Workers CLI |
| **Git** | Version control |
| **Node.js** | Package management (v24+) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                  (Desktop, Tablet, Mobile)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
│                  (Global CDN + Workers)                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           CLOUDFLARE WORKER (index.ts)               │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────┐      │  │
│  │  │  Request Router (fetch handler)            │      │  │
│  │  │  - Static assets (CSS, images)             │      │  │
│  │  │  - API routes (/api/*)                     │      │  │
│  │  │  - Admin routes (/admin/*)                 │      │  │
│  │  │  - Public pages (/*)                       │      │  │
│  │  └────────────────────────────────────────────┘      │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────┐      │  │
│  │  │  Security Layer                            │      │  │
│  │  │  - Rate limiting (per IP)                   │      │  │
│  │  │  - Input sanitization (XSS prevention)      │      │  │
│  │  │  - Authentication (password + 2FA)          │      │  │
│  │  │  - Security headers (CSP, HSTS, etc.)      │      │  │
│  │  └────────────────────────────────────────────┘      │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────┐      │  │
│  │  │  Page Generators (pages.ts)                │      │  │
│  │  │  - Home, About, Library, Links, Contact     │      │  │
│  │  │  - Admin login, 2FA pages                  │      │  │
│  │  └────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────────┐
│  D1 Database│ │   R2      │ │ Cloudflare   │
│             │ │  Storage  │ │ Logging      │
│ - Documents │ │ - PDFs    │ │             │
│ - Requests  │ │ - Images  │ │ - Analytics  │
│ - 2FA       │ │ - CSS     │ │ - Metrics    │
│ - Logs      │ │           │ │             │
└─────────────┘ └──────────┘ └──────────────┘
```

---

## Data Flow

### 1. Public Page Request

```
User → Cloudflare Edge → Worker Router → Page Generator → HTML Response
                                                          ↓
                                                    Add Security Headers
                                                          ↓
                                                    Return to User
```

**Example:** User visits `/about`

1. Browser sends GET request to `/about`
2. Cloudflare routes to nearest edge data center
3. Worker receives request in `fetch()` handler
4. Router matches path to `AboutPage()` generator
5. HTML generated with navigation, content, footer
6. Security headers added (CSP, HSTS, etc.)
7. HTML response returned to browser

### 2. Document Download (Password Protected)

```
User → Document Detail Page → Enter Password → POST /download/{id}
                                                     ↓
                                               Verify Password
                                                     ↓
                                            Check Rate Limiting
                                                     ↓
                                         Fetch from R2 Storage
                                                     ↓
                                              Log Security Event
                                                     ↓
                                          Return PDF with Headers
```

**Example:** User downloads document

1. User visits `/library/{document-id}`
2. Views document details (title, description, size)
3. Enters library password in form
4. POSTs to `/library/{document-id}/download`
5. Worker verifies password against `LIBRARY_PASSWORD` env var
6. Checks rate limiting (max 10 downloads per hour per IP)
7. Fetches PDF from R2 storage
8. Logs download to security_logs table
9. Returns PDF with `Content-Disposition: attachment` header

### 3. Admin Authentication (2FA)

```
Admin → /admin/login → Enter Password → POST /admin/verify
                                                    ↓
                                              Verify Admin Password
                                                    ↓
                                         Check if 2FA Enabled
                                                    ↓
                                  ┌─────────────────┴─────────────────┐
                                  │                                   │
                              2FA Disabled                         2FA Enabled
                                  │                                   │
                            Return Token                    Show 2FA Page
                                  │                                   │
                            Access Granted                   Enter TOTP Code
                                                                  │
                                                            Verify TOTP
                                                                  │
                                                            Return Token
                                                                  ↓
                                                            Access Granted
```

---

## Security Model

### Defense in Depth

The application uses **multiple layers of security**:

#### Layer 1: Cloudflare Edge Security
- DDoS protection (automatic)
- SSL/TLS encryption (forced)
- Web Application Firewall (WAF)
- Bot Fight Mode

#### Layer 2: Application Security
- **Rate Limiting:**
  - Admin login: 3 attempts per 15 minutes
  - Downloads: 10 attempts per hour
  - Forms: 5 attempts per 15 minutes
- **Input Sanitization:**
  - All user input escaped for XSS prevention
  - Length limits to prevent DoS
  - Filename sanitization for path traversal prevention
- **Authentication:**
  - Admin: Password + TOTP 2FA
  - Library: Shared password (temporary solution)
  - Sessions: Password-based tokens (no cookies yet)
- **Security Headers:**
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Content-Security-Policy: default-src 'self'
  Strict-Transport-Security: max-age=31536000
  ```

#### Layer 3: Database Security
- Prepared statements (SQL injection prevention)
- Password hashing (for future user system)
- Audit logging for all security events

### Attack Vector Protection

| Attack | Protection Method |
|--------|------------------|
| **XSS** | HTML escaping, CSP headers |
| **SQL Injection** | Prepared statements, input sanitization |
| **DDoS** | Cloudflare edge, rate limiting |
| **Brute Force** | Rate limiting, strong password requirements |
| **Path Traversal** | Filename sanitization, UUID validation |
| **CSRF** | POST-only forms, origin checks |
| **MITM** | Forced HTTPS, HSTS headers |
| **Clickjacking** | X-Frame-Options: DENY |

---

## Database Schema

### Tables

#### `documents`
Stores PDF document metadata and file references.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (UUID) | Primary key, document identifier |
| `title` | TEXT | Document title |
| `description` | TEXT | Document description |
| `category` | TEXT | Document category (e.g., "History", "Philosophy") |
| `filename` | TEXT | R2 storage key (UUID.pdf) |
| `file_size` | INTEGER | File size in bytes |
| `upload_date` | TEXT (ISO8601) | Upload timestamp |
| `uploaded_by` | TEXT | Admin who uploaded |

**Indexes:** None yet (TODO: Add index on `upload_date` for sorting)

#### `membership_requests`
Stores contact form submissions and membership requests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `name` | TEXT | Submitter name |
| `email` | TEXT | Submitter email |
| `phone` | TEXT | Phone number (optional) |
| `message` | TEXT | Message content |
| `submitted_date` | TEXT (ISO8601) | Submission timestamp |
| `status` | TEXT | "pending", "contact", "approved", "rejected" |

**Indexes:** None yet (TODO: Add index on `submitted_date`)

#### `security_logs`
Audit log for security-relevant events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `timestamp` | TEXT (ISO8601) | Event timestamp |
| `ip` | TEXT | Client IP address |
| `event` | TEXT | Event type (e.g., "ADMIN_LOGIN_SUCCESS") |
| `details` | TEXT | Additional event details |

**Events Logged:**
- `ADMIN_LOGIN_SUCCESS`, `ADMIN_LOGIN_FAILED`
- `2FA_ENABLED`, `2FA_DISABLED`, `2FA_VERIFY_SUCCESS`, `2FA_VERIFY_FAILED`
- `DOCUMENT_UPLOAD`, `DOCUMENT_DELETE`, `DOCUMENT_DOWNLOAD`
- `CONTACT_SUBMISSION`, `MEMBERSHIP_REQUEST`
- `RATE_LIMIT_EXCEEDED`, `DOWNLOAD_RATE_LIMIT`

#### `admin_2fa`
Stores TOTP configuration for admin account.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (always 1) |
| `totp_secret` | TEXT | Base32-encoded TOTP secret |
| `totp_enabled` | INTEGER | 1 = enabled, 0 = disabled |
| `backup_codes` | TEXT | JSON array of backup codes |
| `setup_date` | TEXT (ISO8601) | When 2FA was configured |

---

## File Organization

```
gcrl-website/
├── src/
│   ├── index.ts              # Main entry point, request router
│   ├── types.ts              # TypeScript type definitions
│   ├── styles.css            # Main stylesheet
│   └── lib/
│       ├── auth.ts           # Authentication, rate limiting, logging
│       ├── headers.ts        # Security headers, CORS
│       ├── sanitize.ts       # Input sanitization, XSS prevention
│       ├── pages.ts          # HTML page generators
│       └── totp.ts           # Two-factor authentication (TOTP)
├── public/
│   ├── logo.png              # Lodge logo
│   ├── hero.jpg              # Hero background image
│   ├── background.jpg        # Page background image
│   ├── manifest.json         # PWA manifest (deferred)
│   ├── sw.js                 # Service worker (deferred)
│   ├── icon-192.png          # PWA icon 192x192 (deferred)
│   └── icon-512.png          # PWA icon 512x512 (deferred)
├── schema.sql                # Database schema
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Node.js dependencies
├── ARCHITECTURE.md           # This file
├── README.md                 # User-facing documentation
├── CONTRIBUTING.md           # Contributor guidelines
└── DEPLOYMENT-CHECKLIST.md   # Deployment guide
```

---

## API Endpoints

### Public API

#### `POST /api/contact`
Submit contact form.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "Question about membership..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Thank you for your message!"
}
```

#### `POST /api/join`
Submit membership request.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "interests": "Masonic history",
  "message": "I'd like to join..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Thank you for your interest! We will contact you soon."
}
```

### Admin API

#### `POST /admin/verify`
Verify admin password.

**Request:**
```json
{
  "password": "ADMIN_PASSWORD"
}
```

**Response:** `200 OK`
```json
{
  "require2FA": true,
  "message": "Two-factor authentication required"
}
```

#### `GET /admin/2fa-status`
Check if 2FA is enabled.

**Headers:** `Authorization: Bearer ADMIN_PASSWORD`

**Response:** `200 OK`
```json
{
  "enabled": true
}
```

#### `GET /admin/setup-2fa`
Generate TOTP secret and backup codes.

**Headers:** `Authorization: Bearer ADMIN_PASSWORD`

**Response:** `200 OK`
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["1234-5678-9012-3456", ...],
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/...",
  "totpUri": "otpauth://totp/..."
}
```

#### `POST /admin/enable-2fa`
Verify TOTP code and enable 2FA.

**Headers:** `Authorization: Bearer ADMIN_PASSWORD`

**Request:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "code": "123456",
  "backupCodes": ["1234567890123456", ...]
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

#### `POST /admin/documents`
Upload PDF document.

**Headers:** `Authorization: Bearer ADMIN_PASSWORD`

**Request:** `multipart/form-data`
- `file`: PDF file
- `title`: Document title
- `description`: Document description
- `category`: Document category

**Response:** `200 OK`
```json
{
  "success": true,
  "documentId": "uuid-here"
}
```

#### `DELETE /admin/documents/{id}`
Delete PDF document.

**Headers:** `Authorization: Bearer ADMIN_PASSWORD`

**Response:** `200 OK`
```json
{
  "success": true
}
```

#### `GET /admin/api/data`
Get dashboard data (documents + requests).

**Headers:** `Authorization: Bearer ADMIN_PASSWORD`

**Response:** `200 OK`
```json
{
  "documents": [...],
  "requests": [...]
}
```

---

## Deployment Architecture

### Cloudflare Workers Deployment

```
Development (Local)          Production (Cloudflare)
┌──────────────────┐          ┌─────────────────────────┐
│ npm run dev      │          │ Cloudflare Edge Network │
│ (localhost:8787) │  ──────> │  (300+ data centers)    │
└──────────────────┘          └─────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────────┐
                          │  D1 Database (SQLite)  │
                          │  R2 Storage (Objects)   │
                          │  Analytics Logging     │
                          └─────────────────────────┘
```

### Environment Variables

Set via `wrangler secret put`:

| Variable | Purpose | Example |
|----------|---------|---------|
| `ADMIN_PASSWORD` | Admin authentication | `Golden$Compass2024` |
| `LIBRARY_PASSWORD` | Library download access | `NorthStar7!Research` |

### Build Process

```bash
# 1. Build TypeScript
npm run build

# 2. Deploy to Cloudflare
npm run deploy

# 3. Upload static assets to R2
wrangler r2 object put gcrl-documents/styles.css --file=src/styles.css
wrangler r2 object put gcrl-documents/logo.png --file=public/logo.png
# ... etc
```

---

## Performance Considerations

### Caching Strategy

- **CSS:** Cache busting with `?v=19` query parameter
- **Images:** Cloudflare CDN caching (default 1 hour)
- **HTML:** No caching (generated dynamically)
- **API Responses:** No caching (security-sensitive)

### Optimization Opportunities

- [ ] Add D1 query indexes for performance
- [ ] Implement response caching for public pages
- [ ] Optimize image sizes (currently uncompressed)
- [ ] Add Cloudflare KV caching layer
- [ ] Implement pagination for document library

---

## Future Enhancements

### Planned (Phased)

1. **User Authentication System** (Next Major Feature)
   - Individual user accounts
   - Role-based access control (Admin vs Member)
   - Session management with secure cookies
   - Password reset via email

2. **PWA Deployment** (Deferred)
   - Offline functionality
   - Install prompts
   - Background sync

3. **Content Management**
   - Rich text editor for document descriptions
   - Image gallery
   - News/blog section

### Technical Debt

- [ ] Add comprehensive error handling
- [ ] Implement logging service (Sentry, etc.)
- [ ] Add unit tests for critical functions
- [ ] Implement database migrations system
- [ ] Add API rate limiting per user (not just per IP)

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review security logs for suspicious activity
- Check for new membership requests
- Verify rate limiting is working

**Monthly:**
- Rotate passwords (optional but recommended)
- Review and update WAF rules
- Audit admin access logs
- Check for Cloudflare Worker updates

**Quarterly:**
- Review and update dependencies
- Performance audit
- Security review

---

## Support

**Documentation:** See README.md, CONTRIBUTING.md  
**Issues:** Contact Lawrence Altomare  
**Deployed URL:** https://gcrl-website.lawrence-675.workers.dev  
**Production URL:** https://goldencompasses.org (when configured)

---

**Last Updated:** December 31, 2025  
**Document Version:** 1.0  
**Maintainer:** Lawrence Altomare
