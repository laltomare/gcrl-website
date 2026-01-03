/**
 * Download Routes
 * 
 * This file contains all routes for file downloads and document serving.
 * These routes handle secure file delivery to users.
 * 
 * Routes included:
 * - Public document downloads
 * - Authenticated document downloads
 * - File serving with proper headers
 * - Download tracking and logging
 * 
 * Security:
 * - Path traversal protection
 * - Access control for sensitive documents
 * - Rate limiting on downloads
 * - Audit logging
 * 
 * @module routes/download
 */

import { Hono } from 'hono';

const downloadRoutes = new Hono();

// TODO: Download routes will be extracted from src/index.ts
// in Step 1.5 of the refactoring process

export default downloadRoutes;
