# GCRL Website - Next Steps

**Last Updated**: January 3, 2026
**Status**: Ready to begin User CRUD implementation

---

## Immediate Next Task: User CRUD System

### Overview
Implement a complete User Management System with Create, Read, Update, Delete (CRUD) functionality for managing lodge members in the admin panel.

### Estimated Time
**2-3 hours** for full implementation

---

## Implementation Plan

### Phase 1: Database Setup (15 minutes)

#### Step 1: Create Database Tables
Create two new tables in D1:

**users table**:
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1,
  CHECK (role IN ('admin', 'secretary', 'member', 'guest'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

**sessions table**:
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Migration Command**:
```bash
npx wrangler d1 execute gcrl-documents --file=context/schema_users.sql
```

---

### Phase 2: Type Definitions (10 minutes)

#### Step 2: Add Types to src/types.ts
```typescript
/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'secretary' | 'member' | 'guest';

/**
 * User record
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

/**
 * User session
 */
export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * User list query options
 */
export interface UserListOptions {
  role?: UserRole;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}
```

---

### Phase 3: Database Layer (30 minutes)

#### Step 3: Create src/lib/users.ts
Implement all database operations for user management:

**Functions to implement**:
```typescript
// Create user
export async function createUser(db: D1Database, input: CreateUserInput): Promise<User>

// Get user by ID
export async function getUserById(db: D1Database, id: string): Promise<User | null>

// Get user by email
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null>

// List users (with filters)
export async function listUsers(db: D1Database, options?: UserListOptions): Promise<User[]>

// Update user
export async function updateUser(db: D1Database, id: string, input: UpdateUserInput): Promise<User | null>

// Delete user
export async function deleteUser(db: D1Database, id: string): Promise<boolean>

// Update last login
export async function updateLastLogin(db: D1Database, id: string): Promise<void>

// Change user role
export async function changeUserRole(db: D1Database, id: string, role: UserRole): Promise<User | null>
```

#### Step 4: Create src/lib/user-sessions.ts
Implement session management:

**Functions to implement**:
```typescript
// Create session
export async function createUserSession(db: D1Database, userId: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000): Promise<UserSession>

// Get session by token
export async function getSessionByToken(db: D1Database, token: string): Promise<UserSession | null>

// Get active sessions for user
export async function getUserSessions(db: D1Database, userId: string): Promise<UserSession[]>

// Delete session (logout)
export async function deleteSession(db: D1Database, token: string): Promise<boolean>

// Delete all sessions for user
export async function deleteUserSessions(db: D1Database, userId: string): Promise<boolean>

// Clean expired sessions
export async function cleanExpiredSessions(db: D1Database): Promise<number>
```

---

### Phase 4: Admin Panel Routes (45 minutes)

#### Step 5: Add User Management Routes

**Routes to implement**:
```
GET  /admin/users              - List all users (with filters)
GET  /admin/users/:id          - View user details
GET  /admin/users/new          - Create user form
POST /admin/users              - Create user (submit)
GET  /admin/users/:id/edit     - Edit user form
POST /admin/users/:id          - Update user (submit)
POST /admin/users/:id/delete   - Delete user
POST /admin/users/:id/activate - Activate user
POST /admin/users/:id/deactivate - Deactivate user
```

#### Step 6: Create User Page Components
Create in `src/lib/pages/users.ts`:
```typescript
// User list page
export function UsersListPage(users: User[]): string

// User detail page
export function UserDetailPage(user: User, sessions: UserSession[]): string

// Create user form
export function CreateUserFormPage(): string

// Edit user form
export function EditUserFormPage(user: User): string
```

---

### Phase 5: Role-Based Access Control (30 minutes)

#### Step 7: Implement Authorization Middleware

Create `src/lib/auth.ts` functions:
```typescript
// Check if user has required role
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean

// Role hierarchy
const ROLE_HIERARCHY = {
  admin: 4,
  secretary: 3,
  member: 2,
  guest: 1
};

// Check if user can perform action
export function canUserPerformAction(userRole: UserRole, action: string): boolean
```

**Permission Matrix**:
```
Action              | Admin | Secretary | Member | Guest
--------------------|-------|-----------|--------|------
View users          |   ✓   |     ✓     |   ✓    |
Create user         |   ✓   |     ✓     |        |
Edit user           |   ✓   |     ✓     |        |
Delete user         |   ✓   |           |        |
Change roles        |   ✓   |           |        |
Manage documents    |   ✓   |     ✓     |        |
Manage events       |   ✓   |     ✓     |        |
View requests       |   ✓   |     ✓     |        |
```

---

### Phase 6: Testing & Deployment (30 minutes)

#### Step 8: Testing Checklist
- [ ] Create user via admin panel
- [ ] View user list with filters
- [ ] View individual user details
- [ ] Edit user information
- [ ] Change user role
- [ ] Activate/deactivate user
- [ ] Delete user
- [ ] Test role-based permissions
- [ ] Test session management

#### Step 9: Deploy
```bash
git add -A
git commit -m "feat: implement user CRUD system"
git push origin main
npx wrangler deploy
```

---

## File Structure (After Implementation)

```
src/
├── lib/
│   ├── users.ts           # NEW - User CRUD operations
│   ├── user-sessions.ts   # NEW - Session management
│   ├── pages/
│   │   └── users.ts       # NEW - User management pages
├── routes/
│   └── users.ts           # NEW - User route handlers
└── types.ts               # UPDATED - User types added
```

---

## Implementation Notes

### Security Considerations

1. **Password Hashing**: Not implementing user passwords yet (using OTP-based auth like admin)
2. **Session Tokens**: Use crypto.randomUUID() for secure tokens
3. **Session Expiration**: Default 7 days, configurable
4. **Rate Limiting**: Apply to user creation/update endpoints
5. **Input Validation**: Sanitize all user inputs
6. **SQL Injection**: Use parameterized queries only

### Email Notifications

Consider sending emails when:
- [ ] User is created
- [ ] User role is changed
- [ ] User is deactivated
- [ ] User is deleted

### Admin Panel Integration

Add to admin dashboard:
- User count by role
- Recent user activity
- Active sessions count
- Quick actions (create user, view all)

---

## Success Criteria

✅ **Complete When**:
- All CRUD operations working
- Role-based permissions enforced
- Admin panel UI complete
- Session management functional
- All tests passing
- Deployed to development
- Production-ready (after review)

---

## Post-Implementation Tasks

### Immediate (Next Session)
1. Add user activity logging
2. Implement user search functionality
3. Add bulk user operations
4. Create user import/export

### Future Enhancements
1. User profile pages
2. User avatar support
3. Password-based authentication (optional)
4. Two-factor auth for regular users
5. User groups/committees
6. Email notification preferences

---

## Rollback Plan

If issues arise:
1. Revert commit: `git revert HEAD`
2. Drop tables: `DROP TABLE users; DROP TABLE sessions;`
3. Redeploy: `npx wrangler deploy`
4. Verify system restored

---

## Dependencies

No new dependencies needed. Using:
- Cloudflare D1 (database)
- Built-in crypto API (UUID generation)
- Existing OTPAuth library (authentication)

---

## Questions to Resolve

1. **User Identification**: Use email only or add username?
   - **Recommendation**: Email only (simpler, Masons already identified by email)

2. **Initial Admin User**: How to create first admin?
   - **Recommendation**: Manual database insertion or special setup endpoint

3. **User Deletion**: Soft delete or hard delete?
   - **Recommendation**: Hard delete (sessions cascade via foreign key)

4. **Role Changes**: Should admin be able to change any user's role?
   - **Recommendation**: Yes, but prevent self-demotion (admin can't remove their own admin role)

---

## Code Examples

### Example: Creating a User
```typescript
const newUser = await createUser(env.DB, {
  email: 'brother@example.com',
  name: 'John Doe',
  role: 'member'
});
```

### Example: Listing Users
```typescript
const members = await listUsers(env.DB, {
  role: 'member',
  is_active: true
});
```

### Example: Updating User Role
```typescript
const updated = await updateUser(env.DB, userId, {
  role: 'secretary'
});
```

### Example: Creating Session
```typescript
const session = await createUserSession(env.DB, userId);
// Use session.token for authentication
```

---

## Ready to Begin!

All context documents prepared:
- ✅ SESSION_SUMMARY.md - What we've done
- ✅ TECHNICAL_ARCHITECTURE.md - How it works
- ✅ NEXT_STEPS.md - What's next (this file)

**When ready to start new conversation, reference these files in the `context/` directory.**
