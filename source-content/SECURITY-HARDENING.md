# 🔒 Security Hardening Guide for Golden Compasses Website

**Date:** December 28, 2025  
**Status:** ⚠️ **CRITICAL** - Previous site was compromised with SEO spam  
**Budget:** Free tier only (24 members, minimal funding)  
**Threat Level:** HIGH - Expect attacks when switching to existing domain

---

## 🚨 Security Context

The current **goldencompasses.org** site is **compromised** with gambling SEO spam. When you deploy the new Cloudflare Workers site to this domain, **expect immediate attacks** from:

1. **Same attacker group** trying to regain control
2. **Automated bots** probing for vulnerabilities
3. **Brute force attacks** on admin endpoints
4. **SQL injection** attempts on API endpoints
5. **Cross-site scripting** (XSS) in form inputs

## 🛡️ Security Strategy: Defense in Depth

Since we're limited to **Cloudflare Workers Free Tier**, we'll use **multiple overlapping security layers**:

| Layer | Protection | Free Tier Compatible |
|-------|-----------|---------------------|
| **Cloudflare** | DDoS protection, WAF, rate limiting | ✅ Yes (built-in) |
| **Workers** | Isolated execution environment | ✅ Yes (sandbox) |
| **Authentication** | Strong password hashing, rate limiting | ✅ Yes (implement) |
| **Input Validation** | Sanitize all inputs | ✅ Yes (implement) |
| **CORS** | Restrict cross-origin requests | ✅ Yes (implement) |
| **Headers** | Security headers | ✅ Yes (implement) |
| **Monitoring** | Track suspicious activity | ✅ Yes (implement) |

---

## 1️⃣ Cloudflare Security (FREE - Already Included)

### Enable These Cloudflare Features

**Settings → Security**

```yaml
Security Level: Medium
- Blocks known attack IPs
- Rate limiting enabled
- Challenge for suspicious traffic

Bot Fight Mode: ON (Free)
- Automatically challenges bots
- Reduces automated attacks

WAF (Web Application Firewall): Use FREE rules
- Enable "WordPress Attacks" rule set
- Enable "SQL Injection" rule set
- Block known malicious user agents

Page Rule: Cache All Static Content
- Improves performance
- Reduces load on Workers
```

### DNS Configuration

```yaml
A Record: goldencompasses.org → [Your Workers Domain]
- Proxy status: PROXIED (orange cloud) ✅
- This enables Cloudflare security
- NEVER use DNS-only (gray cloud)

CNAME: www → goldencompasses.org
- Proxy status: PROXIED (orange cloud) ✅
```

---

## 2️⃣ Environment Variables (NEVER Commit to Git)

### wrangler.toml Configuration

```toml
name = "gcrl-website"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "gcrl-documents"
database_id = "YOUR_D1_DATABASE_ID"

# R2 Storage
[[r2_buckets]]
binding = "R2"
bucket_name = "gcrl-documents"

# ⚠️ NEVER commit these to git!
# Use: wrangler secret put ADMIN_PASSWORD
[vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://goldencompasses.org,https://www.goldencompasses.org"
```

### Setting Secrets (Command Line)

```bash
# Set strong passwords (14+ characters, mixed case, numbers, symbols)
wrangler secret put ADMIN_PASSWORD
# Enter: Golden$Compass2024 (14+ chars, mixed types)

wrangler secret put LIBRARY_PASSWORD
# Enter: Different$Secure2024! (14+ chars, different from admin)

# NEVER share these or commit to git
```

## 3️⃣ Hardened Authentication System

### Password Requirements

```typescript
// src/lib/auth.ts

// Updated: 14-character minimum for usability
// Balances security with usability for 24 members (many without password managers)
const MIN_PASSWORD_LENGTH = 14;

// Lodge-themed password suggestions for members
const PASSWORD_SUGGESTIONS = [
  "Golden$Compass2024",  // 18 chars - lodge-themed
  "NorthStar7!Research", // 18 chars - Masonic-themed
  "Lodge#Square7",       // 14 chars - minimal but strong
  "CarpenterLevel2025!", // 18 chars - tool-themed
  "Square7!Compass",     // 15 chars - working tools
  "Ashlar9!Stone",       // 14 chars - Masonic reference
];

// Validate password strength
function validatePassword(password: string): {valid: boolean, reason?: string} {
  // Must be at least 14 characters
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { 
      valid: false, 
      reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` 
    };
  }
  
  // Must contain at least 3 of 4 character types
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  
  const typeCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  
  if (typeCount < 3) {
    return { 
      valid: false, 
      reason: 'Password must include at least 3 of: uppercase, lowercase, numbers, symbols' 
    };
  }
  
  // Check for common passwords (basic check)
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'compass', 'masonic', 'lodge'];
  const lowerPassword = password.toLowerCase();
  if (commonPasswords.some(common => lowerPassword.includes(common))) {
    return { 
      valid: false, 
      reason: 'Password contains common words - make it more unique' 
    };
  }
  
  return { valid: true };
}

