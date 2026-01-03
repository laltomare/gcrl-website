# GCRL Website - Technical Architecture

**Last Updated**: January 3, 2026

---

## Project Overview

**Project**: Golden Compasses Research Lodge (GCRL) Website
**Type**: Cloudflare Workers (serverless edge computing)
**Framework**: TypeScript + Cloudflare Workers API
**Repository**: https://github.com/laltomare/gcrl-website.git

---

## Technology Stack

### Core Technologies
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Language**: TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (object storage)
- **Authentication**: OTP-based (OTPAuth library)
- **Email**: Resend API (contact forms)

### Dependencies
```json
{
  "dependencies": {
    "otpauth": "^9.4.1"
  }
}
```

**Note**: Hono framework is intentionally NOT installed. Route files use Hono-like syntax for documentation purposes only.

---

## Project Structure

```
gcrl-website/
├── src/
│   ├── index.ts                 # Main entry point (route handlers)
│   ├── types.ts                 # TypeScript type definitions
│   ├── lib/
│   │   ├── pages.ts             # (OLD - being phased out)
│   │   ├── pages/               # (NEW - modular page components)
│   │   │   ├── base.ts          # BasePage, HTML utilities
│   │   │   ├── home.ts          # Home page
│   │   │   ├── about.ts         # About page
│   │   │   ├── library.ts       # Library page
│   │   │   ├── links.ts         # Links page
│   │   │   ├── contact.ts       # Contact page
│   │   │   ├── join.ts          # Join page
│   │   │   ├── thank-you.ts     # Thank you page
│   │   │   └── index.ts         # Central exports
│   │   ├── db.ts                # Database utilities
│   │   ├── email.ts             # Email utilities
│   │   └── auth.ts              # Authentication utilities
│   └── routes/                  # (NEW - route documentation)
│       ├── public.ts            # Public routes docs
│       ├── api.ts               # API routes docs + implementations
│       ├── admin.ts             # Admin routes docs
│       └── download.ts          # Download routes docs + implementations
├── context/                     # Session context documents
├── wrangler.toml                # Cloudflare Workers config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── README.md
```

---

## Database Schema

### Existing Tables

#### 1. documents
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  file_url TEXT NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by TEXT,
  access_level TEXT DEFAULT 'member',
  is_published BOOLEAN DEFAULT 0
);
```

#### 2. events
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  location TEXT,
  is_published BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. membership_requests
```sql
CREATE TABLE membership_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  lodge TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. admin_sessions
```sql
CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  otp_code TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. two_factor_tokens
```sql
CREATE TABLE two_factor_tokens (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES admin_sessions(id)
);
```

### Tables Needed for User CRUD (Next Task)

#### 6. users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1
);
```

**Roles**:
- `admin` - Full administrative access
- `secretary` - Can manage membership requests
- `member` - Standard member access
- `guest` - Limited access (not yet implemented)

#### 7. sessions
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Routes Overview

### Public Routes
```
GET  /                    - Home page
GET  /about               - About page
GET  /library             - Library page
GET  /links               - Links page
GET  /contact             - Contact page
GET  /join                - Membership join page
GET  /join/thank-you      - Thank you page (after form submission)
```

### API Routes
```
POST /api/contact         - Contact form submission
POST /api/join            - Membership request submission
GET  /api/events          - Public events list
```

### Admin Routes
```
GET  /admin               - Admin login
GET  /admin/dashboard     - Admin dashboard
GET  /admin/login/otp     - OTP login page
POST /admin/login/otp     - OTP login submit
GET  /admin/verify-2fa    - 2FA verification page
POST /admin/verify-2fa    - 2FA verification submit
GET  /admin/documents     - Document management
GET  /admin/events        - Event management
GET  /admin/requests      - Membership requests
GET  /admin/logout        - Logout
```

### Download Routes
```
GET  /download/:documentId - Download document (requires auth)
```

---

## Authentication Flow

### Admin Authentication (Current System)

1. **Login Request**
   - User enters email at `/admin`
   - System generates OTP code
   - Email sent with OTP using Resend API

2. **OTP Verification**
   - User enters OTP at `/admin/login/otp`
   - System validates OTP
   - Creates admin session in database

3. **2FA Verification**
   - User provides 2FA token at `/admin/verify-2fa`
   - System validates token against TOTP
   - Session marked as authenticated

4. **Session Management**
   - Sessions expire after configurable time
   - Session stored in `admin_sessions` table
   - 2FA tokens stored in `two_factor_tokens` table

### Future: User Authentication (To Be Implemented)

Will use similar flow but with `users` and `sessions` tables.

---

## Security Features

### Implemented
- ✅ Rate limiting on API endpoints
- ✅ Input sanitization (XSS prevention)
- ✅ OTP-based authentication
- ✅ Two-factor authentication (2FA)
- ✅ Session expiration
- ✅ Environment variable management
- ✅ SQL injection prevention (parameterized queries)

### Planned
- ⏳ User role-based access control
- ⏳ CSRF protection
- ⏳ Content Security Policy headers
- ⏳ Additional audit logging

---

## Environment Variables

