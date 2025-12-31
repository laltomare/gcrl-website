# Golden Compasses Research Lodge Website

A modern, secure website built with Cloudflare Workers, D1 database, and R2 storage.

## Features

- **Public Pages**: Home, About, Library (view-only), Links, Contact, Join
- **Two-Tier Library Access**: Public viewing, member-only downloads
- **Admin Dashboard**: Document management, membership request tracking
- **Security Hardened**: Rate limiting, input sanitization, security headers
- **Responsive Design**: Mobile-friendly with clean navigation that wraps naturally

## Tech Stack

- **Runtime**: Cloudflare Workers (serverless)
- **Language**: TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (object storage for PDFs)
- **Security**: Enterprise-grade on free tier

## Setup Instructions

### Prerequisites

- Node.js v24
- npm
- Wrangler CLI
- GitHub CLI

### 1. Create D1 Database

```bash
npm run d1:create
```

This will output a database ID. Update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "gcrl-documents"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

### 2. Initialize Database Tables

```bash
npm run d1:execute
```

### 3. Create R2 Bucket

```bash
wrangler r2 bucket create gcrl-documents
```

### 4. Upload Assets to R2

```bash
# Upload CSS
wrangler r2 object put gcrl-documents/styles.css --file=src/styles.css

# Upload images
wrangler r2 object put gcrl-documents/logo.png --file=public/logo.png
wrangler r2 object put gcrl-documents/hero.jpg --file=public/hero.jpg
wrangler r2 object put gcrl-documents/background.jpg --file=public/background.jpg
```

### 5. Set Environment Secrets

```bash
# Set admin password (minimum 14 characters, mixed case, numbers, symbols)
wrangler secret put ADMIN_PASSWORD
# Example: Golden$Compass2024

# Set library password (different from admin)
wrangler secret put LIBRARY_PASSWORD
# Example: NorthStar7!Research
```

**Password Requirements:**
- Minimum 14 characters
- At least 3 of: uppercase, lowercase, numbers, symbols
- Avoid common words

**Example Passwords:**
- `Golden$Compass2024` (18 chars)
- `NorthStar7!Research` (18 chars)
- `Lodge#Square7` (14 chars)

### 6. Deploy to Cloudflare Workers

```bash
npm run deploy
```

### 7. Configure DNS

1. Go to Cloudflare Dashboard → DNS
2. Add A record: `goldencompasses.org` → Your Workers domain
3. Set proxy status: **Proxied** (orange cloud) ✅
4. Add CNAME: `www` → `goldencompasses.org` (proxied)

### 8. Configure Cloudflare Security

**Settings → Security**:

```
Security Level: Medium
Bot Fight Mode: ON
WAF: Enable "WordPress Attacks" and "SQL Injection" rule sets
```

## Usage

### Admin Access

1. Go to `https://your-domain.com/admin/login`
2. Enter your admin password
3. Access the dashboard to:
   - Upload documents (PDFs)
   - Delete documents
   - View membership requests

### Member Access to Library

Members can download documents by including the library password in the Authorization header:

```javascript
fetch('/download/DOCUMENT_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_LIBRARY_PASSWORD'
  }
})
```

Or provide members with a simple download page where they enter the password.

## Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`

## Project Structure

```
gcrl-website/
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # TypeScript interfaces
│   ├── lib/
│   │   ├── auth.ts       # Authentication & security
│   │   ├── sanitize.ts   # Input sanitization
│   │   ├── headers.ts    # Security headers & CORS
│   │   └── pages.ts      # HTML page generators
│   └── styles.css        # Site styles
├── public/               # Static assets
├── schema.sql            # Database schema
├── wrangler.toml         # Cloudflare configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Node dependencies
```

## Security Features

✅ **Rate Limiting**: 5 attempts per 15 minutes (login), 10 per hour (downloads)  
✅ **Input Sanitization**: All user inputs escaped and validated  
✅ **Security Headers**: X-Frame-Options, CSP, HSTS enabled  
✅ **CORS Protection**: Only allows requests from goldencompasses.org  
✅ **Strong Passwords**: 14-char minimum with complexity requirements  
✅ **Security Logging**: All auth attempts logged to D1  

## Monitoring

### View Security Logs

```bash
wrangler d1 execute gcrl-documents --command "SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 50"
```

### View Membership Requests

```bash
wrangler d1 execute gcrl-documents --command "SELECT * FROM membership_requests ORDER BY submitted_date DESC"
```

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

### Emergency Procedures

If you suspect a breach:

1. **Change passwords immediately**
   ```bash
   wrangler secret put ADMIN_PASSWORD
   wrangler secret put LIBRARY_PASSWORD
   ```

2. **Enable "Under Attack Mode"** in Cloudflare

3. **Review security logs**
   ```bash
   wrangler d1 execute gcrl-documents --command "SELECT * FROM security_logs WHERE event LIKE '%FAILED%' ORDER BY timestamp DESC"
   ```

4. **Block attacker IPs** in Cloudflare WAF

## Support

For issues or questions, contact the lodge secretary at info@goldencompasses.org

## License

Copyright © 2025 Golden Compasses Research Lodge. All rights reserved.
