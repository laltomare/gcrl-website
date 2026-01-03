/**
 * User Management Functions
 * =========================
 * 
 * Provides CRUD operations for user management in the GCRL website.
 * All functions use parameterized queries to prevent SQL injection.
 * 
 * Functions:
 * - createUser: Create a new user
 * - getUserById: Get user by ID
 * - getUserByEmail: Get user by email
 * - listUsers: List users with optional filtering
 * - updateUser: Update user information
 * - deleteUser: Delete a user
 * - updateLastLogin: Update user's last login timestamp
 * - changeUserRole: Change user's role
 * 
 * @author Lawrence Altomare
 * @created January 3, 2026
 */

import { User, CreateUserInput, UpdateUserInput, UserRole, UserListOptions } from '../types';

/**
 * Create a new user in the database
 * 
 * @param db - D1 database instance
 * @param input - User creation input (email, name, optional role)
 * @returns The created user record
 * @throws Error if email already exists or validation fails
 */
export async function createUser(db: D1Database, input: CreateUserInput): Promise<User> {
  // Validate input
  if (!input.email || !input.name) {
    throw new Error('Email and name are required');
  }

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const role = input.role || 'member';

  // Validate role
  const validRoles: UserRole[] = ['super_admin', 'admin', 'member'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Generate unique ID
  const id = crypto.randomUUID();

  // Check if email already exists
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (existing) {
    throw new Error(`User with email ${email} already exists`);
  }

  // Insert user
  const result = await db
    .prepare(
      `INSERT INTO users (id, email, name, role, created_at, updated_at, is_active)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 1)`
    )
    .bind(id, email, name, role)
    .run();

  if (!result.success) {
    throw new Error('Failed to create user');
  }

  // Fetch and return the created user
  const user = await getUserById(db, id);
  if (!user) {
    throw new Error('Failed to retrieve created user');
  }

  return user;
}

/**
 * Get a user by their ID
 * 
 * @param db - D1 database instance
 * @param id - User ID
 * @returns User record or null if not found
 */
export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db
    .prepare(
      `SELECT id, email, name, role, created_at, updated_at, last_login, is_active
       FROM users
       WHERE id = ?`
    )
    .bind(id)
    .first();

  if (!result) {
    return null;
  }

  return {
    id: result.id as string,
    email: result.email as string,
    name: result.name as string,
    role: result.role as UserRole,
    created_at: result.created_at as string,
    updated_at: result.updated_at as string,
    last_login: result.last_login as string | null,
    is_active: Boolean(result.is_active),
  };
}

/**
 * Get a user by their email address
 * 
 * @param db - D1 database instance
 * @param email - User email address
 * @returns User record or null if not found
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await db
    .prepare(
      `SELECT id, email, name, role, created_at, updated_at, last_login, is_active
       FROM users
       WHERE email = ?`
    )
    .bind(normalizedEmail)
    .first();

  if (!result) {
    return null;
  }

  return {
    id: result.id as string,
    email: result.email as string,
    name: result.name as string,
    role: result.role as UserRole,
    created_at: result.created_at as string,
    updated_at: result.updated_at as string,
    last_login: result.last_login as string | null,
    is_active: Boolean(result.is_active),
  };
}

/**
 * List users with optional filtering and pagination
 * 
 * @param db - D1 database instance
 * @param options - Query options (role, is_active, limit, offset)
 * @returns Array of users matching the criteria
 */
export async function listUsers(
  db: D1Database,
  options?: UserListOptions
): Promise<User[]> {
  let query = `SELECT id, email, name, role, created_at, updated_at, last_login, is_active
               FROM users
               WHERE 1=1`;
  const params: any[] = [];

  // Apply filters
  if (options?.role) {
    query += ' AND role = ?';
    params.push(options.role);
  }

  if (options?.is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(options.is_active ? 1 : 0);
  }

  // Add ordering and pagination
  query += ' ORDER BY created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  // Build prepared statement
  let stmt = db.prepare(query);
  params.forEach((param) => {
    stmt = stmt.bind(param);
  });

  const results = await stmt.all();

  return results.results.map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login: row.last_login,
    is_active: Boolean(row.is_active),
  }));
}

/**
 * Update user information
 * Only updates fields that are provided in the input
 * 
 * @param db - D1 database instance
 * @param id - User ID to update
 * @param input - Fields to update (email, name, role, is_active)
 * @returns Updated user record or null if not found
 * @throws Error if validation fails
 */
export async function updateUser(
  db: D1Database,
  id: string,
  input: UpdateUserInput
): Promise<User | null> {
  // Check if user exists
  const existing = await getUserById(db, id);
  if (!existing) {
    return null;
  }

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];

  if (input.email !== undefined) {
    const newEmail = input.email.toLowerCase().trim();
    
    // Check if email is already taken by another user
    const emailCheck = await db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .bind(newEmail, id)
      .first();

    if (emailCheck) {
      throw new Error(`Email ${newEmail} is already in use`);
    }

    updates.push('email = ?');
    params.push(newEmail);
  }

  if (input.name !== undefined) {
    updates.push('name = ?');
    params.push(input.name.trim());
  }

  if (input.role !== undefined) {
    const validRoles: UserRole[] = ['super_admin', 'admin', 'member'];
    if (!validRoles.includes(input.role)) {
      throw new Error(`Invalid role: ${input.role}`);
    }
    updates.push('role = ?');
    params.push(input.role);
  }

  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(input.is_active ? 1 : 0);
  }

  // If no updates, return existing user
  if (updates.length === 0) {
    return existing;
  }

  // Add updated_at timestamp
  updates.push("updated_at = datetime('now')");

  // Add user ID to params
  params.push(id);

  // Execute update
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  const result = await db.prepare(query).bind(...params).run();

  if (!result.success) {
    throw new Error('Failed to update user');
  }

  // Return updated user
  return await getUserById(db, id);
}

/**
 * Delete a user from the database
 * This will cascade and delete all associated sessions
 * 
 * @param db - D1 database instance
 * @param id - User ID to delete
 * @returns true if deleted, false if not found
 */
export async function deleteUser(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run();

  return result.success && (result.meta.changes ?? 0) > 0;
}

/**
 * Update the last_login timestamp for a user
 * Called when a user successfully authenticates
 * 
 * @param db - D1 database instance
 * @param id - User ID
 */
export async function updateLastLogin(db: D1Database, id: string): Promise<void> {
  await db
    .prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
    .bind(id)
    .run();
}

/**
 * Change a user's role
 * Convenience function for the common operation of changing roles
 * 
 * @param db - D1 database instance
 * @param id - User ID
 * @param role - New role
 * @returns Updated user record or null if not found
 * @throws Error if validation fails
 */
export async function changeUserRole(
  db: D1Database,
  id: string,
  role: UserRole
): Promise<User | null> {
  const validRoles: UserRole[] = ['super_admin', 'admin', 'member'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  return await updateUser(db, id, { role });
}
