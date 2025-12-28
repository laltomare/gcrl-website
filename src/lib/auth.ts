import { Env } from './types';

// Constants for password validation
const MIN_PASSWORD_LENGTH = 14;

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