// Password strength meter for user feedback
function getPasswordStrength(password: string): {score: number, label: string, color: string} {
  if (password.length < 8) return { score: 1, label: 'Very Weak', color: '#dc3545' };
  if (password.length < 12) return { score: 2, label: 'Weak', color: '#ffc107' };
  if (password.length < 14) return { score: 3, label: 'Fair', color: '#fd7e14' };
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const typeCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  
  if (typeCount < 3) return { score: 3, label: 'Fair', color: '#fd7e14' };
  if (typeCount === 3) return { score: 4, label: 'Strong', color: '#20c997' };
  if (typeCount === 4 && password.length >= 16) return { score: 5, label: 'Very Strong', color: '#28a745' };
  
  return { score: 4, label: 'Strong', color: '#20c997' };
}

// Generate random secure password (for admin setup)
function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Rate limiting by IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false; // Rate limited
  }
  
  record.count++;
  return true;
}

// Extract IP from request (handle Cloudflare headers)
function getClientIP(request: Request): string {
  // Cloudflare adds this header
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}
```

### Secure Authentication Middleware

```typescript
// src/lib/middleware.ts

import { Env } from './types';

export interface AuthContext {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  error?: string;
}

export async function authenticateRequest(
  request: Request, 
  env: Env,
  requireAdmin: boolean = false
): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization');
  const clientIP = getClientIP(request);
  
  // Check rate limiting
  if (!checkRateLimit(clientIP)) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isMember: false,
      error: 'Too many attempts. Please try again later.'
    };
  }
  
  // No auth header provided
  if (!authHeader) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isMember: false,
      error: 'Authorization required'
    };
  }
  
  // Validate Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isMember: false,
      error: 'Invalid authorization format'
    };
  }
  
  const token = authHeader.substring(7); // Remove "Bearer "
  
  // Check admin password
  if (requireAdmin) {
    if (token === env.ADMIN_PASSWORD) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        isMember: true
      };
    }
    
    // Log failed admin attempt
    console.error(`Failed admin attempt from ${clientIP}`);
    
    return {
      isAuthenticated: false,
      isAdmin: false,
      isMember: false,
      error: 'Invalid credentials'
    };
  }
  
  // Check member password
  if (token === env.LIBRARY_PASSWORD || token === env.ADMIN_PASSWORD) {
    return {
      isAuthenticated: true,
      isAdmin: token === env.ADMIN_PASSWORD,
      isMember: true
    };
  }
  
  return {
    isAuthenticated: false,
    isAdmin: false,
    isMember: false,
    error: 'Membership required'
  };
}
```

---

## 4️⃣ Input Sanitization (Prevent XSS & SQL Injection)

### HTML Sanitization

```typescript
// src/lib/sanitize.ts

// Escape HTML to prevent XSS
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes
  let cleaned = input.replace(/\0/g, '');
  
  // Limit length (prevent DoS)
  if (cleaned.length > 10000) {
    cleaned = cleaned.substring(0, 10000);
  }
  
  // Escape HTML
  cleaned = escapeHtml(cleaned);
  
  return cleaned.trim();
}

// Validate filename (prevent path traversal)
export function sanitizeFilename(filename: string): string {
  // Remove directory separators
  const cleaned = filename.replace(/[\/\\]/g, '');
  
  // Only allow safe characters
  const safeFilename = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return safeFilename;
}

// Validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### SQL Injection Prevention (D1)

