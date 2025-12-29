import { TOTP } from 'otpauth';

/**
 * Generate a TOTP secret for a user
 * @returns The secret key as base32 string
 */
export function generateTOTPSecret(): string {
  const totp = new TOTP({
    issuer: 'GoldenCompasses.org',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  return totp.secret.base32;
}

/**
 * Generate a QR code URI for TOTP setup
 * @param secret - The TOTP secret
 * @returns The otpauth:// URI for QR code generation
 */
export function generateTOTPURI(secret: string): string {
  const totp = new TOTP({
    issuer: 'GoldenCompasses.org',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  return totp.toString();
}

/**
 * Verify a TOTP code
 * @param secret - The TOTP secret
 * @param token - The 6-digit code to verify
 * @param window - Number of time windows to check (default: 2 = 1 minute before/after)
 * @returns True if valid, false otherwise
 */
export function verifyTOTP(secret: string, token: string, window: number = 2): boolean {
  const totp = new TOTP({
    issuer: 'GoldenCompasses.org',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  // Validate the token (returns { delta: number } or null)
  // Delta is the number of steps away from current time
  // Window of 2 allows 1 minute before and after
  const result = totp.validate({ token: token, window: window });
  
  return result !== null;
}

/**
 * Generate backup codes for account recovery
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup code strings
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random 8-character alphanumeric codes
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars (0O1I)
    let code = '';
    
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    codes.push(code);
  }
  
  return codes;
}

/**
 * Format a backup code with dashes for readability
 * @param code - The backup code
 * @returns Formatted code (e.g., "ABCD-1234")
 */
export function formatBackupCode(code: string): string {
  return code.substring(0, 4) + '-' + code.substring(4);
}

/**
 * Validate a backup code
 * @param code - The code to validate
 * @returns True if valid format
 */
export function isValidBackupCode(code: string): boolean {
  // Remove spaces and dashes
  const cleaned = code.replace(/[\s-]/g, '').toUpperCase();
  
  // Check length and character set
  return /^[A-Z0-9]{8}$/.test(cleaned);
}
