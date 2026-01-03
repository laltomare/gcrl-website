/**
 * Download Routes
 * Document download endpoints for member access
 * 
 * These routes handle authenticated document downloads from R2 storage.
 * Downloads require valid membership credentials via Bearer token.
 * 
 * Security Features:
 * - Rate limiting: 10 attempts per hour per IP
 * - Authentication required (Bearer token with valid credentials)
 * - Audit logging for all download attempts
 * - Document existence validation in both D1 database and R2 storage
 * 
 * Download Flow:
 * 1. Client requests /download/:documentId with Authorization header
 * 2. Server validates rate limits
 * 3. Server verifies authentication token
 * 4. Server fetches document metadata from D1
 * 5. Server fetches file from R2 storage
 * 6. Server logs successful download
 * 7. Server returns PDF file with proper headers
 * 
 * Error Responses:
 * - 429: Too many download attempts (rate limited)
 * - 401: Unauthorized (missing or invalid credentials)
 * - 404: Document not found (in database or R2)
 * 
 * @module routes/download
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { getClientIP, checkRateLimit, verifyToken, logSecurityEvent } from '../lib/auth';

const downloadRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /download/:documentId
 * Download a document by ID
 * 
 * @route GET /download/:documentId
 * @access Private (requires valid membership credentials)
 * @rateLimit 10 requests per hour per IP
 * 
 * @param {string} documentId - UUID of the document to download
 * @header {string} Authorization - Bearer token with membership credentials
 * 
 * @returns {File} PDF file as attachment
 * @returns {Object} error - Error object if download fails
 * 
 * @example
 * // Successful download
 * GET /download/abc-123-def
 * Authorization: Bearer <membership_token>
 * 
 * // Response: PDF file
 * Content-Type: application/pdf
 * Content-Disposition: attachment; filename="document.pdf"
 * 
 * @example
 * // Rate limited
 * GET /download/abc-123-def
 * 
 * // Response (429):
 * {
 *   "error": "Too many download attempts. Please try again later."
 * }
 * 
 * @example
 * // Unauthorized
 * GET /download/abc-123-def
 * Authorization: Bearer invalid_token
 * 
 * // Response (401):
 * {
 *   "error": "Invalid credentials",
 *   "message": "Please contact the lodge secretary for access"
 * }
 * 
 * @example
 * // Not found
 * GET /download/nonexistent-id
 * Authorization: Bearer <valid_token>
 * 
 * // Response (404):
 * {
 *   "error": "Document not found"
 * }
 */
downloadRoutes.get('/:documentId', async (c) => {
  const env = c.env;
  const request = c.req.raw;
  const documentId = c.req.param('documentId');
  const ip = getClientIP(request);

  // Rate limiting: 10 attempts per hour
  if (!checkRateLimit(ip, 10, 3600000)) {
    await logSecurityEvent(env, 'DOWNLOAD_RATE_LIMIT', request, `Document: ${documentId}`);
    return c.json({ 
      error: 'Too many download attempts. Please try again later.' 
    }, 429);
  }

  // Check authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return c.json({ 
      error: 'Membership required',
      message: 'Full access available to members only',
      loginUrl: '/join'
    }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const verification = verifyToken(token, env, false);

  if (!verification.valid) {
    await logSecurityEvent(env, 'DOWNLOAD_UNAUTHORIZED', request, `Document: ${documentId}`);
    return c.json({ 
      error: 'Invalid credentials',
      message: 'Please contact the lodge secretary for access'
    }, 401);
  }

  // Fetch document metadata from database
  const doc = await env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(documentId).first();

  if (!doc) {
    return c.json({ error: 'Document not found' }, 404);
  }

  // Fetch file from R2 storage
  const object = await env.R2.get(doc.filename as string);
  if (!object) {
    return c.json({ error: 'File not found in storage' }, 404);
  }

  // Log successful download
  await logSecurityEvent(env, 'DOCUMENT_DOWNLOAD', request, `Document: ${doc.title}`);

  // Return PDF file with proper headers
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.filename}"`
    }
  });
});

/**
 * Alternative Download Routes
 * 
 * Note: There are two document download mechanisms in the system:
 * 
 * 1. /download/:id - Member download (this file)
 *    - Requires membership credentials
 *    - For authenticated members
 *    - Tracks download attempts
 * 
 * 2. /library/:id/download - Public download with password
 *    - Requires LIBRARY_PASSWORD
 *    - For public access with password
 *    - Rate limited to 10 attempts per hour
 *    - Implemented in src/index.ts (main route handler)
 * 
 * The public library download is handled separately because it:
 * - Uses password-based authentication instead of token-based
 * - Returns HTML error pages (not JSON)
 * - Has different rate limiting rules
 * - Integrates with the library detail page
 */

export default downloadRoutes;