```typescript
// src/lib/db.ts

// Always use parameterized queries!
export async function safeGetDocument(env: Env, id: string) {
  // ✅ SAFE - Parameterized query
  const doc = await env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(id).first();
  
  return doc;
}

// ❌ NEVER DO THIS - SQL injection vulnerability
export async function unsafeGetDocument(env: Env, id: string) {
  // DON'T DO THIS!
  const query = `SELECT * FROM documents WHERE id = '${id}'`;
  const doc = await env.DB.prepare(query).first();
  return doc;
}

// Input validation before query
export async function getDocumentById(env: Env, id: string) {
  // Validate UUID format first
  if (!isValidUUID(id)) {
    return null;
  }
  
  // Then use parameterized query
  return await safeGetDocument(env, id);
}
```

---

## 5️⃣ Security Headers (Every Response)

```typescript
// src/lib/headers.ts

export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filter (browser-side)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy (basic)
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
  
  // HTTP Strict Transport Security (if using HTTPS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Add security headers to all responses
export function addSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
```

---

## 6️⃣ CORS Configuration (Restrict API Access)

```typescript
// src/lib/cors.ts

const ALLOWED_ORIGINS = [
  'https://goldencompasses.org',
  'https://www.goldencompasses.org',
];

export function handleCors(request: Request): Response | null {
  const origin = request.headers.get('Origin');
  
  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed
  );
  
  if (!isAllowed && origin !== null) {
    return new Response('Origin not allowed', { status: 403 });
  }
  
  return null; // Continue processing
}
```

---

## 7️⃣ Rate Limiting (Prevent Brute Force)

```typescript
// Using Cloudflare KV (Free tier: 100k reads/day, 1k writes/day)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export async function checkRateLimitWithKV(
  env: Env,
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  
  // Get current rate limit state
  const entry = await env.RATE_LIMIT.get<RateLimitEntry>(key, 'json');
  
  if (!entry || now > entry.resetTime) {
    // First request or window expired
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    };
    
    await env.RATE_LIMIT.put(key, JSON.stringify(newEntry), {
      expirationTtl: Math.ceil(windowMs / 1000)
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment counter
  entry.count++;
  await env.RATE_LIMIT.put(key, JSON.stringify(entry), {
    expirationTtl: Math.ceil((entry.resetTime - now) / 1000)
  });
  
  return { allowed: true, remaining: limit - entry.count };
}
```

### Update wrangler.toml for KV

```toml
# Add KV namespace for rate limiting
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "YOUR_KV_ID"
```

---

## 8️⃣ Admin Dashboard Hardening

### Secure Admin Login Page

