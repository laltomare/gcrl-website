/**
 * Golden Compasses Research Lodge - Main Entry Point
 * ================================================
 * 
 * Purpose: Cloudflare Workers request router for the GCRL website
 * 
 * Architecture Overview:
 * - Routes incoming HTTP requests to appropriate handlers
 * - Serves static assets from Cloudflare R2 storage
 * - Manages authentication (admin password + TOTP 2FA)
 * - Handles document upload/download with security controls
 * - Processes form submissions (contact, membership requests)
 * - Implements rate limiting and security logging
 * 
 * Technology Stack:
 * - Runtime: Cloudflare Workers (serverless edge computing)
 * - Database: Cloudflare D1 (SQLite)
 * - Storage: Cloudflare R2 (object storage)
 * - Language: TypeScript
 * 
 * Security Features:
 * - Rate limiting (5 attempts per 15 minutes for sensitive operations)
 * - Input sanitization (XSS prevention)
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - Two-factor authentication (TOTP) for admin access
 * - Audit logging for all security events
 * 
 * File Organization:
 * - /styles.css - Main stylesheet
 * - /logo.png, /hero.jpg, /background.jpg - Static images
 * - /manifest.json, /sw.js, /icon-*.png - PWA assets (deferred)
 * - /api/* - API endpoints (forms, downloads)
 * - /admin/* - Admin dashboard routes
 * - /* - Public pages (Home, About, Library, Links, Contact, Join)
 * 
 * Author: Lawrence Altomare
 * Created: December 2025
 * Last Modified: December 31, 2025 (v19 - Navigation fix)
 * 
 * @see https://developers.cloudflare.com/workers/
 */

import { Env } from './types';
import { HTML } from './lib/pages';
import { HomePage, AboutPage, LibraryPage, DocumentDetailPage, LinksPage, ContactPage, JoinPage, ThankYouPage } from './lib/pages/index';
import { AdminLoginPage, AdminDashboardPage, TwoFactorPage, TwoFactorSetupPage } from './lib/pages';
import { addSecurityHeaders, addDevModeHeaders, handleCors } from './lib/headers';
import { getClientIP, checkRateLimit, verifyToken, logSecurityEvent } from './lib/auth';
import { sanitizeInput } from './lib/sanitize';
import { generateTOTPSecret, generateTOTPURI, verifyTOTP, generateBackupCodes, isValidBackupCode, formatBackupCode } from './lib/totp';
import publicRoutes from './routes/public';
import apiRoutes from './routes/api';
import adminRoutes from './routes/admin';
import downloadRoutes from './routes/download';
import * as userRoutes from './routes/users';