Configured in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
DEV_MODE = "true"
SITE_NAME = "Golden Compasses Research Lodge"
SITE_URL = "https://goldencompasses.org"
SECRETARY_EMAIL = "lawrence@altomare.org"
```

**Secrets** (not in wrangler.toml):
- `RESEND_API_KEY` - Email sending
- `ADMIN_OTP_SECRET` - OTP generation
- `SESSION_SECRET` - Session encryption

---

## Development Workflow

### Local Development
```bash
cd gcrl-website
npx wrangler dev
```

### Deployment
```bash
# Commit changes
git add -A
git commit -m "description"

# Push to GitHub
git push origin main

# Deploy to Cloudflare
npx wrangler deploy
```

### Development URLs
- **Local**: `http://localhost:8787`
- **Dev**: `https://gcrl-website.lawrence-675.workers.dev`
- **Production**: `https://goldencompasses.org` (⚠️ compromised - do not use)

---

## Key Files Reference

### src/index.ts
**Purpose**: Main entry point, route handlers
**Size**: ~1,595 lines (being refactored)
**Key Functions**:
- `handleApiRoute()` - API route dispatcher
- `handleAdminRoute()` - Admin route dispatcher
- `handleDownload()` - Download handler
- `sendEmail()` - Email utility

### src/lib/pages/base.ts
**Purpose**: Base page component and utilities
**Exports**:
- `BasePage()` - HTML wrapper with header/footer
- `HTML` utilities (script, style, link tags)

### src/lib/db.ts
**Purpose**: Database connection and queries
**Key Functions**:
- Prepared statements for all tables
- Parameterized queries for security

### src/types.ts
**Purpose**: TypeScript type definitions
**Key Types**:
- `Env` - Cloudflare Workers bindings
- `Document` - Document record
- `Event` - Event record
- `MembershipRequest` - Membership request record

---

## Refactoring Progress

### Completed (Phase 1)
- ✅ Created `src/routes/` directory with documentation
- ✅ Extracted page components to `src/lib/pages/`
- ✅ Improved code organization
- ✅ Reduced monolithic file sizes
- ✅ Maintained zero visual/functional changes

### In Progress
- ⏳ User CRUD system (next priority)

### Planned
- ⏳ Enhanced role-based access control
- ⏳ Additional security features
- ⏳ Performance optimizations

---

## Important Notes

### Hono Framework
**Decision**: Intentionally NOT using Hono framework
**Reasoning**:
- Current approach works perfectly
- No need for additional dependency
- Route files serve as documentation
- Focus on User CRUD implementation

### Production vs Development
**Critical**: Always test on development URL
- ✅ Use: `https://gcrl-website.lawrence-675.workers.dev`
- ❌ Avoid: `https://goldencompasses.org` (compromised)

### Git Workflow
- Branch: `main`
- Remote: `https://github.com/laltomare/gcrl-website.git`
- All commits should be pushed before deploying

---

## Performance Characteristics

### Cloudflare Workers Benefits
- **Cold Start**: ~1ms (very fast)
- **Edge Computing**: Deployed globally
- **Scalability**: Auto-scaling
- **Cost**: Free tier generous

### Bundle Size
- **Total**: ~177 KB (uncompressed)
- **Gzipped**: ~35 KB
- **Very efficient** for edge deployment

---

## Testing Checklist

### Manual Testing (Completed)
- ✅ All public pages render correctly
- ✅ Contact form submits successfully
- ✅ Membership form submits successfully
- ✅ Admin login flow works
- ✅ 2FA verification works
- ✅ Document downloads work
- ✅ Events display correctly
- ✅ Links page (dead links removed)

### Testing for User CRUD (Next)
- ⏳ User creation
- ⏳ User reading (list, detail)
- ⏳ User updates
- ⏳ User deletion
- ⏳ Role management
- ⏳ Session management

---

## Common Commands

### Database Operations
```bash
# Open D1 console
npx wrangler d1 execute gcrl-documents --command="SELECT * FROM events"

# Run SQL file
npx wrangler d1 execute gcrl-documents --file=schema.sql

# Backup database
npx wrangler d1 export gcrl-documents --output=backup.sql
```

### Deployment Commands
```bash
# Deploy to Cloudflare
npx wrangler deploy

# View deployment logs
npx wrangler tail

# List deployments
npx wrangler deployments list
```

### Git Commands
```bash
# View recent commits
git log --oneline -10

# Check status
git status

# Push to GitHub
git push origin main
```

---

## Troubleshooting

### Common Issues

**Build Fails**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify imports are correct
- Check for undefined variables

**Deployment Fails**
- Verify wrangler.toml configuration
- Check authentication: `npx wrangler whoami`
- Ensure no syntax errors

**Database Errors**
- Verify table exists: `npx wrangler d1 execute gcrl-documents --command=".schema"`
- Check SQL syntax
- Verify parameterized queries

**Email Not Sending**
- Verify RESEND_API_KEY is set
- Check email address format
- Verify Resend API status

---

## Future Enhancements

### Short Term (Next Session)
1. User CRUD system
2. Role-based permissions
3. Enhanced admin panel

### Medium Term
1. Enhanced security headers
2. Audit logging
3. Performance monitoring
4. Automated testing

### Long Term
1. Multi-language support
2. Advanced search functionality
3. Member directory
4. Integration with Grand Lodge systems
