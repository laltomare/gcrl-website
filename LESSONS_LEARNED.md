# Lessons Learned: GCRL Website Development

**Project**: Golden Compasses Research Lodge Website  
**Date**: January 2026  
**Purpose**: Document lessons learned for future projects  
**Status**: Feature Complete (January 2026)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technical Debt Analysis](#technical-debt-analysis)
3. [Architecture Design Principles](#architecture-design-principles)
4. [Development Best Practices](#development-best-practices)
5. [Testing Strategies](#testing-strategies)
6. [Deployment Workflows](#deployment-workflows)
7. [Code Organization Patterns](#code-organization-patterns)
8. [Database Management](#database-management)
9. [Clean Code Practices](#clean-code-practices)
10. [Quick Reference Checklist](#quick-reference-checklist)

---

## Executive Summary

This document captures key lessons learned during the development of the GCRL website. The project goal was to learn web development while building a functional Masonic lodge website with admin dashboard, member library, and document management system.

### What Went Well
- ✅ Delivered a fully functional, feature-complete application
- ✅ Learned modern web development (Cloudflare Workers, D1, R2)
- ✅ Implemented secure authentication with sessions and roles
- ✅ Successfully debugged and resolved complex authentication issues

### What Could Have Been Better
- ❌ Accumulated significant technical debt through incremental development
- ❌ Lacked upfront architecture design
- ❌ No formal testing strategy
- ❌ Database inconsistencies between local and remote environments

### Bottom Line
> **"Weeks of programming can save you hours of planning."**  
> — Anonymous

The time spent debugging authentication issues could have been avoided with proper upfront design. This document outlines what to do differently next time.

---

## Technical Debt Analysis

### What Is Technical Debt?

**Technical debt** is the implied cost of additional rework caused by choosing an easy or fast solution now instead of using a better approach that would take longer.

### Debt Accumulated in This Project

#### 1. Legacy Code Accumulation
**Problem**: Built authentication in layers without removing old code.

**Example**:
```typescript
// OLD: Password-only verification (legacy)
if (path === '/admin/verify') {
  const result = verifyToken(password, env, true);
  // ...
}

// NEW: Email/password login with sessions
if (path === '/admin/login') {
  const user = await loginUser(env.DB, email, password);
  // ...
}
```

**Impact**: 
- Confusing which code was actually running
- Duplicate functionality
- Hard to debug
- Security concerns with old endpoints

**Solution**: Remove old code immediately after migration is complete.

---

#### 2. Duplicate Route Handlers
**Problem**: Created duplicate `/admin/login` POST handlers at different locations.

**Example**:
```typescript
// Line 475: First /admin/login POST handler
if (path === '/admin/login' && request.method === 'POST') {
  // ... login logic
}

// Line 569: Duplicate /admin/login POST handler
if (path === '/admin/login' && request.method === 'POST') {
  // ... different login logic!
}
```

**Impact**:
- Unpredictable which handler would execute
- Maintenance nightmare
- Bugs from inconsistent behavior

**Solution**: Use code reviews and linters to catch duplicates early.

---

#### 3. Syntax Errors from Poor Refactoring
**Problem**: Text editor truncated route paths during deletion.

**Example**:
```typescript
// BROKEN: Path truncated during deletion
if (path === '-session' && request.method === 'POST') {  // ❌
if (path === '-2fa' && request.method === 'POST') {      // ❌

// CORRECT: Full paths
if (path === '/admin/verify-session' && request.method === 'POST') {  // ✅
if (path === '/admin/verify-2fa' && request.method === 'POST') {      // ✅
```

**Impact**:
- Routes never matched
- Session verification completely broken
- 2FA completely broken
- Dashboard loading then disappearing

**Solution**: 
- Use version control (git) to catch breaking changes
- Run tests after every refactor
- Use IDE features for safe refactoring

---

#### 4. Database Inconsistencies
**Problem**: Test user existed in local database but not remote.

**Example**:
```bash
# Local DB (wrangler d1 execute without --remote)
✅ testadmin@example.com exists

# Remote DB (wrangler d1 execute --remote)
❌ testadmin@example.com missing
```

**Impact**:
- Login works locally but fails in production
- Confusing debugging sessions
- "Works on my machine" syndrome

**Solution**: 
- Use migration scripts for schema changes
- Seed test data in both environments
- Document database requirements
- Always test against remote DB before deploying

---

#### 5. Wrong Password Hash
**Problem**: Test user had password hash from a different password.

**Example**:
```bash
# Password: TestPassword123!
# Hash in database: $2b$10$N9qo8uLOickgx2ZMRZoMye... (wrong password)
# Expected hash: $2b$10$PE96pj63cOLnepsYNwlJk... (correct password)
```

**Impact**:
- "Invalid email or password" errors
- Hours of debugging authentication code
- User thought code was broken when it was just bad data

**Solution**: 
- Generate hashes programmatically, not manually
- Verify test data works before using it
- Document test credentials clearly

---

### Root Cause Analysis

**Primary Issue**: Incremental development without architectural oversight.

```
Week 1: "Just need password verification" → verifyToken()
Week 2: "Need user accounts" → Add users table
Week 3: "Need sessions" → Add session management
Week 4: "Need role-based access" → Add roles
Week 5: "All broken, need to refactor" → Technical debt crisis
```

**What Should Have Happened**:
```
Week 1: Design complete auth system
Week 2-3: Implement auth system
Week 4: Test thoroughly
Week 5: Deploy and monitor
```

---

## Architecture Design Principles

### 1. Design Before Coding

**The Rule**: Always create a written architecture document before writing code.

**What to Document**:
```markdown
## Authentication Architecture

### Requirements
- Users must log in with email and password
- Sessions expire after 7 days
- Admin and super_admin roles
- Rate limiting on login attempts
- Security event logging

### Data Models
- users table: id, email, name, password_hash, role, is_active
- user_sessions table: id, user_id, token, expires_at

### API Endpoints
- POST /admin/login - Authenticate user
- POST /admin/verify-session - Validate session token
- POST /admin/logout - Invalidate session

### Security
- Passwords hashed with bcrypt (cost factor 10)
- Session tokens are UUIDs
- Rate limit: 5 attempts per 15 minutes
- All security events logged
```

**Benefits**:
- Forces you to think through the design
- Identifies potential issues early
- Provides a reference during implementation
- Easier to get feedback

---

### 2. Choose One Approach and Stick to It

**The Problem**: We had THREE authentication methods:
1. `verifyToken()` - Simple password verification
2. `loginUser()` - Email/password with sessions
3. Legacy `/admin/verify` endpoint

**The Solution**: Pick ONE authentication method and use it everywhere.

```typescript
// ✅ GOOD: Single authentication function
export async function loginUser(db: D1Database, email: string, password: string): Promise<User | null> {
  // One way to authenticate users
}

// ❌ BAD: Multiple authentication methods
export function verifyToken(token: string, env: Env, requireAdmin: boolean) { /* ... */ }
export async function loginUser(db: D1Database, email: string, password: string) { /* ... */ }
export async function checkAuthOldWay(request: Request) { /* ... */ }
```

---

### 3. Plan for Migration from Day One

**When Upgrading Legacy Systems**:

```yaml
Phase 1: Build New System
  - Implement new authentication alongside old
  - Use different endpoints (/auth/v2/login)
  - Test thoroughly
  
Phase 2: Migrate Data
  - Create user accounts for existing users
  - Migrate passwords (hash if plaintext)
  - Verify data integrity
  
Phase 3: Switch Traffic
  - Update client code to use new endpoints
  - Add feature flags for gradual rollout
  - Monitor for errors
  
Phase 4: Cleanup
  - Deprecate old endpoints
  - Remove old code
  - Update documentation
```

**What We Did Wrong**:
- Deleted old code before new code was tested
- No migration plan
- No gradual rollout
- Broke everything, then fixed it

---

### 4. Separate Concerns

**The Problem**: All logic in one massive `index.ts` file (1000+ lines).

**Better Approach**:

```
src/
├── index.ts          # Route handlers only
├── lib/
│   ├── auth.ts       # Authentication logic
│   ├── users.ts      # User management
│   ├── sessions.ts   # Session management
│   ├── pages.ts      # Page rendering
│   └── headers.ts    # HTTP headers
└── types/
    └── index.ts      # TypeScript types
```

**Benefits**:
- Each file has a single responsibility
- Easier to test
- Easier to understand
- Easier to maintain

---

## Development Best Practices

### 1. Use Version Control (Git)

**What We Should Have Done**:
```bash
# Create feature branch
git checkout -b feature/session-auth

# Commit frequently
git add .
git commit -m "Implement session management"

# Push and review
git push origin feature/session-auth

# Create pull request
# Get code review
# Merge after approval
```

**Benefits**:
- See every change made
- Easy to revert breaking changes
- Code reviews catch bugs
- Clear history of what changed and why

---

### 2. Write Self-Documenting Code

**❌ Bad**: Comments explaining what code does
```typescript
// Check if user is admin
if (user.role === 'admin') {
  // Allow access
  return true;
} else {
  // Deny access
  return false;
}
```

**✅ Good**: Code that explains itself
```typescript
function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

if (isAdmin(user)) {
  return true;
}
```

**When to Use Comments**:
- Explain WHY, not WHAT
- Document complex algorithms
- Note workarounds for bugs
- Warn about side effects

---

### 3. Use Meaningful Names

**❌ Bad**:
```typescript
const d1 = await env.DB.prepare(query);
const x = d1.bind(id);
const y = await x.first();
```

**✅ Good**:
```typescript
const statement = await env.DB.prepare(query);
const boundStatement = statement.bind(userId);
const result = await boundStatement.first();
```

**Naming Conventions**:
- **Variables**: camelCase (`userId`, `sessionToken`)
- **Functions**: camelCase, verb-first (`getUserById`, `createSession`)
- **Types/Interfaces**: PascalCase (`User`, `Session`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`, `SESSION_DURATION_MS`)

---

### 4. Handle Errors Gracefully

**❌ Bad**: Silent failures
```typescript
const user = await getUserByEmail(db, email);
// What if user is null? Crash!
return user.id;
```

**✅ Good**: Explicit error handling
```typescript
const user = await getUserByEmail(db, email);
if (!user) {
  return new Response('User not found', { status: 404 });
}
return user.id;
```

**Best Practices**:
- Always check for null/undefined
- Return meaningful error messages
- Log errors for debugging
- Don't expose sensitive data in errors

---

### 5. Avoid Code Duplication (DRY Principle)

**❌ Bad**: Same logic repeated
```typescript
// In three different places:
const hashedPassword = await bcrypt.hash(password, 10);
await env.DB.prepare('INSERT INTO users (password_hash) VALUES (?)').bind(hashedPassword).run();
```

**✅ Good**: Single function
```typescript
async function createUser(db: D1Database, email: string, password: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .bind(email, hashedPassword)
    .run();
  return getUserByEmail(db, email);
}

// Use it everywhere:
await createUser(env.DB, email, password);
```

---

## Testing Strategies

### Why Testing Matters

**Without Tests**:
- Deploy broken code to production
- Break features while fixing bugs
- Spend hours debugging
- Fear making changes

**With Tests**:
- Catch bugs before deployment
- Refactor with confidence
- Document expected behavior
- Ship faster with confidence

---

### 1. Unit Tests

**Purpose**: Test individual functions in isolation.

**Example**:
```typescript
import { loginUser } from './auth';

describe('loginUser', () => {
  it('should return user for correct credentials', async () => {
    const user = await loginUser(mockDb, 'test@example.com', 'password123');
    expect(user).not.toBeNull();
    expect(user.email).toBe('test@example.com');
  });

  it('should return null for incorrect password', async () => {
    const user = await loginUser(mockDb, 'test@example.com', 'wrongpassword');
    expect(user).toBeNull();
  });

  it('should return null for non-existent user', async () => {
    const user = await loginUser(mockDb, 'nonexistent@example.com', 'password123');
    expect(user).toBeNull();
  });
});
```

---

### 2. Integration Tests

**Purpose**: Test how components work together.

**Example**:
```typescript
describe('/admin/login endpoint', () => {
  it('should authenticate user with valid credentials', async () => {
    const response = await fetch('https://gcrl-website.workers.dev/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'testadmin@example.com',
        password: 'TestPassword123!'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('admin');
  });

  it('should reject invalid credentials', async () => {
    const response = await fetch('https://gcrl-website.workers.dev/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'testadmin@example.com',
        password: 'WrongPassword123!'
      })
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid email or password');
  });
});
```

---

### 3. Manual Testing Checklist

**Before Every Deployment**:

```markdown
## Authentication Testing
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Verify session token is returned
- [ ] Verify user role is correct
- [ ] Test session expiration
- [ ] Test logout
- [ ] Test rate limiting (5 failed attempts)

## Admin Dashboard Testing
- [ ] Dashboard loads successfully
- [ ] User information displayed correctly
- [ ] Navigation works
- [ ] Page refresh maintains session
- [ ] Logout works

## Security Testing
- [ ] Check security logs for events
- [ ] Verify passwords are hashed
- [ ] Test SQL injection protection
- [ ] Test XSS protection
```

---

### 4. Testing Environment Setup

**What We Should Have**:

```yaml
Environments:
  Local:
    - Local D1 database
    - Auto-reload on code changes
    - Fast feedback loop
  
  Staging:
    - Remote D1 database (separate from production)
    - Test before production deployment
    - Catch environment-specific bugs
  
  Production:
    - Real D1 database
    - Real R2 storage
    - Monitor for errors
```

---

## Deployment Workflows

### 1. Pre-Deployment Checklist

**Before Every Deploy**:

```bash
#!/bin/bash
# pre-deploy-check.sh

echo "Running pre-deployment checks..."

# 1. Check TypeScript errors
echo "Checking TypeScript..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found"
  exit 1
fi

# 2. Run tests
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# 3. Check environment variables
echo "Checking environment..."
if [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ ADMIN_PASSWORD not set"
  exit 1
fi

# 4. Verify remote database
echo "Checking remote database..."
npx wrangler d1 execute gcrl-documents --remote --command="SELECT COUNT(*) FROM users"
if [ $? -ne 0 ]; then
  echo "❌ Cannot access remote database"
  exit 1
fi

echo "✅ All checks passed. Ready to deploy."
```

---

### 2. Safe Deployment Process

**Step-by-Step**:

```bash
# 1. Build the project
npm run build

# 2. Test the build locally
npx wrangler dev

# 3. Deploy to staging
npx wrangler deploy --env staging

# 4. Test staging
curl https://gcrl-website-staging.workers.dev/admin/login

# 5. If staging works, deploy to production
npx wrangler deploy

# 6. Verify production
curl https://gcrl-website.lawrence-675.workers.dev/admin/login

# 7. Monitor logs
npx wrangler tail
```

---

### 3. Rollback Plan

**Always Have a Way to Undo**:

```bash
# Save working version before deploying
git tag working-$(date +%Y%m%d)

# Deploy new version
npx wrangler deploy

# If something breaks, rollback:
git checkout working-20260106
npx wrangler deploy
```

---

### 4. Monitoring After Deployment

**What to Watch**:

```bash
# Live logs
npx wrangler tail

# Check for errors
grep ERROR logs/output.log

# Monitor response times
curl -w "@curl-format.txt" https://gcrl-website.workers.dev/admin/login

# Check database health
npx wrangler d1 execute gcrl-documents --remote --command="SELECT COUNT(*) FROM users"
```

---

## Code Organization Patterns

### 1. File Structure

**Good Organization**:

```
gcrl-website/
├── src/
│   ├── index.ts              # Main entry point, route handlers
│   ├── lib/                  # Shared utilities
│   │   ├── auth.ts          # Authentication functions
│   │   ├── users.ts         # User management
│   │   ├── sessions.ts      # Session management
│   │   ├── pages.ts         # Page rendering
│   │   ├── headers.ts       # HTTP header utilities
│   │   ├── sanitize.ts      # Input sanitization
│   │   └── totp.ts          # Two-factor auth
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── pages/
│       ├── admin/           # Admin-specific pages
│       └── public/          # Public pages
├── tests/                   # Test files
├── migrations/              # Database migrations
├── wrangler.toml           # Cloudflare config
└── package.json            # Dependencies
```

**Benefits**:
- Easy to find code
- Clear separation of concerns
- Easy to navigate

---

### 2. Route Handler Pattern

**Consistent Structure**:

```typescript
// GET /admin/login - Serve login page
if (path === '/admin/login' && request.method === 'GET') {
  try {
    // 1. Check authentication (if needed)
    // 2. Parse request data
    // 3. Validate input
    // 4. Execute logic
    // 5. Return response
  } catch (error) {
    // 6. Handle errors
  }
}

// POST /admin/login - Process login
if (path === '/admin/login' && request.method === 'POST') {
  try {
    // Same structure
  } catch (error) {
    // Same structure
  }
}
```

---

### 3. Error Handling Pattern

**Consistent Error Responses**:

```typescript
interface ErrorResponse {
  error: string;
  details?: string;
}

function errorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Usage:
if (!user) {
  return errorResponse('User not found', 404);
}

if (!passwordMatch) {
  return errorResponse('Invalid email or password', 401);
}

if (user.role !== 'admin') {
  return errorResponse('Access denied', 403);
}
```

---

### 4. Module Pattern

**Self-Contained Modules**:

```typescript
// lib/auth.ts
// All authentication logic in one place

export async function loginUser(db: D1Database, email: string, password: string): Promise<User | null> {
  // Implementation
}

export async function verifySession(db: D1Database, token: string): Promise<User | null> {
  // Implementation
}

export async function logoutUser(db: D1Database, token: string): Promise<boolean> {
  // Implementation
}

// Clear API, easy to test, easy to reuse
```

---

## Database Management

### 1. Use Migration Scripts

**❌ Bad**: Manual database changes

```bash
# What we did:
npx wrangler d1 execute gcrl-documents --remote --command="ALTER TABLE users ADD COLUMN role TEXT"
```

**✅ Good**: Migration scripts

```sql
-- migrations/001_add_role_column.sql
-- Migration: Add role column to users table
-- Date: 2026-01-06
-- Author: Lawrence Altomare

ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';
UPDATE users SET role = 'admin' WHERE email = 'lawrence@altomare.org';
```

```bash
# Run migrations
npx wrangler d1 execute gcrl-documents --remote --file=migrations/001_add_role_column.sql
```

**Benefits**:
- Version-controlled database changes
- Easy to see what changed
- Can roll back migrations
- Consistent across environments

---

### 2. Seed Test Data

**Create seed scripts**:

```sql
-- seeds/test_users.sql
-- Seed test users for development/testing

-- Test admin user
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES (
  'test-admin-id',
  'testadmin@example.com',
  'Test Admin',
  '$2b$10$PE96pj63cOLnepsYNwlJkO9yhZI89212JkTjxOc4Cdz74AIf8BCqu',
  'admin',
  1
);

-- Test regular user
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES (
  'test-user-id',
  'testuser@example.com',
  'Test User',
  '$2b$10$PE96pj63cOLnepsYNwlJkO9yhZI89212JkTjxOc4Cdz74AIf8BCqu',
  'member',
  1
);
```

```bash
# Seed both local and remote
npx wrangler d1 execute gcrl-documents --file=seeds/test_users.sql
npx wrangler d1 execute gcrl-documents --remote --file=seeds/test_users.sql
```

---

### 3. Document Database Schema

**Keep schema documentation**:

```markdown
## Database Schema: gcrl-documents

### users table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| email | TEXT | UNIQUE, NOT NULL | User email |
| name | TEXT | NOT NULL | Full name |
| password_hash | TEXT | NOT NULL | Bcrypt hash |
| role | TEXT | NOT NULL | admin, super_admin, member |
| is_active | INTEGER | DEFAULT 1 | 0=inactive, 1=active |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

### user_sessions table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | FOREIGN KEY | References users(id) |
| token | TEXT | UNIQUE, NOT NULL | Session token (UUID) |
| expires_at | TEXT | NOT NULL | ISO 8601 timestamp |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
```

---

### 4. Sync Local and Remote Databases

**Problem**: Local and remote databases got out of sync.

**Solution**: Use migrations for both.

```bash
# Run migration on local
npx wrangler d1 execute gcrl-documents --file=migrations/001_add_role_column.sql

# Run migration on remote
npx wrangler d1 execute gcrl-documents --remote --file=migrations/001_add_role_column.sql

# Verify both are in sync
npx wrangler d1 execute gcrl-documents --command="SELECT COUNT(*) FROM users"
npx wrangler d1 execute gcrl-documents --remote --command="SELECT COUNT(*) FROM users"
```

---

## Clean Code Practices

### 1. Functions Should Do One Thing

**❌ Bad**: Function does multiple things
```typescript
async function handleLogin(request: Request, env: Env) {
  // Parse body
  const body = await request.json();
  
  // Validate input
  if (!body.email || !body.password) {
    return new Response('Missing fields', { status: 400 });
  }
  
  // Authenticate
  const user = await loginUser(env.DB, body.email, body.password);
  
  // Create session
  const token = await createUserSessionToken(env.DB, user.id);
  
  // Log security event
  await logSecurityEvent(env, 'LOGIN_SUCCESS', request, body.email);
  
  // Return response
  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**✅ Good**: Each function has single responsibility
```typescript
// Parse and validate input
function parseLoginBody(body: any): { email: string; password: string } | null {
  if (!body.email || !body.password) return null;
  return { email: body.email, password: body.password };
}

// Authenticate user
async function authenticateUser(db: D1Database, email: string, password: string): Promise<User | null> {
  return await loginUser(db, email, password);
}

// Create session and log
async function createUserSession(db: D1Database, userId: string): Promise<string> {
  return await createUserSessionToken(db, userId);
}

// Route handler orchestrates
async function handleLogin(request: Request, env: Env) {
  const body = await request.json();
  const credentials = parseLoginBody(body);
  if (!credentials) {
    return errorResponse('Missing fields', 400);
  }
  
  const user = await authenticateUser(env.DB, credentials.email, credentials.password);
  if (!user) {
    return errorResponse('Invalid credentials', 401);
  }
  
  const token = await createUserSession(env.DB, user.id);
  await logSecurityEvent(env, 'LOGIN_SUCCESS', request, credentials.email);
  
  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

### 2. Avoid Magic Numbers and Strings

**❌ Bad**: Magic values
```typescript
if (user.role === 'admin') {
  const sessionDuration = 7 * 24 * 60 * 60 * 1000;
  const maxAttempts = 5;
  const windowMs = 900000;
}
```

**✅ Good**: Named constants
```typescript
const USER_ROLE_ADMIN = 'admin';
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

if (user.role === USER_ROLE_ADMIN) {
  const sessionDuration = SESSION_DURATION_MS;
  const maxAttempts = MAX_LOGIN_ATTEMPTS;
  const windowMs = RATE_LIMIT_WINDOW_MS;
}
```

---

### 3. Use Type Safety

**❌ Bad**: Any types
```typescript
async function getUser(db: D1Database, id: string): any {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return result;
}
```

**✅ Good**: Defined types
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'member';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function getUser(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return result as User | null;
}
```

---

### 4. Early Returns for Happy Path

**❌ Bad**: Deep nesting
```typescript
async function handleLogin(request: Request, env: Env) {
  const body = await request.json();
  
  if (body.email && body.password) {
    const user = await loginUser(env.DB, body.email, body.password);
    
    if (user) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        const token = await createUserSessionToken(env.DB, user.id);
        
        if (token) {
          return new Response(JSON.stringify({ token }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return errorResponse('Failed to create session', 500);
        }
      } else {
        return errorResponse('Access denied', 403);
      }
    } else {
      return errorResponse('Invalid credentials', 401);
    }
  } else {
    return errorResponse('Missing fields', 400);
  }
}
```

**✅ Good**: Early returns
```typescript
async function handleLogin(request: Request, env: Env) {
  const body = await request.json();
  
  // Validate input
  if (!body.email || !body.password) {
    return errorResponse('Missing fields', 400);
  }
  
  // Authenticate
  const user = await loginUser(env.DB, body.email, body.password);
  if (!user) {
    return errorResponse('Invalid credentials', 401);
  }
  
  // Check role
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return errorResponse('Access denied', 403);
  }
  
  // Create session
  const token = await createUserSessionToken(env.DB, user.id);
  if (!token) {
    return errorResponse('Failed to create session', 500);
  }
  
  // Success
  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

### 5. Comment Complex Logic, Not Obvious Code

**❌ Bad**: Stating the obvious
```typescript
// Get user by email
const user = await getUserByEmail(db, email);

// Check if user exists
if (user) {
  // Return user
  return user;
}

// Return null if not found
return null;
```

**✅ Good**: Explaining why
```typescript
// Normalize email to lowercase for case-insensitive lookup
const normalizedEmail = email.toLowerCase().trim();

// Use getUserByEmail to check account existence without revealing
// whether the email is registered (security best practice)
const user = await getUserByEmail(db, normalizedEmail);
if (!user) {
  // Return generic error message to prevent email enumeration
  return null;
}
```

---

## Quick Reference Checklist

### Starting a New Project

```markdown
## Planning Phase (Week 1)
- [ ] Write architecture document
- [ ] Define data models
- [ ] Design API endpoints
- [ ] Choose authentication method
- [ ] Plan database schema
- [ ] Set up version control (git)

## Development Phase (Week 2-3)
- [ ] Set up project structure
- [ ] Implement core features
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Set up local environment
- [ ] Set up staging environment

## Testing Phase (Week 4)
- [ ] Test all features locally
- [ ] Test on staging environment
- [ ] Manual testing checklist
- [ ] Security review
- [ ] Performance testing
- [ ] Fix all bugs

## Deployment Phase (Week 5)
- [ ] Pre-deployment checklist
- [ ] Deploy to production
- [ ] Monitor logs
- [ ] Verify functionality
- [ ] Document any issues
```

---

### Before Every Code Change

```markdown
## Pre-Commit Checklist
- [ ] Code follows project patterns
- [ ] No duplicate code
- [ ] Self-documenting code
- [ ] Error handling added
- [ ] Tests written/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No commented-out code
```

---

### Before Every Deployment

```markdown
## Pre-Deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Tested on staging
- [ ] Rollback plan ready
- [ ] Monitoring setup
- [ ] Documentation updated
```

---

### Code Review Checklist

```markdown
## Review Criteria
- [ ] Code is readable and understandable
- [ ] Follows project conventions
- [ ] No security vulnerabilities
- [ ] Error handling is proper
- [ ] No unnecessary complexity
- [ ] Tests are adequate
- [ ] Documentation is clear
- [ ] Performance is acceptable
```

---

## Conclusion

### Key Takeaways

1. **Design Before You Code**: A written architecture document saves hours of debugging.

2. **Test Everything**: Unit tests, integration tests, and manual testing catch bugs before production.

3. **Use Version Control**: Git allows you to see changes, revert mistakes, and review code.

4. **Keep It Simple**: Avoid over-engineering. Simple code is easier to understand and maintain.

5. **Handle Errors Gracefully**: Never assume success. Always check for errors and handle them properly.

6. **Document Your Work**: Write documentation for yourself and others who will maintain the code.

7. **Learn From Mistakes**: Every bug is a lesson. Document what went wrong and how to fix it.

8. **Refactor Continuously**: Clean up code as you go. Don't let technical debt accumulate.

---

### Final Thoughts

This project was a learning experience, and that's exactly what it was meant to be. The technical debt we accumulated and the debugging we did are all part of the learning process.

**The most important lesson**: The time you spend planning and testing is not wasted—it's saved from debugging later.

---

### Resources for Further Learning

**Books**:
- "Clean Code" by Robert C. Martin
- "The Pragmatic Programmer" by Andrew Hunt and David Thomas
- "Refactoring" by Martin Fowler

**Online Resources**:
- Cloudflare Workers Documentation: https://developers.cloudflare.com/workers/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- MDN Web Docs: https://developer.mozilla.org/

**Tools**:
- Wrangler (Cloudflare CLI)
- Git (Version Control)
- ESLint (Code Linting)
- Prettier (Code Formatting)

---

**Last Updated**: January 6, 2026  
**Author**: Lawrence Altomare  
**Project**: Golden Compasses Research Lodge Website

---

> "The only way to learn a new programming language is by writing programs in it."  
> — Dennis Ritchie

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."  
> — Martin Fowler

> "First, solve the problem. Then, write the code."  
> — John Johnson
