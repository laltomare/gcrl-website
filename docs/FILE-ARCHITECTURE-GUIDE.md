# Golden Compasses Research Lodge
## File Architecture Guide
**For Print Reference**

**Version:** v19  
**Date:** December 31, 2025  
**Project:** Golden Compasses Research Lodge Website

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Main Entry Point: src/index.ts](#main-entry-point-srcindexts)
3. [HTML Generation: src/lib/pages.ts](#html-generation-srclibpagests)
4. [Security: src/lib/auth.ts](#security-srclibauthts)
5. [Security Headers: src/lib/headers.ts](#security-headers-srclibheadersts)
6. [Input Cleaning: src/lib/sanitize.ts](#input-cleaning-srclibsanitizets)
7. [Styling: src/styles.css](#styling-srcstylescss)
8. [Data Storage](#data-storage)
9. [How It All Works Together](#how-it-all-works-together)
10. [Quick Reference Summary](#quick-reference-summary)

---

## The Big Picture

### How Your Website Works

When someone visits your website, here's what happens:

```
STEP 1: User types URL (e.g., goldencompasses.org/about)
                    ↓
STEP 2: Request goes to Cloudflare (their servers worldwide)
                    ↓
STEP 3: Cloudflare runs your code (src/index.ts)
                    ↓
STEP 4: Your code decides what to do:
         - Show a webpage? → Generate HTML
         - Submit a form? → Process data
         - Download file? → Fetch from storage
                    ↓
STEP 5: Send response back to user's browser
```

### The File Structure

```
gcrl-website/
├── src/
│   ├── index.ts              ← MAIN ENTRY POINT (Traffic Cop)
│   ├── lib/
│   │   ├── pages.ts          ← HTML Generator (Factory)
│   │   ├── auth.ts           ← Security Guard (Bouncer)
│   │   ├── headers.ts        ← Security Wrapper
│   │   └── sanitize.ts       ← Input Cleaner (Janitor)
│   └── styles.css            ← Visual Designer (Artist)
├── public/
│   ├── manifest.json         ← PWA settings (deferred)
│   └── sw.js                 ← Service Worker (deferred)
└── schema.sql                ← Database structure
```

---

## Main Entry Point: src/index.ts

### What It Does

**Think of this file as the Traffic Cop.**

Every single request to your website goes through this file first. It decides where to send the request.

### Key Responsibilities

1. **Route Requests** - Decide what to do with each URL
2. **Serve Static Files** - CSS, images, logos
3. **Handle Forms** - Contact form, membership requests
4. **Protect Admin Pages** - Check passwords for /admin pages
5. **Apply Security** - Rate limiting, sanitization

### How It Works (Simplified)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Serve CSS stylesheet
    if (path === '/styles.css') {
      return fetchFromR2Storage('styles.css');
    }

    // 2. Serve images (logo, hero, background)
    if (path === '/logo.png' || path === '/hero.jpg') {
      return fetchFromR2Storage(path);
    }

    // 3. Handle API routes (form submissions)
    if (path === '/api/contact') {
      return processContactForm(request, env);
    }

    // 4. Handle admin routes (password protected)
    if (path.startsWith('/admin')) {
      return handleAdminPage(request, env);
    }

    // 5. Handle public pages
    if (path === '/about') {
      return generateHTML(AboutPage());
    }
    
    // ... and so on for each page
  }
};
```

### What Gets Routed Where

| URL Pattern | What Happens | Which File Handles It |
|-------------|--------------|----------------------|
| `/styles.css` | Fetch CSS from storage | R2 Storage |
| `/logo.png`, `/hero.jpg` | Fetch images from storage | R2 Storage |
| `/api/contact` | Process contact form | index.ts → D1 Database |
| `/api/join` | Process membership request | index.ts → D1 Database |
| `/admin` | Show admin login | pages.ts → AdminLoginPage() |
| `/admin/dashboard` | Show admin dashboard | pages.ts (password protected) |
| `/about` | Show About page | pages.ts → AboutPage() |
| `/library` | Show Library page | pages.ts → LibraryPage() |
| `/contact` | Show Contact page | pages.ts → ContactPage() |

### Key Point

**ALL traffic goes through index.ts first.** It's the main entrance to your website.

---

## HTML Generation: src/lib/pages.ts

### What It Does

**Think of this file as a Factory that manufactures web pages.**

Each function in this file returns a complete HTML page as a text string.

### Key Responsibilities

1. **Generate All Pages** - Home, About, Library, Links, Contact, Join
2. **Admin Pages** - Login, Dashboard, 2FA setup
3. **Consistent Layout** - Navigation bar, footer, styling
4. **Active Navigation** - Highlight current page in menu

### How It Works

```typescript
// Example: About Page
export function AboutPage(): string {
  return BasePage(
    'About',           // Page title
    `                  // Page content
      <section class="page-header">
        <h1>About Us</h1>
      </section>
      <p>We are a research lodge...</p>
    `,
    'about'            // Which menu item to highlight
  );
}

// The shared layout wrapper
export function BasePage(title: string, content: string, currentPage: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <nav>
        <ul class="nav-menu">
          <li class="${currentPage === 'home' ? 'active' : ''}">
            <a href="/">Home</a>
          </li>
          <li class="${currentPage === 'about' ? 'active' : ''}">
            <a href="/about">About</a>
          </li>
          <li class="${currentPage === 'library' ? 'active' : ''}">
            <a href="/library">Library</a>
          </li>
          <!-- ... etc ... -->
        </ul>
      </nav>
      <main>
        ${content}
      </main>
      <footer>
        © 2025 Golden Compasses Research Lodge
      </footer>
    </body>
    </html>
  `;
}
```

### Page Functions Available

| Function | What It Generates | URL |
|----------|------------------|-----|
| `HomePage()` | Homepage with hero section | `/` |
| `AboutPage()` | About the lodge | `/about` |
| `LibraryPage()` | Document library | `/library` |
| `DocumentDetailPage()` | Single document view | `/library/:id` |
| `LinksPage()` | External links | `/links` |
| `ContactPage()` | Contact form | `/contact` |
| `JoinPage()` | Membership form | `/join` |
| `AdminLoginPage()` | Admin login | `/admin` |
| `TwoFactorPage()` | 2FA verification | `/admin/2fa` |

### Key Point

**This file contains NO logic** - it only generates HTML. All the security and data processing happens in index.ts BEFORE calling these functions.

---

## Security: src/lib/auth.ts

### What It Does

**Think of this file as a Bouncer at a club.**

It checks credentials, enforces rules, and keeps troublemakers out.

### Key Responsibilities

1. **Verify Passwords** - Check if admin/library passwords are correct
2. **Rate Limiting** - Block too many attempts from same IP
3. **Security Logging** - Record all security events
4. **IP Tracking** - Know who is requesting what

### How It Works

```typescript
// Check if a password is correct
export function verifyToken(
  token: string,           // The password provided
  env: Env,                // Environment variables (has correct passwords)
  requireAdmin: boolean    // Whether admin access is required
): { valid: boolean; message?: string } {
  
  if (requireAdmin) {
    // Admin access requires ADMIN_PASSWORD
    if (token === env.ADMIN_PASSWORD) {
      return { valid: true };
    }
    return { valid: false, message: 'Incorrect admin password' };
  }
  
  // Library access accepts either password
  if (token === env.LIBRARY_PASSWORD || token === env.ADMIN_PASSWORD) {
    return { valid: true };
  }
  
  return { valid: false, message: 'Incorrect password' };
}

// Prevent too many login attempts
export function checkRateLimit(
  ip: string,              // User's IP address
  maxAttempts: number,     // Max attempts allowed (usually 5)
  windowMs: number         // Time window (usually 15 minutes)
): boolean {
  // Check database for previous attempts from this IP
  // If too many attempts → return false (blocked)
  // If under limit → return true (allowed)
  return true; // or false
}

// Log security events
export function logSecurityEvent(
  env: Env,
  event: string,           // What happened (e.g., "LOGIN_SUCCESS")
  ip: string,              // Who did it
  details: string          // Additional info
): void {
  // Save to database for audit trail
}
```

### Security Features

| Feature | Purpose | Setting |
|---------|---------|---------|
| Password Validation | Ensure strong passwords | 14+ characters required |
| Rate Limiting | Prevent brute force attacks | 5 attempts per 15 minutes |
| IP Logging | Track who accesses what | All requests logged |
| Session Tracking | Know who is logged in | Stored in database |

### Key Point

**This file is your first line of defense.** Every admin request and form submission goes through these security checks.

---

## Security Headers: src/lib/headers.ts

### What It Does

**Think of this file as putting security wrapping on every response.**

It adds HTTP headers that protect users from various attacks.

### Key Responsibilities

1. **Add Security Headers** - CSP, HSTS, X-Frame-Options, etc.
2. **Handle CORS** - Control which domains can access your API
3. **Wrap All Responses** - Ensure nothing escapes without protection

### How It Works

```typescript
export function addSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  // Prevent clickjacking (your site in someone else's iframe)
  newHeaders.set('X-Frame-Options', 'DENY');
  
  // Prevent XSS attacks
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  
  // Force HTTPS connections
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000');
  
  // Content Security Policy (control what resources can load)
  newHeaders.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "img-src 'self' data:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-inline'"
  );
  
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
```

### What Each Header Does

| Header | What It Protects Against |
|--------|-------------------------|
| `X-Frame-Options: DENY` | Clickjacking (your site in invisible frames) |
| `X-Content-Type-Options: nosniff` | MIME type sniffing attacks |
| `Strict-Transport-Security` | Man-in-the-middle attacks |
| `Content-Security-Policy` | XSS attacks, data injection |
| `Referrer-Policy` | Information leakage |

### Key Point

**Every single response** from your website gets these headers added automatically. It's automatic protection.

---

## Input Cleaning: src/lib/sanitize.ts

### What It Does

**Think of this file as a Janitor that cleans up messes.**

It takes user input and makes it safe before using it.

### Key Responsibilities

1. **Escape HTML** - Convert dangerous characters to safe ones
2. **Sanitize Input** - Remove malicious content
3. **Validate Filenames** - Prevent path traversal attacks
4. **Length Limits** - Prevent denial-of-service attacks

### How It Works

```typescript
// Convert dangerous HTML characters to safe ones
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")      // & becomes &amp;
    .replace(/</g, "&lt;")        // < becomes &lt;
    .replace(/>/g, "&gt;")        // > becomes &gt;
    .replace(/"/g, "&quot;")      // " becomes &quot;
    .replace(/'/g, "&#039;");     // ' becomes &#039;
}

// Clean user input before using it
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  let cleaned = input;
  
  // Remove null bytes (can cause issues)
  cleaned = cleaned.replace(/\0/g, '');
  
  // Limit length (prevent DoS)
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  // Escape HTML
  cleaned = escapeHtml(cleaned);
  
  return cleaned.trim();
}

// Make sure filenames are safe
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts (../../)
  filename = filename.replace(/\.\./g, '');
  
  // Only allow safe characters
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return filename;
}
```

### What It Prevents

| Attack Type | Example | How It's Prevented |
|-------------|---------|-------------------|
| XSS (Cross-Site Scripting) | `<script>alert('hack')</script>` | Escaped to `&lt;script&gt;` |
| SQL Injection | `'; DROP TABLE users; --` | Special chars escaped |
| Path Traversal | `../../../../etc/passwd` | `..` removed, limited to safe chars |
| DoS (Denial of Service) | 10MB text field | Limited to 1000 characters |

### Key Point

**ALL user input** (forms, URL parameters, cookies) must be sanitized before use. This file makes that easy.

---

## Styling: src/styles.css

### What It Does

**Think of this file as the Interior Designer.**

It makes your website look good and work on all devices.

### Key Responsibilities

1. **Color Scheme** - Navy green, gold, cream colors
2. **Typography** - Fonts (Cinzel for headings, Lato for body)
3. **Layout** - Spacing, positioning, responsive design
4. **Mobile Design** - Works on phones, tablets, desktops

### How It Works

```css
/* CSS Variables (your color palette) */
:root {
  --color-primary: #42514c;      /* Dark green (navy) */
  --color-secondary: #C2A43B;    /* Gold */
  --color-cream: #F5F5DC;        /* Cream background */
  --color-text: #333333;         /* Dark gray text */
  --spacing-sm: 0.5rem;          /* 8 pixels */
  --spacing-md: 1rem;            /* 16 pixels */
  --spacing-lg: 2rem;            /* 32 pixels */
}

/* Navigation Layout */
.nav-container {
  display: flex;                 /* Horizontal layout */
  justify-content: space-between; /* Logo left, menu right */
  align-items: center;           /* Vertically centered */
  padding: var(--spacing-md);
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 1.8rem;           /* Smaller on mobile */
  }
  
  .nav-container {
    flex-direction: column;      /* Stack vertically on mobile */
  }
}
```

### Key CSS Sections

| Section | Purpose |
|---------|---------|
| `:root` | CSS variables (colors, spacing) |
| `body` | Global styles, fonts |
| `.nav-container` | Navigation bar layout |
| `.hero-section` | Top banner with background image |
| `.page-header` | Page title section |
| `.grid-layout` | Multi-column layouts |
| `@media` queries | Mobile responsive design |

### Important Fix (v19)

```css
/* This fixes the "period" artifact in Chrome */
.nav-menu li::marker {
  content: none !important;
}
```

**Why this matters:** Browsers add list bullets (•) by default. This explicitly removes them.

---

## Data Storage

### Cloudflare D1 (Database)

**Think of this as a filing cabinet for structured data.**

| Table | What It Stores |
|-------|---------------|
| `documents` | PDF files, titles, descriptions |
| `membership_requests` | Contact form submissions |
| `security_logs` | Login attempts, suspicious activity |
| `admin_2fa` | Two-factor authentication secrets |

### Cloudflare R2 (Object Storage)

**Think of this as a warehouse for files.**

| What's Stored | Example Files |
|---------------|---------------|
| PDFs | Research papers, lodge documents |
| Images | Logo, hero background, member photos |
| CSS | `styles.css` (the stylesheet) |
| PWA files | `manifest.json`, `sw.js` (deferred) |

### Why Two Storage Systems?

| D1 Database | R2 Storage |
|-------------|------------|
| Structured data (tables, rows) | Files (PDFs, images) |
| Fast searches | Large file storage |
| Relationships between data | Serve files to users |
| Examples: user info, metadata | Examples: PDFs, images |

---

## How It All Works Together

### Example 1: User Visits About Page

```
1. User browser: GET /about
                    ↓
2. Cloudflare: Routes to your Worker
                    ↓
3. src/index.ts: Sees path === '/about'
                    ↓
4. src/index.ts: Calls AboutPage() from pages.ts
                    ↓
5. src/lib/pages.ts: Returns HTML string
                    ↓
6. src/index.ts: Wraps with addSecurityHeaders()
                    ↓
7. User browser: Receives HTML and displays page
```

### Example 2: User Submits Contact Form

```
1. User fills form and clicks Submit
                    ↓
2. Browser: POST /api/contact with form data
                    ↓
3. src/index.ts: Sees path === '/api/contact'
                    ↓
4. src/index.ts: Calls sanitizeInput() on all fields
                    ↓
5. src/index.ts: Calls checkRateLimit() for IP address
                    ↓
6. src/index.ts: Saves to D1 database
                    ↓
7. src/index.ts: Calls logSecurityEvent()
                    ↓
8. src/index.ts: Returns success response
                    ↓
9. User sees: "Thank you for your message"
```

### Example 3: User Downloads PDF from Library

```
1. User clicks "Download PDF" button
                    ↓
2. Browser: GET /api/download/document-id-123
                    ↓
3. src/index.ts: Sees path starts with '/api/download'
                    ↓
4. src/index.ts: Checks if user has library password
                    ↓
5. src/lib/auth.ts: verifyToken() checks password
                    ↓
6. If valid: Fetch PDF from R2 storage
                    ↓
7. src/index.ts: Return PDF file with headers
                    ↓
8. Browser: Downloads file to user's computer
```

---

## Quick Reference Summary

### File Cheat Sheet

| File | Role | Analogy |
|------|------|---------|
| `src/index.ts` | Main entry point | Traffic Cop |
| `src/lib/pages.ts` | HTML generator | Factory |
| `src/lib/auth.ts` | Security check | Bouncer |
| `src/lib/headers.ts` | Security headers | Security wrapper |
| `src/lib/sanitize.ts` | Input cleaning | Janitor |
| `src/styles.css` | Visual design | Interior designer |

### Request Flow

```
User Request → index.ts (decides what to do)
                    ↓
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
Static Files   Public Pages   API Routes
(R2 storage)  (pages.ts)     (database)
    │               │               │
    ▼               ▼               ▼
Return file    Generate HTML   Process data
with headers   and return      and return
```

### Security Layers

1. **Rate Limiting** - Block too many attempts
2. **Input Sanitization** - Clean all user input
3. **Password Verification** - Check credentials
4. **Security Headers** - Protect responses
5. **Audit Logging** - Record security events

### Common Tasks

| Task | Which File | Function |
|------|------------|----------|
| Add a new page | `src/lib/pages.ts` | Create `NewPage()` function |
| Change route for page | `src/index.ts` | Add new `if (path === '/new')` |
| Change colors | `src/styles.css` | Modify `:root` variables |
| Add security rule | `src/lib/auth.ts` | Add new check function |
| Change security headers | `src/lib/headers.ts` | Modify `addSecurityHeaders()` |

---

## Print-Friendly Notes

### Key Takeaways

1. **All traffic goes through `src/index.ts` first** - This is your main entry point
2. **`src/lib/pages.ts` only generates HTML** - No logic, just page content
3. **Security happens before anything else** - Rate limiting, sanitization, passwords
4. **`src/styles.css` controls appearance** - Colors, fonts, responsive design
5. **D1 is for data, R2 is for files** - Two different storage systems

### When Something Breaks

| Symptom | Where to Look |
|---------|---------------|
| Page not loading | `src/index.ts` routing |
| Page looks wrong | `src/styles.css` |
| Form not submitting | `src/index.ts` API routes |
| Can't log in | `src/lib/auth.ts` |
| Security error | `src/lib/headers.ts` or `src/lib/auth.ts` |
| Weird text appearing | `src/lib/sanitize.ts` (or lack of it) |

### Best Practices

1. **Always sanitize user input** - Never trust data from forms
2. **Use security headers** - Every response should have them
3. **Rate limit sensitive operations** - Prevent abuse
4. **Log security events** - Audit trail is important
5. **Keep it simple** - Complex code is harder to maintain

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**For:** Golden Compasses Research Lodge Website  
**Project URL:** https://goldencompasses.org

---

*This document is a companion to ARCHITECTURE.md and CONTRIBUTING.md. Please refer to those documents for more detailed technical information.*
