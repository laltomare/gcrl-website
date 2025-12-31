/**
 * HTTP Security Headers and CORS Configuration
 * ==========================================
 * 
 * Purpose: Apply security headers to all HTTP responses and handle CORS
 * 
 * Security Headers Implemented:
 * - X-Frame-Options: DENY - Prevent clickjacking attacks
 * - X-Content-Type-Options: nosniff - Prevent MIME sniffing
 * - X-XSS-Protection: Enable browser XSS filter
 * - Referrer-Policy: Control referrer information leakage
 * - Content-Security-Policy: Restrict resource loading sources
 * - Strict-Transport-Security: Enforce HTTPS connections
 * 
 * CORS Policy:
 * - Allows requests from goldencompasses.org and subdomains
 * - Allows requests from Workers.dev testing domain
 * - Blocks all other cross-origin requests
 * 
 * Usage:
 * All responses should be wrapped with addSecurityHeaders()
 * before being returned to the client.
 * 
 * Example:
 * return addSecurityHeaders(new Response(html, {
 *   headers: { 'Content-Type': 'text/html' }
 * }));
 * 
 * Author: Lawrence Altomare
 * Created: December 2025
 */

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

// CORS configuration
const ALLOWED_ORIGINS = [
  'https://goldencompasses.org',
  'https://www.goldencompasses.org',
  'https://gcrl-website.lawrence-675.workers.dev',
];

export function handleCors(request: Request): Response | null {
  const origin = request.headers.get('Origin');
  
  // If no origin (same-origin) or allowed origin, continue
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    return null;
  }
  
  // Block disallowed origins
  return new Response('Origin not allowed', { status: 403 });
}