// Email sending function using Resend
async function sendEmail(env: Env, to: string, subject: string, content: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Golden Compasses Research Lodge <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        text: content,
      }),
    });

    if (response.ok) {
      console.log(`Email sent successfully to ${to}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Failed to send email to ${to}: ${response.status} ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Handle CORS
      const corsResponse = handleCors(request);
      if (corsResponse) return corsResponse;

      const url = new URL(request.url);
      const path = url.pathname;

      // Serve static assets
      if (path === '/styles.css') {
        const css = await env.R2.get('styles.css');
        if (css) {
          return addSecurityHeaders(new Response(css.body, {
            headers: { 'Content-Type': 'text/css' }
          }));
        }
      }

      if (path === '/logo.png' || path === '/hero.jpg' || path === '/background.jpg') {
        const asset = await env.R2.get(path.substring(1));
        if (asset) {
          const contentType = path.endsWith('.png') ? 'image/png' : 'image/jpeg';
          return addSecurityHeaders(new Response(asset.body, {
            headers: { 'Content-Type': contentType }
          }));
        }
      }

      // Serve PWA manifest
      if (path === '/manifest.json') {
        const manifest = await env.R2.get('manifest.json');
        if (manifest) {
          return new Response(manifest.body, {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Serve service worker
      if (path === '/sw.js') {
        const sw = await env.R2.get('sw.js');
        if (sw) {
          return new Response(sw.body, {
            headers: { 
              'Content-Type': 'application/javascript',
              'Service-Worker-Allowed': '/'
            }
          });
        }
      }

      // Serve PWA icons
      if (path === '/icon-192.png' || path === '/icon-512.png') {
        const icon = await env.R2.get(path.substring(1));
        if (icon) {
          return new Response(icon.body, {
            headers: { 'Content-Type': 'image/png' }
          });
        }
      }

      // API Routes
      if (path.startsWith('/api/')) {
        return handleApiRoute(request, env, url);
      }

      // Admin Routes
      if (path.startsWith('/admin')) {
        return handleAdminRoute(request, env, url, path);
      }

      // Document download (password required)
      if (path.startsWith('/download/')) {
        return handleDownload(request, env, path);
      }

      // Public Pages
      if (path === '/' || path === '/home') {
        return addSecurityHeaders(HTML`${HomePage()}`);
      }

      if (path === '/about') {
        return addSecurityHeaders(HTML`${AboutPage()}`);
      }

      if (path === '/library') {
        // Fetch documents for public viewing
        const { results } = await env.DB.prepare(
          'SELECT * FROM documents ORDER BY upload_date DESC'
        ).all();
        
        return addSecurityHeaders(HTML`${LibraryPage(results)}`);
      }

      // Library document detail page
      if (path.startsWith('/library/') && !path.endsWith('/download')) {
        const documentId = path.split('/')[2];
        
        // Fetch document from database
        const doc = await env.DB.prepare(
          'SELECT * FROM documents WHERE id = ?'
        ).bind(documentId).first();
        
        if (!doc) {
          return addSecurityHeaders(new Response('Document not found', { status: 404 }));
        }
        
        return addSecurityHeaders(HTML`${DocumentDetailPage(doc)}`);
      }

      // Library document download (password required via POST)
      if (path.startsWith('/library/') && path.endsWith('/download') && request.method === 'POST') {
        const documentId = path.split('/')[2];
        const ip = getClientIP(request);
        
        // Rate limiting
        if (!checkRateLimit(ip, 10, 3600000)) {
          await logSecurityEvent(env, 'DOWNLOAD_RATE_LIMIT', request, `Document: ${documentId}`);
          // Show error on detail page
          const doc = await env.DB.prepare(
            'SELECT * FROM documents WHERE id = ?'
          ).bind(documentId).first();
          if (doc) {
            return addSecurityHeaders(HTML`${DocumentDetailPage(doc, 'Too many download attempts. Please try again later.')}`);
          }
          return addSecurityHeaders(new Response('Too many attempts', { status: 429 }));
        }
        
        // Get password from form
        const formData = await request.formData();
        const password = formData.get('password') as string;
        
        // Verify library password
        if (password !== env.LIBRARY_PASSWORD) {
          await logSecurityEvent(env, 'LIBRARY_PASSWORD_FAILED', request, `Document: ${documentId}`);
          // Show error on detail page
          const doc = await env.DB.prepare(
            'SELECT * FROM documents WHERE id = ?'
          ).bind(documentId).first();
          if (doc) {
            return addSecurityHeaders(HTML`${DocumentDetailPage(doc, 'Incorrect password. Please try again.')}`);
          }
          return addSecurityHeaders(new Response('Unauthorized', { status: 401 }));
        }
        
        // Fetch document from database
        const doc = await env.DB.prepare(
          'SELECT * FROM documents WHERE id = ?'
        ).bind(documentId).first();
        
        if (!doc) {
          return addSecurityHeaders(new Response('Document not found', { status: 404 }));
        }
        
        // Fetch file from R2
        const object = await env.R2.get(doc.filename as string);
        if (!object) {
          return addSecurityHeaders(new Response('File not found', { status: 404 }));
        }
        
        await logSecurityEvent(env, 'DOCUMENT_DOWNLOAD', request, `Document: ${doc.title}`);
        
        // Return PDF file
        return new Response(object.body, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${doc.title}.pdf"`
          }
        });
      }

      if (path === '/links') {
        return addSecurityHeaders(HTML`${LinksPage()}`);
      }

      if (path === '/contact') {
        return addSecurityHeaders(HTML`${ContactPage()}`);
      }

      if (path === '/join') {
        return addSecurityHeaders(HTML`${JoinPage()}`);
      }

      // Thank You page for form submissions
      if (path === '/thank-you') {
        const type = url.searchParams.get('type');
        if (type === 'contact' || type === 'join') {
          return addSecurityHeaders(HTML`${ThankYouPage(type as 'contact' | 'join')}`);
        }
        // Default to contact page if no type specified
        return addSecurityHeaders(HTML`${ThankYouPage('contact')}`);
      }

      // 404 Not Found
      return addSecurityHeaders(new Response('Not Found', { status: 404 }));

    } catch (error) {
      console.error('Error handling request:', error);
      return addSecurityHeaders(new Response('Internal Server Error', { status: 500 }));
    }
  }
};

