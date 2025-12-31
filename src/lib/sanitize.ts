/**
 * Input Sanitization and XSS Prevention
 * =====================================
 * 
 * Purpose: Clean and validate user input to prevent security vulnerabilities
 * 
 * Security Threats Prevented:
 * - XSS (Cross-Site Scripting): HTML/JavaScript injection attacks
 * - Path Traversal: Directory traversal via filenames
 * - DoS (Denial of Service): Excessively long input strings
 * - Null Byte Injection: C string termination attacks
 * 
 * Functions:
 * - escapeHtml(): Convert dangerous HTML characters to entities
 * - sanitizeInput(): Clean user text input for database storage
 * - sanitizeFilename(): Validate filenames for R2 storage
 * - isValidUUID(): Validate UUID format for document IDs
 * 
 * Usage:
 * ALWAYS sanitize user input before:
 * - Storing in database
 * - Displaying in HTML
 * - Using in file operations
 * - Including in SQL queries
 * 
 * Example:
 * const cleanName = sanitizeInput(request.name);
 * const safeFilename = sanitizeFilename(upload.file.name);
 * 
 * Author: Lawrence Altomare
 * Created: December 2025
 */

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
