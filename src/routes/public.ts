/**
 * Public Page Routes
 * 
 * This file contains all routes for public-facing pages on the website.
 * These routes are accessible without authentication.
 * 
 * Routes included:
 * - Home page (/)
 * - About pages (about, leadership, history, mission)
 * - Membership information pages
 * - Contact pages
 * - Public document downloads
 * 
 * @module routes/public
 */

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';

const publicRoutes = new Hono();

// TODO: Public routes will be extracted from src/index.ts and src/lib/pages.ts
// in Step 1.2 of the refactoring process

export default publicRoutes;