// Handle API routes
async function handleApiRoute(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  const ip = getClientIP(request);

  if (path === '/api/contact' && request.method === 'POST') {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      await logSecurityEvent(env, 'RATE_LIMIT_EXCEEDED', request, 'Contact form');
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      const name = sanitizeInput(data.name || '');
      const email = sanitizeInput(data.email || '');
      const subject = sanitizeInput(data.subject || '');
      const message = sanitizeInput(data.message || '');

      if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Store in database
      await env.DB.prepare(
        'INSERT INTO membership_requests (name, email, phone, message, submitted_date, status) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(name, email, subject, message, new Date().toISOString(), 'contact').run();

      await logSecurityEvent(env, 'CONTACT_SUBMISSION', request, `From: ${name} (${email})`);

      // Send email notification
      const emailContent = `You have received a new contact form submission from the Golden Compasses website.

CONTACT INFORMATION:
---------------------
Name: ${name}
Email: ${email}
Subject: ${subject}

MESSAGE:
--------
${message}

SUBMITTED: ${new Date().toLocaleString()}

---
View this submission in the admin dashboard: ${env.SITE_URL}/admin`;

      await sendEmail(env, env.SECRETARY_EMAIL, '🔔 New Contact Form Submission - Golden Compasses Lodge', emailContent);

      return new Response(JSON.stringify({ success: true, redirect: '/thank-you?type=contact' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Contact form error:', error);
      return new Response(JSON.stringify({ error: 'Invalid request', details: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (path === '/api/join' && request.method === 'POST') {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      await logSecurityEvent(env, 'RATE_LIMIT_EXCEEDED', request, 'Membership request');
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      const name = sanitizeInput(data.name || '');
      const email = sanitizeInput(data.email || '');
      const phone = sanitizeInput(data.phone || '');
      const interests = sanitizeInput(data.interests || '');
      const message = sanitizeInput(data.message || '');

      if (!name || !email) {
        return new Response(JSON.stringify({ error: 'Name and email are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Store in database
      await env.DB.prepare(
        'INSERT INTO membership_requests (name, email, phone, message, submitted_date, status) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(name, email, phone, `${interests}\n\n${message}`, new Date().toISOString(), 'pending').run();

      await logSecurityEvent(env, 'MEMBERSHIP_REQUEST', request, `From: ${name} (${email})`);

      // Send email notification
      const emailContent = `You have received a new membership request from the Golden Compasses website.

CONTACT INFORMATION:
---------------------
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}

AREAS OF INTEREST:
------------------
${interests || 'Not specified'}

ADDITIONAL MESSAGE:
-------------------
${message || 'No additional message provided.'}

SUBMITTED: ${new Date().toLocaleString()}

---
View this submission in the admin dashboard: ${env.SITE_URL}/admin`;

      await sendEmail(env, env.SECRETARY_EMAIL, '🎉 New Membership Request - Golden Compasses Lodge', emailContent);

      return new Response(JSON.stringify({ 
        success: true, 
        redirect: '/thank-you?type=join'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  // Get upcoming events (GET /api/events)
  if (path === '/api/events' && request.method === 'GET') {
    try {
      const events = await env.DB.prepare(`
        SELECT * FROM events 
        WHERE event_date >= DATE('now')
          AND is_published = 1
        ORDER BY event_date ASC
        LIMIT 3
      `).all();

      return new Response(JSON.stringify(events.results || []), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }



  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle admin routes
async function handleAdminRoute(
  request: Request, 
  env: Env, 
  url: URL, 
  path: string
): Promise<Response> {
  const ip = getClientIP(request);

  // Admin login page
  if (path === '/admin/login' && request.method === 'GET') {
    return addSecurityHeaders(HTML`${AdminLoginPage()}`);
  }

  // Admin login with email and password
  if (path === '/admin/login' && request.method === 'POST') {
    if (!checkRateLimit(ip, 5, 900000)) {
      await logSecurityEvent(env, 'ADMIN_RATE_LIMIT', request, 'Multiple failed login attempts');
      return new Response(JSON.stringify({ error: 'Too many attempts. Please wait 15 minutes.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      let body;
      try {
        body = await request.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const { email, password } = body;
      
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Import authentication functions
      const { loginUser, createUserSessionToken } = await import('./lib/auth');
      const user = await loginUser(env.DB, email, password);

      if (user) {
        // Check if user has admin role
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          await logSecurityEvent(env, 'ADMIN_LOGIN_UNAUTHORIZED', request, `User: ${email}`);
          return new Response(JSON.stringify({ error: 'Access denied. Admin access required.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Create session token
        const token = await createUserSessionToken(env.DB, user.id);

        await logSecurityEvent(env, 'ADMIN_LOGIN_SUCCESS', request, `User: ${email}`);

        // Check if 2FA is enabled
        const twoFAConfig = await env.DB.prepare(
          'SELECT * FROM admin_2fa WHERE id = 1'
        ).first();

        if (twoFAConfig && twoFAConfig.totp_enabled === 1) {
          // 2FA is enabled, require verification
          return new Response(JSON.stringify({ 
            require2FA: true,
            message: 'Two-factor authentication required'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // 2FA not enabled, return token and user info
        return new Response(JSON.stringify({ 
          success: true,
          token: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await logSecurityEvent(env, 'ADMIN_LOGIN_FAILED', request, `Email: ${email}`);
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({ error: 'Login failed. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Two-factor authentication page
  if (path === '/admin/2fa' && request.method === 'GET') {
    return addSecurityHeaders(HTML`${TwoFactorPage()}`);
  }

  // Setup 2FA page
  if (path === '/admin/setup-2fa-page' && request.method === 'GET') {
    // This will be called from the dashboard after login
    return addSecurityHeaders(new Response('Use /admin/setup-2fa API endpoint', { status: 200 }));
  }

  // Upload document (admin only)
  if (path === '/admin/documents' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;

      if (!file || !title) {
        return new Response(JSON.stringify({ error: 'File and title are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate unique ID and filename
      const docId = crypto.randomUUID();
      const filename = `${docId}.pdf`;

      // Upload file to R2
      await env.R2.put(filename, file.stream(), {
        httpMetadata: {
          contentType: 'application/pdf'
        }
      });

      // Save metadata to D1
      await env.DB.prepare(
        'INSERT INTO documents (id, title, description, category, filename, file_size, upload_date, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        docId,
        sanitizeInput(title),
        sanitizeInput(description || ''),
        sanitizeInput(category || ''),
        filename,
        file.size,
        new Date().toISOString(),
        'admin'
      ).run();

      await logSecurityEvent(env, 'DOCUMENT_UPLOAD', request, `Document: ${title}`);

      return new Response(JSON.stringify({ success: true, documentId: docId }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Upload error:', error);
      return new Response(JSON.stringify({ error: 'Upload failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Delete document (admin only)
  if (path.startsWith('/admin/documents/') && request.method === 'DELETE') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const documentId = path.split('/').pop();

    try {
      // Get document info
      const doc = await env.DB.prepare(
        'SELECT * FROM documents WHERE id = ?'
      ).bind(documentId).first();

      if (!doc) {
        return new Response(JSON.stringify({ error: 'Document not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Delete from R2
      await env.R2.delete(doc.filename as string);

      // Delete from D1
      await env.DB.prepare(
        'DELETE FROM documents WHERE id = ?'
      ).bind(documentId).run();

      await logSecurityEvent(env, 'DOCUMENT_DELETE', request, `Document: ${doc.title}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Delete failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Admin dashboard (requires authentication)
  // 
  // FIXED: January 2, 2026 - Root cause analysis completed
  // Previous bug: This route was returning TwoFactorSetupPage() instead of AdminDashboardPage()
  // The admin dashboard function was accidentally deleted in commit e7c45cc
  // Now restored with proper authentication check
  if (path === '/admin' && request.method === 'GET') {
    // Use dev mode headers if DEV_MODE is enabled, otherwise use standard headers
    const baseResponse = HTML`${AdminDashboardPage()}`;
    return env.DEV_MODE === 'true' 
      ? addDevModeHeaders(baseResponse)
      : addSecurityHeaders(baseResponse);
  }

  // Admin API endpoint for dashboard data
  if (path === '/admin/api/data' && request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch documents and membership requests
    const { results: documents } = await env.DB.prepare(
      'SELECT * FROM documents ORDER BY upload_date DESC'
    ).all();

    const { results: requests } = await env.DB.prepare(
      'SELECT * FROM membership_requests ORDER BY submitted_date DESC LIMIT 20'
    ).all();

    return new Response(JSON.stringify({ documents, requests }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Setup 2FA - Generate QR code and backup codes
  if (path === '/admin/setup-2fa' && request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if 2FA is already enabled
    const existingConfig = await env.DB.prepare(
      'SELECT * FROM admin_2fa WHERE id = 1'
    ).first();

    if (existingConfig && existingConfig.totp_enabled === 1) {
      return new Response(JSON.stringify({ error: '2FA is already enabled' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate TOTP secret and backup codes
    const secret = generateTOTPSecret();
    const backupCodes = generateBackupCodes(10);
    const totpUri = generateTOTPURI(secret);

    // Generate QR code as data URL
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(totpUri);

    return new Response(JSON.stringify({ 
      secret, 
      backupCodes, 
      qrCodeUrl,
      totpUri 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check 2FA status
  if (path === '/admin/2fa-status' && request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const config = await env.DB.prepare(
      'SELECT totp_enabled FROM admin_2fa WHERE id = 1'
    ).first();

    return new Response(JSON.stringify({ 
      enabled: config && config.totp_enabled === 1 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Disable 2FA
  if (path === '/admin/disable-2fa' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(
      'UPDATE admin_2fa SET totp_enabled = 0 WHERE id = 1'
    ).run();

    await logSecurityEvent(env, '2FA_DISABLED', request);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Enable 2FA - Verify TOTP code and save to database
  if (path === '/admin/enable-2fa' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const { secret, code, backupCodes } = body;

      if (!secret || !code || !backupCodes) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify TOTP code
      if (!verifyTOTP(secret, code)) {
        await logSecurityEvent(env, '2FA_SETUP_FAILED', request, 'Invalid TOTP code');
        return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Save to database
      await env.DB.prepare(
        'INSERT OR REPLACE INTO admin_2fa (id, totp_secret, totp_enabled, backup_codes, setup_date) VALUES (1, ?, 1, ?, ?)'
      ).bind(
        secret,
        JSON.stringify(backupCodes),
        new Date().toISOString()
      ).run();

      await logSecurityEvent(env, '2FA_ENABLED', request);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Verify session token for dashboard
  if (path === '/admin/verify-session' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No token provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Import verifySession function
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);

    if (user) {
      return new Response(JSON.stringify({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Verify 2FA during login
  if (path === '/admin/verify-2fa' && request.method === 'POST') {
    if (!checkRateLimit(ip, 5, 900000)) {
      await logSecurityEvent(env, '2FA_RATE_LIMIT', request);
      return new Response(JSON.stringify({ error: 'Too many attempts. Please wait 15 minutes.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const { code, backup_code } = body;

      // Get 2FA configuration
      const config = await env.DB.prepare(
        'SELECT * FROM admin_2fa WHERE id = 1'
      ).first();

      if (!config || !config.totp_enabled) {
        return new Response(JSON.stringify({ error: '2FA not configured' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let verified = false;
      let usedBackup = false;

      // Check TOTP code
      if (code && verifyTOTP(config.totp_secret as string, code)) {
        verified = true;
      }
      // Check backup code
      else if (backup_code) {
        const backupCodes = JSON.parse(config.backup_codes as string);
        const cleanedCode = backup_code.replace(/[\s-]/g, '').toUpperCase();
        
        if (backupCodes.includes(cleanedCode)) {
          verified = true;
          usedBackup = true;
          
          // Remove used backup code
          const remainingCodes = backupCodes.filter((c: string) => c !== cleanedCode);
          await env.DB.prepare(
            'UPDATE admin_2fa SET backup_codes = ? WHERE id = 1'
          ).bind(JSON.stringify(remainingCodes)).run();
        }
      }

      if (verified) {
        await logSecurityEvent(env, '2FA_VERIFY_SUCCESS', request, usedBackup ? 'Backup code used' : 'TOTP used');
        
        // Return success token
        return new Response(JSON.stringify({ 
          success: true,
          token: env.ADMIN_PASSWORD
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await logSecurityEvent(env, '2FA_VERIFY_FAILED', request);
        return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  // ========================================
  // ADMIN API: Event Management
  // ========================================
  
  // Get all events (GET /admin/api/events)
  if (path === '/admin/api/events' && request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const events = await env.DB.prepare(`
        SELECT * FROM events 
        WHERE event_date >= DATE('now', '-12 months')
        ORDER BY event_date DESC
      `).all();

      return new Response(JSON.stringify(events.results || []), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Create event (POST /admin/api/events)
  if (path === '/admin/api/events' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      const { title, description, event_date, start_time, end_time, location, event_url, is_published } = data;

      if (!title || !event_date || !start_time || !location) {
        return new Response(JSON.stringify({ error: 'Title, date, start time, and location are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const endTimeValue = end_time && end_time.trim() !== '' ? end_time : null;
      const eventUrlValue = event_url && event_url.trim() !== '' ? event_url : null;

      const result = await env.DB.prepare(`
        INSERT INTO events (title, description, event_date, start_time, end_time, location, event_url, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        title,
        description || '',
        event_date,
        start_time,
        endTimeValue,
        location,
        eventUrlValue,
        is_published ? 1 : 0
      ).run();

      await logSecurityEvent(env, 'EVENT_CREATE', request, `Event: ${title}`);

      return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to create event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Update event (PATCH /admin/api/events/{id})
  if (path.startsWith('/admin/api/events/') && request.method === 'PATCH') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const eventId = path.split('/').pop();
      const data = await request.json();
      const { title, description, event_date, start_time, end_time, location, event_url, is_published } = data;

      if (!title || !event_date || !start_time || !location) {
        return new Response(JSON.stringify({ error: 'Title, date, start time, and location are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const endTimeValue = end_time && end_time.trim() !== '' ? end_time : null;
      const eventUrlValue = event_url && event_url.trim() !== '' ? event_url : null;

      await env.DB.prepare(`
        UPDATE events 
        SET title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, location = ?, event_url = ?, is_published = ?
        WHERE id = ?
      `).bind(
        title,
        description || '',
        event_date,
        start_time,
        endTimeValue,
        location,
        eventUrlValue,
        is_published ? 1 : 0,
        eventId
      ).run();

      await logSecurityEvent(env, 'EVENT_UPDATE', request, `Event: ${title}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to update event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Delete event (DELETE /admin/api/events/{id})
  if (path.startsWith('/admin/api/events/') && request.method === 'DELETE') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const eventId = path.split('/').pop();
      const event = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).first();

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();
      await logSecurityEvent(env, 'EVENT_DELETE', request, `Event: ${event.title}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to delete event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Copy event (POST /admin/api/events/{id}/copy)
  if (path.startsWith('/admin/api/events/') && path.endsWith('/copy') && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifySession } = await import('./lib/auth');
    const user = await verifySession(env.DB, token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const eventId = path.split('/')[4];
      const originalEvent = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).first();

      if (!originalEvent) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await env.DB.prepare(`
        INSERT INTO events (title, description, event_date, start_time, end_time, location, event_url, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        (originalEvent.title as string) + ' (Copy)',
        originalEvent.description,
        originalEvent.event_date,
        originalEvent.start_time,
        originalEvent.end_time,
        originalEvent.location,
        originalEvent.event_url,
        0
      ).run();

      await logSecurityEvent(env, 'EVENT_COPY', request, `Copied: ${originalEvent.title}`);

      return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to copy event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ========================================
  // USER MANAGEMENT ROUTES
  // ========================================

  // List users (GET /admin/users)
  if (path === '/admin/users' && request.method === 'GET') {
    return await userRoutes.handleUsersList(request, env);
  }

  // User detail page (GET /admin/users/:id)
  if (path.startsWith('/admin/users/') && path.match(/^\/admin\/users\/[^/]+$/) && request.method === 'GET') {
    const userId = path.split('/').pop();
    return await userRoutes.handleUserDetail(request, env, userId!);
  }

  // Create user form (GET /admin/users/new)
  if (path === '/admin/users/new' && request.method === 'GET') {
    return await userRoutes.handleCreateUserForm();
  }

  // Create user (POST /admin/users)
  if (path === '/admin/users' && request.method === 'POST') {
    return await userRoutes.handleCreateUser(request, env);
  }

  // Edit user form (GET /admin/users/:id/edit)
  if (path.startsWith('/admin/users/') && path.endsWith('/edit') && request.method === 'GET') {
    const userId = path.split('/')[3];
    return await userRoutes.handleEditUserForm(request, env, userId);
  }

  // Update user (POST /admin/users/:id)
  if (path.startsWith('/admin/users/') && !path.includes('/edit') && !path.includes('/delete') && !path.includes('/activate') && !path.includes('/deactivate') && !path.includes('/sessions') && request.method === 'POST') {
    const userId = path.split('/').pop();
    return await userRoutes.handleUpdateUser(request, env, userId!);
  }

  // Delete user (POST /admin/users/:id/delete)
  if (path.startsWith('/admin/users/') && path.endsWith('/delete') && request.method === 'POST') {
    const userId = path.split('/')[3];
    return await userRoutes.handleDeleteUser(request, env, userId);
  }

  // Activate user (POST /admin/users/:id/activate)
  if (path.startsWith('/admin/users/') && path.endsWith('/activate') && request.method === 'POST') {
    const userId = path.split('/')[3];
    return await userRoutes.handleActivateUser(request, env, userId);
  }

  // Deactivate user (POST /admin/users/:id/deactivate)
  if (path.startsWith('/admin/users/') && path.endsWith('/deactivate') && request.method === 'POST') {
    const userId = path.split('/')[3];
    return await userRoutes.handleDeactivateUser(request, env, userId);
  }

  // Revoke session (POST /admin/users/:id/sessions/:sessionId/delete)
  if (path.startsWith('/admin/users/') && path.includes('/sessions/') && path.endsWith('/delete') && request.method === 'POST') {
    const parts = path.split('/');
    const userId = parts[3];
    const sessionId = parts[5];
    return await userRoutes.handleRevokeSession(request, env, userId, sessionId);
  }

  // Revoke all sessions (POST /admin/users/:id/sessions/delete-all)
  if (path.startsWith('/admin/users/') && path.endsWith('/sessions/delete-all') && request.method === 'POST') {
    const userId = path.split('/')[3];
    return await userRoutes.handleRevokeAllSessions(request, env, userId);
  }

  return new Response('Not found', { status: 404 });
}
