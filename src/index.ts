import { Env } from './types';
import { HTML } from './lib/pages';
import { HomePage, AboutPage, LibraryPage, DocumentDetailPage, LinksPage, ContactPage, JoinPage, AdminLoginPage, TwoFactorPage, TwoFactorSetupPage } from './lib/pages';
import { addSecurityHeaders, handleCors } from './lib/headers';
import { getClientIP, checkRateLimit, verifyToken, logSecurityEvent } from './lib/auth';
import { sanitizeInput } from './lib/sanitize';
import { generateTOTPSecret, generateTOTPURI, verifyTOTP, generateBackupCodes, isValidBackupCode, formatBackupCode } from './lib/totp';

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

      return new Response(JSON.stringify({ success: true, message: 'Thank you for your message!' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
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

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Thank you for your interest! We will contact you soon.' 
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

  // Admin verification
  if (path === '/admin/verify' && request.method === 'POST') {
    if (!checkRateLimit(ip, 3, 900000)) {
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
      
      const { password } = body;
      
      if (!password || typeof password !== 'string') {
        return new Response(JSON.stringify({ error: 'Password is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const verification = verifyToken(password, env, true);

      if (verification.valid) {
        await logSecurityEvent(env, 'ADMIN_LOGIN_SUCCESS', request);
        
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

        // 2FA not enabled, return token
        return new Response(JSON.stringify({ token: password }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await logSecurityEvent(env, 'ADMIN_LOGIN_FAILED', request);
        return new Response(JSON.stringify({ error: 'Invalid password' }), {
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
  if (path === '/admin' && request.method === 'GET') {
    return addSecurityHeaders(HTML`${TwoFactorSetupPage()}`);
  }

  // Admin API endpoint for dashboard data
  if (path === '/admin/api/data' && request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
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
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
      return new Response('Unauthorized', { status: 401 });
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
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
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
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
      return new Response('Unauthorized', { status: 401 });
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
    if (!authHeader || !verifyToken(authHeader.replace('Bearer ', ''), env, true).valid) {
      return new Response('Unauthorized', { status: 401 });
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

  return new Response('Not found', { status: 404 });
}

// Handle document downloads
async function handleDownload(request: Request, env: Env, path: string): Promise<Response> {
  const ip = getClientIP(request);
  const documentId = path.replace('/download/', '');

  if (!checkRateLimit(ip, 10, 3600000)) {
    await logSecurityEvent(env, 'DOWNLOAD_RATE_LIMIT', request, `Document: ${documentId}`);
    return new Response(JSON.stringify({ error: 'Too many download attempts. Please try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ 
      error: 'Membership required',
      message: 'Full access available to members only',
      loginUrl: '/join'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const verification = verifyToken(token, env, false);

  if (!verification.valid) {
    await logSecurityEvent(env, 'DOWNLOAD_UNAUTHORIZED', request, `Document: ${documentId}`);
    return new Response(JSON.stringify({ 
      error: 'Invalid credentials',
      message: 'Please contact the lodge secretary for access'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch document from database
  const doc = await env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(documentId).first();

  if (!doc) {
    return new Response(JSON.stringify({ error: 'Document not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch file from R2
  const object = await env.R2.get(doc.filename);
  if (!object) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await logSecurityEvent(env, 'DOCUMENT_DOWNLOAD', request, `Document: ${doc.title}`);

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.filename}"`
    }
  });
}
