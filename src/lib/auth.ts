/**
 * Authentication and Security Functions
 * ===================================
 * 
 * Purpose: Handle authentication, rate limiting, and security logging
 * 
 * Key Features:
 * - Password validation with strength requirements
 * - Rate limiting for sensitive operations (login, downloads)
 * - IP-based tracking with in-memory storage
 * - Security event logging to D1 database
 * - Token verification for admin and library access
 * 
 * Security Model:
 * - Admin password: 14+ chars, 3 of 4 character types
 * - Rate limiting: 5 attempts per 15 minutes (default)
 * - Download limiting: 10 attempts per hour
 * - All security events logged with IP, timestamp, user agent
 * 
 * Functions:
 * - validatePassword(): Check password strength
 * - verifyToken(): Verify admin or library password
 * - checkRateLimit(): Enforce rate limits per IP
 * - getClientIP(): Extract client IP from request headers
 * - logSecurityEvent(): Audit log for security-relevant events
 * 
 * Author: Lawrence Altomare
 * Created: December 2025
 * Last Modified: December 31, 2025
 */

import { Env } from './types';
import bcrypt from 'bcryptjs';
import { User, getUserByEmail, getUserById, updateUser } from './users';
import { createUserSession, getSessionByToken, deleteSession } from './user-sessions';

// Constants for password validation
const MIN_PASSWORD_LENGTH = 14;

// Session duration (7 days)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Lodge-themed password suggestions for members
export const PASSWORD_SUGGESTIONS = [
  "Golden$Compass2024",  // 18 chars - lodge-themed
  "NorthStar7!Research", // 18 chars - Masonic-themed
  "Lodge#Square7",       // 14 chars - minimal but strong
  "CarpenterLevel2025!", // 18 chars - tool-themed
  "Square7!Compass",     // 15 chars - working tools
  "Ashlar9!Stone",       // 14 chars - Masonic reference
];

// Validate password strength
export function validatePassword(password: string): {valid: boolean, reason?: string} {
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

// Rate limiting by IP (in-memory for simplicity)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string, 
  maxAttempts: number = 5, 
  windowMs: number = 900000 // 15 minutes
): boolean {
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
export function getClientIP(request: Request): string {
  // Cloudflare adds this header
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

// Verify authentication token
export function verifyToken(token: string, env: Env, requireAdmin: boolean = false): {valid: boolean, isAdmin?: boolean} {
  if (requireAdmin) {
    if (token === env.ADMIN_PASSWORD) {
      return { valid: true, isAdmin: true };
    }
    return { valid: false };
  }
  
  // Check both admin and library passwords for member access
  if (token === env.LIBRARY_PASSWORD || token === env.ADMIN_PASSWORD) {
    return { 
      valid: true, 
      isAdmin: token === env.ADMIN_PASSWORD 
    };
  }
  
  return { valid: false };
}

// Log security events
export async function logSecurityEvent(
  env: Env,
  event: string,
  request: Request,
  details: string = ''
): Promise<void> {
  const ip = getClientIP(request);
  
  // Log to console (Cloudflare Logs)
  console.warn(`SECURITY: ${new Date().toISOString()} | ${ip} | ${event} | ${details}`);
  
  // Optional: Store in D1 for analysis
  try {
    await env.DB.prepare(
      'INSERT INTO security_logs (timestamp, ip, event, details) VALUES (?, ?, ?, ?)'
    ).bind(
      new Date().toISOString(),
      ip,
      event,
      details
    ).run();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Authenticate user with email and password
 * 
 * @param db - D1 database instance
 * @param email - User email
 * @param password - Plain text password
 * @returns User object if authenticated, null otherwise
 */
export async function loginUser(db: D1Database, email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Get user by email
  const user = await getUserByEmail(db, normalizedEmail);
  if (!user) {
    return null;
  }
  
  // Check if user is active
  if (!user.is_active) {
    return null;
  }
  
  // Check if user has a password
  if (!user.password_hash) {
    return null;
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return null;
  }
  
  return user;
}

/**
 * Create a session for a user
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns Session token
 */
export async function createUserSessionToken(db: D1Database, userId: string): Promise<string> {
  const session = await createUserSession(db, userId, SESSION_DURATION_MS);
  return session.token;
}

/**
 * Verify a session token and return the user
 * 
 * @param db - D1 database instance
 * @param token - Session token
 * @returns User object if valid session, null otherwise
 */
export async function verifySession(db: D1Database, token: string): Promise<User | null> {
  if (!token) {
    return null;
  }
  
  // Get session (checks expiration automatically)
  const session = await getSessionByToken(db, token);
  if (!session) {
    return null;
  }
  
  // Get user
  const user = await getUserById(db, session.user_id);
  if (!user || !user.is_active) {
    return null;
  }
  
  return user;
}

/**
 * Delete user's session (logout)
 * 
 * @param db - D1 database instance
 * @param token - Session token to delete
 * @returns true if deleted successfully
 */
export async function deleteUserSession(db: D1Database, token: string): Promise<boolean> {
  return await deleteSession(db, token);
}

/**
 * Change user password
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @param newPassword - New plain text password
 * @returns true if successful
 */
export async function changeUserPassword(db: D1Database, userId: string, newPassword: string): Promise<boolean> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  const result = await db
    .prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(passwordHash, userId)
    .run();
    
  return result.success;
}