```typescript
// src/routes/admin-login.ts

export async function adminLoginPage(): Promise<Response> {
  return HTML`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Login - GCRL</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #42514c;
      margin: 0;
    }
    .login-box {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
    }
    h1 { color: #C2A43B; margin-top: 0; }
    input {
      width: 100%;
      padding: 0.75rem;
      margin: 0.5rem 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #42514c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    }
    button:hover { background: #2a3530; }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .captcha-hint {
      font-size: 0.85rem;
      color: #666;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>🔐 Admin Login</h1>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> This login is protected by Cloudflare security.
      Multiple failed attempts will be blocked.
    </div>
    <form id="loginForm">
      <label for="password">Admin Password</label>
      <input 
        type="password" 
        id="password" 
        name="password" 
        required 
        placeholder="Enter your admin password"
        autocomplete="current-password"
        minlength="20"
      >
      <button type="submit">Login</button>
    </form>
    <p class="captcha-hint">
      ℹ️ Cloudflare may challenge you with a CAPTCHA if suspicious activity is detected.
    </p>
  </div>
  <script>
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      
      if (password.length < 20) {
        alert('Password must be at least 20 characters');
        return;
      }
      
      try {
        const response = await fetch('/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password })
        });
        
        if (response.ok) {
          const { token } = await response.json();
          localStorage.setItem('adminToken', token);
          window.location.href = '/admin';
        } else {
          const { error } = await response.json();
          alert('Login failed: ' + error);
        }
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  </script>
</body>
</html>`;
}
```

---

## 9️⃣ Security Monitoring (Free Tier)

### Log Security Events

```typescript
// src/lib/monitoring.ts

interface SecurityEvent {
  timestamp: string;
  ip: string;
  event: string;
  details: string;
}

export async function logSecurityEvent(
  env: Env,
  event: string,
  request: Request,
  details: string = ''
) {
  const securityEvent: SecurityEvent = {
    timestamp: new Date().toISOString(),
    ip: getClientIP(request),
    event,
    details
  };
  
  // Log to console (Cloudflare Logs)
  console.warn(`SECURITY: ${JSON.stringify(securityEvent)}`);
  
  // Optional: Store in D1 for analysis
  try {
    await env.DB.prepare(
      'INSERT INTO security_logs (timestamp, ip, event, details) VALUES (?, ?, ?, ?)'
    ).bind(
      securityEvent.timestamp,
      securityEvent.ip,
      securityEvent.event,
      securityEvent.details
    ).run();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Create security logs table
export const SECURITY_LOGS_SCHEMA = `
CREATE TABLE IF NOT EXISTS security_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  ip TEXT NOT NULL,
  event TEXT NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event);
`;
```

---

## 🔟 Deployment Security Checklist

### Before Deploying to Production

- [ ] **Change all default passwords** - Use strong passphrases (14+ chars, mixed types)
- [ ] **Share password requirements with members** - Provide examples and guidance
- [ ] **Enable Cloudflare proxy** - Orange cloud for all DNS records
- [ ] **Set up WAF rules** - Enable free WordPress and SQLi rules
- [ ] **Configure security headers** - Add to all responses
- [ ] **Test rate limiting** - Verify it blocks brute force
- [ ] **Enable Bot Fight Mode** - Free tier includes this
- [ ] **Set up alerts** - Cloudflare sends email on attacks
- [ ] **Test from VPN/Tor** - Verify security blocks suspicious traffic
- [ ] **Review Cloudflare analytics** - Check for attack patterns
- [ ] **Document credentials securely** - Use password manager
- [ ] **Create backup plan** - Know how to restore D1/R2 data
- [ ] **Test rollback** - Verify you can revert if compromised

### Monitoring After Deployment

**Daily Checks (First Week)**
- Review Cloudflare Security Events
- Check D1 security_logs table
- Monitor Worker error logs
- Verify rate limiting is working

**Weekly Checks (Ongoing)**
- Review security logs for patterns
- Check for new IPs attempting admin access
- Verify no suspicious documents uploaded
- Test authentication still works

**Monthly Checks**
- Rotate passwords (optional, but recommended)
- Review Cloudflare WAF rules
- Update dependencies
- Audit admin access logs

---

## 🚨 Incident Response Plan

### If You Suspect a Breach

1. **Immediate Actions (Minutes)**
   - Check Cloudflare Security Events dashboard
   - Look for unusual traffic spikes
   - Review recent admin login attempts
   - Check security_logs table for suspicious events

2. **Containment (Minutes-Hours)**
   - Change all passwords immediately
   - Enable "Under Attack Mode" in Cloudflare
   - Add WAF rules to block attacker IPs
   - Consider temporarily disabling admin access

3. **Investigation (Hours-Days)**
   - Export all security logs
   - Review D1 database for suspicious changes
   - Check R2 for unauthorized uploads
   - Identify attack vectors

4. **Recovery (Days)**
   - Restore from backup if needed
   - Patch identified vulnerabilities
   - Update security rules
   - Document lessons learned

### Emergency Contacts

- **Cloudflare Support**: https://support.cloudflare.com/
- **Cloudflare Status**: https://www.cloudflarestatus.com/
- **Report Abuse**: abuse@cloudflare.com

---

## 📊 Free Tier Security Limits

| Feature | Free Tier Limit | Notes |
|---------|----------------|-------|
| Workers Requests | 100,000/day | Should be sufficient for 24 members |
| D1 Reads | 5,000,000/day | Far more than needed |
| D1 Writes | 100,000/day | Should be sufficient |
| R2 Storage | 10 GB | PDFs only, should be plenty |
| R2 Class A Operations | 1,000,000/day | Writes, sufficient |
| R2 Class B Operations | 10,000,000/day | Reads, plenty |
| KV Reads | 100,000/day | For rate limiting |
| KV Writes | 1,000/day | For rate limiting |
| KV Storage | 1 GB | Should be sufficient |
| WAF Rules | 5 custom rules | Use pre-made rule sets |

---

## 1️⃣1️⃣ Passkeys (WebAuthn) - Future Enhancement 🚧

### Status: NOT IMPLEMENTED (Can be added later)

**Passkeys provide passwordless authentication using FaceID, TouchID, or security keys.**

### Free Tier Compatibility

✅ **YES - Passkeys work on Cloudflare Workers Free Tier!**

- WebAuthn API is browser-based (no Cloudflare feature needed)
- D1 database can store passkey credentials (free)
- No additional cost ($0)

### Why Not Implemented Now?

| Factor | Consideration |
|--------|---------------|
 **Development Time** | ~500-800 lines of TypeScript (4-8 hours) |
 **Member Training** | Requires teaching 24 members how to use passkeys |
 **Device Support** | Not all members have devices with biometric auth |
 **Backup Required** | Members need multiple devices registered (recovery) |

### How Passkeys Would Work (Future Implementation)

```typescript
// src/lib/passkeys.ts (future implementation)

interface PasskeyCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

// Register a new passkey
async function registerPasskey(
  username: string, 
  challenge: string,
  env: Env
): Promise<{credentialId: string, status: string}> {
  // 1. Generate challenge (server-side)
  const credentialRequest = {
    challenge: base64urlEncode(challenge),
    rp: {
      name: 'Golden Compasses Research Lodge',
      id: 'goldencompasses.org'
    },
    user: {
      id: base64urlEncode(username),
      name: username,
      displayName: username
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred'
    },
    timeout: 60000
  };
  
  // 2. Store credential in D1 after registration
  await env.DB.prepare(
    'INSERT INTO passkeys (username, credential_id, public_key, counter) VALUES (?, ?, ?, ?)'
  ).bind(username, credentialId, publicKey, 0).run();
  
  return { credentialId, status: 'registered' };
}

// Authenticate with passkey
async function authenticateWithPasskey(
  username: string,
  credentialResponse: any,
  challenge: string,
  env: Env
): Promise<boolean> {
  // 1. Verify signature
  // 2. Check challenge matches
  // 3. Update counter
  // 4. Return authentication result
  
  const result = await env.DB.prepare(
    'SELECT * FROM passkeys WHERE username = ? AND credential_id = ?'
  ).bind(username, credentialResponse.id).first();
  
  if (!result) return false;
  
  // Verify cryptographic signature
  const isValid = await verifySignature(credentialResponse, result, challenge);
  
  if (isValid) {
    // Update counter to prevent replay attacks
    await env.DB.prepare(
      'UPDATE passkeys SET counter = ? WHERE credential_id = ?'
    ).bind(credentialResponse.response.counter, credentialResponse.id).run();
  }
  
  return isValid;
}
```

### Implementation Complexity

**Required Components:**
1. **Frontend JavaScript** - WebAuthn API calls (~200 lines)
2. **Backend Logic** - Challenge generation & signature verification (~300 lines)
3. **D1 Schema** - Store passkey credentials (~50 lines)
4. **UI Updates** - Passkey registration/login pages (~200 lines)
5. **Error Handling** - User-friendly error messages (~100 lines)

**Estimated Total**: ~850 lines of TypeScript

### Recommended Timeline

**Phase 1** (Now): Deploy with password authentication ✅
- Fast to implement
- Works for all members
- Strong security (14+ chars with complexity)

**Phase 2** (Future - 6+ months): Add passkey support 🚧
- Add as optional login method
- Members can choose: password OR passkey
- Gradual rollout (test with tech-savvy members first)
- Full documentation and training materials

### Benefits When Implemented

✅ **Phishing-resistant** - Passkeys can't be stolen by fake websites
✅ **No password to remember** - Use FaceID/TouchID instead
✅ **Stronger security** - Cryptographic keys vs. passwords
✅ **Better UX** - One tap to login (no typing)

### Recommendation

**Start with passwords now. Consider passkeys 6+ months after launch if members request them.**

The current 14-character password system provides excellent security for a 24-member organization. Passkeys are a "nice to have" enhancement, not a security necessity.

---


This security hardening guide provides **enterprise-grade security** on the **Cloudflare Free Tier**:
✅ **Defense in Depth** - Multiple overlapping security layers  
✅ **Zero Trust** - All inputs validated, all requests authenticated  
✅ **Rate Limiting** - Prevents brute force attacks  
✅ **Input Sanitization** - Prevents XSS and SQL injection
✅ **Strong Passwords** - 14-char minimum with complexity requirements
✅ **Security Headers** - Standard web security best practices  
✅ **Monitoring** - Log and track security events  
✅ **Incident Response** - Plan for worst-case scenario  
✅ **Passkey-Ready** - Architecture supports future passkey implementation

---

*Created: December 28, 2025*  
*Last Updated: December 28, 2025 (Passkey section added)*  
*Status: Ready for Implementation*
---

*Created: December 28, 2025*  
*Last Updated: December 28, 2025*  
*Status: Ready for Implementation*
