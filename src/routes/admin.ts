/**
 * Admin Routes
 * 
 * This file contains all routes for the admin panel and administrative functions.
 * These routes require authentication and proper authorization.
 * 
 * Routes included:
 * - Admin dashboard (/admin)
 * - Admin login (/admin/login)
 * - Event management (create, edit, copy, delete)
 * - Document management
 * - Membership request management
 * - 2FA setup
 * 
 * Security:
 * - All routes require authentication
 * - CSRF protection
 * - Audit logging
 * - Role-based access control
 * 
 * @module routes/admin
 */

import { Hono } from 'hono';

const adminRoutes = new Hono();

// TODO: Admin routes will be extracted from src/index.ts and src/lib/pages.ts
// in Step 1.4 of the refactoring process

export default adminRoutes;
