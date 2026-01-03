/**
 * Public Page Routes
 * 
 * This file contains all routes for public-facing pages on the website.
 * These routes are accessible without authentication.
 * 
 * Routes included:
 * - Home page (/)
 * - About page (/about)
 * - Library pages (/library, /library/:id)
 * - Links page (/links)
 * - Contact page (/contact)
 * - Join page (/join)
 * - Thank You page (/thank-you)
 * 
 * @module routes/public
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { addSecurityHeaders } from '../lib/headers';
import { HTML, HomePage, AboutPage, LibraryPage, DocumentDetailPage, LinksPage, ContactPage, JoinPage, ThankYouPage } from '../lib/pages';

const publicRoutes = new Hono<{ Bindings: Env }>();

/**
 * Home page route
 * GET / - Landing page with hero and events
 */
publicRoutes.get('/', async (c) => {
  return addSecurityHeaders(HTML`${HomePage()}`);
});

/**
 * Home page (alternate)
 * GET /home - Same as home page
 */
publicRoutes.get('/home', async (c) => {
  return addSecurityHeaders(HTML`${HomePage()}`);
});

/**
 * About page route
 * GET /about - Lodge information and purpose
 */
publicRoutes.get('/about', async (c) => {
  return addSecurityHeaders(HTML`${AboutPage()}`);
});

/**
 * Library page route
 * GET /library - Public catalog of research papers
 */
publicRoutes.get('/library', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM documents ORDER BY upload_date DESC'
  ).all();
  
  return addSecurityHeaders(HTML`${LibraryPage(results)}`);
});

/**
 * Library document detail page
 * GET /library/:id - Individual document view
 */
publicRoutes.get('/library/:id', async (c) => {
  const documentId = c.req.param('id');
  
  const doc = await c.env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(documentId).first();
  
  if (!doc) {
    return addSecurityHeaders(new Response('Document not found', { status: 404 }));
  }
  
  return addSecurityHeaders(HTML`${DocumentDetailPage(doc)}`);
});

/**
 * Library document download (password required)
 * POST /library/:id/download - Download PDF with password verification
 */
publicRoutes.post('/library/:id/download', async (c) => {
  const documentId = c.req.param('id');
  const formData = await c.req.formData();
  const password = formData.get('password') as string;
  
  // Verify library password
  if (password !== c.env.LIBRARY_PASSWORD) {
    const doc = await c.env.DB.prepare(
      'SELECT * FROM documents WHERE id = ?'
    ).bind(documentId).first();
    
    if (doc) {
      return addSecurityHeaders(HTML`${DocumentDetailPage(doc, 'Incorrect password. Please try again.')}`);
    }
    return addSecurityHeaders(new Response('Unauthorized', { status: 401 }));
  }
  
  // Fetch document from database
  const doc = await c.env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(documentId).first();
  
  if (!doc) {
    return addSecurityHeaders(new Response('Document not found', { status: 404 }));
  }
  
  // Fetch file from R2
  const object = await c.env.R2.get(doc.filename as string);
  if (!object) {
    return addSecurityHeaders(new Response('File not found', { status: 404 }));
  }
  
  // Return PDF file
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.title}.pdf"`
    }
  });
});

/**
 * Links page route
 * GET /links - Masonic resources and research lodges
 */
publicRoutes.get('/links', async (c) => {
  return addSecurityHeaders(HTML`${LinksPage()}`);
});

/**
 * Contact page route
 * GET /contact - Contact form and meeting information
 */
publicRoutes.get('/contact', async (c) => {
  return addSecurityHeaders(HTML`${ContactPage()}`);
});

/**
 * Join page route
 * GET /join - Membership request form
 */
publicRoutes.get('/join', async (c) => {
  return addSecurityHeaders(HTML`${JoinPage()}`);
});

/**
 * Thank You page route
 * GET /thank-you?type=contact|join - Form submission confirmation
 */
publicRoutes.get('/thank-you', async (c) => {
  const type = c.req.query('type');
  if (type === 'contact' || type === 'join') {
    return addSecurityHeaders(HTML`${ThankYouPage(type as 'contact' | 'join')}`);
  }
  // Default to contact page if no type specified
  return addSecurityHeaders(HTML`${ThankYouPage('contact')}`);
});

export default publicRoutes;
