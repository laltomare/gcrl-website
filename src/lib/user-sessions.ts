/**
 * User Session Management Functions
 * =================================
 * 
 * Provides session management for user authentication.
 * Sessions are used to maintain authenticated state across requests.
 * 
 * Functions:
 * - createUserSession: Create a new authentication session
 * - getSessionByToken: Get session by token
 * - getUserSessions: Get all active sessions for a user
 * - deleteSession: Delete a specific session (logout)
 * - deleteUserSessions: Delete all sessions for a user
 * - cleanExpiredSessions: Remove expired sessions from database
 * 
 * Security Features:
 * - Uses crypto.randomUUID() for secure session tokens
 * - Sessions expire after configurable time (default 7 days)
 * - Token validation prevents session hijacking
 * - Automatic cleanup of expired sessions
 * 
 * @author Lawrence Altomare
 * @created January 3, 2026
 */

import { UserSession } from '../types';

/**
 * Default session expiration time (7 days in milliseconds)
 */
const DEFAULT_SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * Create a new user session
 * Generates a secure token and sets expiration time
 * 
 * @param db - D1 database instance
 * @param userId - User ID to create session for
 * @param expiresIn - Session duration in milliseconds (default 7 days)
 * @returns Created session record
 * @throws Error if user not found or session creation fails
 */
export async function createUserSession(
  db: D1Database,
  userId: string,
  expiresIn: number = DEFAULT_SESSION_EXPIRY
): Promise<UserSession> {
  // Check if user exists
  const user = await db
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!user) {
    throw new Error('User not found');
  }

  // Generate session data
  const sessionId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = new Date(now + expiresIn).toISOString();

  // Insert session
  const result = await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
    .bind(sessionId, userId, token, expiresAt)
    .run();

  if (!result.success) {
    throw new Error('Failed to create session');
  }

  // Fetch and return the created session
  const session = await getSessionByToken(db, token);
  if (!session) {
    throw new Error('Failed to retrieve created session');
  }

  return session;
}

/**
 * Get a session by its token
 * Used to validate authentication on each request
 * 
 * @param db - D1 database instance
 * @param token - Session token
 * @returns Session record or null if not found/expired
 */
export async function getSessionByToken(
  db: D1Database,
  token: string
): Promise<UserSession | null> {
  const result = await db
    .prepare(
      `SELECT id, user_id, token, expires_at, created_at
       FROM sessions
       WHERE token = ? AND expires_at > datetime('now')`
    )
    .bind(token)
    .first();

  if (!result) {
    return null;
  }

  return {
    id: result.id as string,
    user_id: result.user_id as string,
    token: result.token as string,
    expires_at: result.expires_at as string,
    created_at: result.created_at as string,
  };
}

/**
 * Get all active sessions for a user
 * Useful for showing user's active devices/sessions
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns Array of active sessions
 */
export async function getUserSessions(
  db: D1Database,
  userId: string
): Promise<UserSession[]> {
  const results = await db
    .prepare(
      `SELECT id, user_id, token, expires_at, created_at
       FROM sessions
       WHERE user_id = ? AND expires_at > datetime('now')
       ORDER BY created_at DESC`
    )
    .bind(userId)
    .all();

  return results.results.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    token: row.token,
    expires_at: row.expires_at,
    created_at: row.created_at,
  }));
}

/**
 * Delete a specific session (logout)
 * Removes the session token from the database
 * 
 * @param db - D1 database instance
 * @param token - Session token to delete
 * @returns true if deleted, false if not found
 */
export async function deleteSession(db: D1Database, token: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM sessions WHERE token = ?')
    .bind(token)
    .run();

  return result.success && (result.meta.changes ?? 0) > 0;
}

/**
 * Delete all sessions for a user
 * Useful for forcing logout from all devices
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns true if any sessions were deleted
 */
export async function deleteUserSessions(db: D1Database, userId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM sessions WHERE user_id = ?')
    .bind(userId)
    .run();

  return result.success && (result.meta.changes ?? 0) > 0;
}

/**
 * Clean expired sessions from the database
 * Should be called periodically to maintain database hygiene
 * Can be run via cron job or on demand
 * 
 * @param db - D1 database instance
 * @returns Number of sessions deleted
 */
export async function cleanExpiredSessions(db: D1Database): Promise<number> {
  const result = await db
    .prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")')
    .run();

  if (!result.success) {
    return 0;
  }

  return result.meta.changes ?? 0;
}

/**
 * Check if a session is valid and not expired
 * Convenience function for authentication middleware
 * 
 * @param db - D1 database instance
 * @param token - Session token to validate
 * @returns true if session is valid, false otherwise
 */
export async function isSessionValid(db: D1Database, token: string): Promise<boolean> {
  const session = await getSessionByToken(db, token);
  return session !== null;
}

/**
 * Extend a session's expiration time
 * Useful for "remember me" functionality or session refresh
 * 
 * @param db - D1 database instance
 * @param token - Session token to extend
 * @param expiresIn - New expiration time in milliseconds (default 7 days)
 * @returns true if extended, false if session not found
 */
export async function extendSession(
  db: D1Database,
  token: string,
  expiresIn: number = DEFAULT_SESSION_EXPIRY
): Promise<boolean> {
  const now = Date.now();
  const newExpiresAt = new Date(now + expiresIn).toISOString();

  const result = await db
    .prepare('UPDATE sessions SET expires_at = ? WHERE token = ?')
    .bind(newExpiresAt, token)
    .run();

  return result.success && (result.meta.changes ?? 0) > 0;
}
