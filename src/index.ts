import { Env } from './types';
import { HTML } from './lib/pages';
import { HomePage, AboutPage, LibraryPage, LinksPage, ContactPage, JoinPage, AdminLoginPage, TwoFactorPage, TwoFactorSetupPage } from './lib/pages';
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
    return addSecurityHeaders(HTML`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Login - GCRL</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #42514c;
      margin: 0;
    }
    .login-box {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
    }
    h1 { color: #C2A43B; margin-top: 0; }
    input {
      width: 100%;
      padding: 0.75rem;
      margin: 0.5rem 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #42514c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    }
    button:hover { background: #2a3530; }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>🔐 Admin Login</h1>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> This login is protected by Cloudflare security.
      Multiple failed attempts will be blocked.
    </div>
    <form id="loginForm" novalidate>
      <label for="password">Admin Password</label>
      <input 
        type="password" 
        id="password" 
        name="password" 
        placeholder="Enter your admin password"
        autocomplete="current-password"
      >
      <div id="error" class="error" style="display: none;"></div>
      <button type="submit">Login</button>
    </form>
    <p style="font-size: 0.85rem; color: #666; margin-top: 1rem;">
      ℹ️ Cloudflare may challenge you with a CAPTCHA if suspicious activity is detected.
    </p>
  </div>
  <script>
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      
      if (password.length < 14) {
        errorDiv.textContent = 'Password must be at least 14 characters';
        errorDiv.style.display = 'block';
        return;
      }
      
      try {
        const response = await fetch('/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password })
        });
        
        // Get response text first
        const responseText = await response.text();
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            
            // Check if 2FA is required
            if (data.require2FA) {
              // Store password temporarily for 2FA verification
              sessionStorage.setItem('pendingPassword', password);
              window.location.href = '/admin/2fa';
            } else {
              // No 2FA, proceed to dashboard
              localStorage.setItem('adminToken', data.token);
              window.location.href = '/admin';
            }
          } catch (parseError) {
            errorDiv.textContent = 'Server error: Invalid response format';
            errorDiv.style.display = 'block';
          }
        } else {
          try {
            const data = JSON.parse(responseText);
            errorDiv.textContent = data.error || 'Login failed';
          } catch (parseError) {
            errorDiv.textContent = 'Login failed: ' + responseText;
          }
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Network error: ' + error.message;
        errorDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>`);
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
    return addSecurityHeaders(HTML`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard - GCRL</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .dashboard { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .dashboard-section { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .dashboard-section h2 { color: #42514c; margin-bottom: 1rem; }
    .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
    .table th { background: #f5f5f5; font-weight: 600; }
    .btn-action { padding: 0.5rem 1rem; margin: 0.25rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-upload { background: #C2A43B; color: #42514c; }
    .btn-delete { background: #dc3545; color: white; }
    .btn-enable { background: #28a745; color: white; }
    .btn-disable { background: #ffc107; color: #42514c; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #42514c; color: white; padding: 1.5rem; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 2rem; font-weight: bold; color: #C2A43B; }
    #loading { text-align: center; padding: 2rem; }
    #error { background: #f8d7da; color: #721c24; padding: 1rem; margin: 2rem; border-radius: 4px; }
    .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.875rem; }
    .status-enabled { background: #d4edda; color: #155724; }
    .status-disabled { background: #fff3cd; color: #856404; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
    .modal-content { background: white; margin: 5% auto; padding: 2rem; border-radius: 8px; max-width: 600px; position: relative; }
    .close-modal { position: absolute; top: 1rem; right: 1rem; font-size: 1.5rem; cursor: pointer; color: #666; }
    .qr-container { text-align: center; margin: 2rem 0; }
    .qr-container img { max-width: 250px; border: 4px solid #42514c; border-radius: 8px; padding: 1rem; }
    .backup-codes { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
    .backup-codes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 1rem; }
    .backup-code { background: white; padding: 0.5rem; border-radius: 4px; text-align: center; font-family: monospace; color: #42514c; font-size: 0.9rem; border: 1px solid #ddd; }
    .warning-box { background: #fff3cd; border: 2px solid #ffc107; color: #856404; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
  </style>
</head>
<body>
  <header>
    <nav class="main-nav" style="background: #42514c; padding: 1rem 0;">
      <div class="nav-container">
        <span class="logo" style="color: #C2A43B; font-size: 1.5rem; font-weight: bold;">Admin Dashboard</span>
        <a href="/" class="btn-action" style="text-decoration: none; background: white; color: #42514c; padding: 0.5rem 1rem; border-radius: 4px;">View Site</a>
        <button onclick="logout()" class="btn-action" style="background: #dc3545; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">Logout</button>
      </div>
    </nav>
  </header>
  
  <div id="loading">Loading dashboard...</div>
  <div id="error" style="display: none;"></div>
  
  <div id="dashboard" style="display: none;">
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number" id="docCount">0</div>
          <div>Documents</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="pendingCount">0</div>
          <div>Pending Requests</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="totalCount">0</div>
          <div>Total Requests</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="dashboard-section">
          <h2>📄 Documents</h2>
          <button class="btn-action btn-upload" onclick="document.getElementById('uploadForm').style.display = 'block'">Upload Document</button>
          <div id="uploadForm" style="display: none; margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
            <form id="uploadFormForm" enctype="multipart/form-data">
              <input type="file" id="file" accept=".pdf" required>
              <input type="text" id="title" placeholder="Title" required style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
              <textarea id="description" placeholder="Description" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;"></textarea>
              <input type="text" id="category" placeholder="Category" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
              <button type="submit" class="btn-action btn-upload">Upload</button>
            </form>
          </div>
          <table class="table">
            <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="documentsList"></tbody>
          </table>
        </div>
        
        <div class="dashboard-section">
          <h2>📧 Membership Requests</h2>
          <table class="table">
            <thead><tr><th>Name</th><th>Email</th><th>Date</th><th>Status</th></tr></thead>
            <tbody id="requestsList"></tbody>
          </table>
        </div>
      </div>
      
      <div class="dashboard-section" style="margin-top: 2rem;">
        <h2>🔐 Two-Factor Authentication (2FA)</h2>
        <p style="color: #666; margin-bottom: 1rem;">Add an extra layer of security to your admin account by requiring a code from your authenticator app.</p>
        
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <strong>Status:</strong>
          <span id="twoFaStatus" class="status-badge status-disabled">Checking...</span>
        </div>
        
        <div id="twoFaActions">
          <button id="enable2FABtn" class="btn-action btn-enable" onclick="showSetup2FA()">Enable 2FA</button>
          <button id="disable2FABtn" class="btn-action btn-disable" onclick="disable2FA()" style="display: none;">Disable 2FA</button>
        </div>
        
        <div id="twoFaInfo" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px; display: none;">
          <strong>ℹ️ 2FA is currently disabled</strong><br>
          <span style="color: #666; font-size: 0.9rem;">Your admin account is protected only by your password. Enable 2FA to add an extra layer of security.</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 2FA Setup Modal -->
  <div id="setup2FAModal" class="modal">
    <div class="modal-content">
      <span class="close-modal" onclick="closeSetup2FA()">&times;</span>
      <h2 style="color: #C2A43B; margin-bottom: 1rem;">Setup Two-Factor Authentication</h2>
      
      <div id="setupStep1">
        <p>Two-factor authentication adds an extra layer of security to your admin account. Even if someone obtains your password, they won't be able to access the admin dashboard without the authentication code from your phone.</p>
        
        <h3 style="color: #42514c; margin-top: 1.5rem;">Step 1: Install an Authenticator App</h3>
        <p>If you don't already have one, install a TOTP-compatible authenticator app:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Google Authenticator</strong> (iOS/Android)</li>
          <li><strong>Authy</strong> (iOS/Android)</li>
          <li><strong>1Password</strong> (if you're already using it)</li>
          <li><strong>Microsoft Authenticator</strong> (iOS/Android)</li>
        </ul>
        
        <button class="btn-action btn-enable" style="margin-top: 1rem;" onclick="generateQRCode()">Continue to Step 2</button>
      </div>
      
      <div id="setupStep2" style="display: none;">
        <h3 style="color: #42514c;">Step 2: Scan the QR Code</h3>
        <p>Open your authenticator app and scan the QR code below:</p>
        
        <div id="qrLoading" style="text-align: center; padding: 2rem;">Generating QR code...</div>
        <div id="qrCode" class="qr-container" style="display: none;"></div>
        
        <p style="margin-top: 1rem;">Or enter this code manually:</p>
        <div id="secretCode" style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px; text-align: center; font-family: monospace; color: #42514c; margin: 1rem 0; word-break: break-all; font-size: 0.9rem;"></div>
        
        <h3 style="color: #42514c; margin-top: 2rem;">Step 3: Save Your Backup Codes</h3>
        <div class="warning-box">
          <strong>⚠️ IMPORTANT: These codes will only be shown ONCE. Save them now!</strong>
        </div>
        <div id="backupCodes" class="backup-codes">
          <p style="color: #42514c; font-weight: bold; margin-bottom: 0.5rem;">Your Backup Codes:</p>
          <div id="backupCodesGrid" class="backup-codes-grid"></div>
        </div>
        
        <h3 style="color: #42514c; margin-top: 2rem;">Step 4: Verify Setup</h3>
        <p>Enter the 6-digit code from your authenticator app to complete setup:</p>
        <div style="margin: 1rem 0;">
          <input type="text" id="verifyCode" placeholder="000000" maxlength="6" pattern="[0-9]{6}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1.25rem; letter-spacing: 0.25rem; text-align: center;">
        </div>
        <button class="btn-action btn-enable" onclick="verifyAndEnable2FA()">Enable 2FA</button>
        <button class="btn-action" style="background: #6c757d; color: white;" onclick="closeSetup2FA()">Cancel</button>
      </div>
    </div>
  </div>
  
  <script>
    const token = localStorage.getItem('adminToken');
    
    // Check if logged in
    if (!token) {
      window.location.href = '/admin/login';
    }
    
    // Check 2FA status
    async function check2FAStatus() {
      try {
        const response = await fetch('/admin/2fa-status', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          const data = await response.json();
          update2FAStatus(data.enabled);
        }
      } catch (error) {
        console.error('Failed to check 2FA status:', error);
      }
    }
    
    // Update 2FA status UI
    function update2FAStatus(enabled) {
      const statusBadge = document.getElementById('twoFaStatus');
      const enableBtn = document.getElementById('enable2FABtn');
      const disableBtn = document.getElementById('disable2FABtn');
      const infoDiv = document.getElementById('twoFaInfo');
      
      if (enabled) {
        statusBadge.textContent = 'Enabled';
        statusBadge.className = 'status-badge status-enabled';
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline-block';
        infoDiv.style.display = 'block';
        infoDiv.innerHTML = '<strong>✅ 2FA is enabled</strong><br><span style="color: #666; font-size: 0.9rem;">Your admin account is protected by two-factor authentication. You will need a code from your authenticator app to log in.</span>';
      } else {
        statusBadge.textContent = 'Disabled';
        statusBadge.className = 'status-badge status-disabled';
        enableBtn.style.display = 'inline-block';
        disableBtn.style.display = 'none';
        infoDiv.style.display = 'block';
        infoDiv.innerHTML = '<strong>ℹ️ 2FA is currently disabled</strong><br><span style="color: #666; font-size: 0.9rem;">Your admin account is protected only by your password. Enable 2FA to add an extra layer of security.</span>';
      }
    }
    
    // Show 2FA setup modal
    function showSetup2FA() {
      document.getElementById('setup2FAModal').style.display = 'block';
      document.getElementById('setupStep1').style.display = 'block';
      document.getElementById('setupStep2').style.display = 'none';
    }
    
    // Close 2FA setup modal
    function closeSetup2FA() {
      document.getElementById('setup2FAModal').style.display = 'none';
    }
    
    // Generate QR code
    async function generateQRCode() {
      document.getElementById('setupStep1').style.display = 'none';
      document.getElementById('setupStep2').style.display = 'block';
      document.getElementById('qrLoading').style.display = 'block';
      document.getElementById('qrCode').style.display = 'none';
      
      try {
        const response = await fetch('/admin/setup-2fa', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Display QR code
          document.getElementById('qrLoading').style.display = 'none';
          document.getElementById('qrCode').style.display = 'block';
          document.getElementById('qrCode').innerHTML = '<img src="' + data.qrCodeUrl + '" alt="QR Code">';
          
          // Display secret
          document.getElementById('secretCode').textContent = data.secret;
          
          // Display backup codes
          const grid = document.getElementById('backupCodesGrid');
          grid.innerHTML = data.backupCodes.map(code => 
            '<div class="backup-code">' + code.substring(0, 4) + '-' + code.substring(4) + '</div>'
          ).join('');
          
          // Store data for verification
          window.setup2FAData = data;
        } else {
          const error = await response.json();
          alert('Failed to generate QR code: ' + (error.error || 'Unknown error'));
          closeSetup2FA();
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code: ' + error.message);
        closeSetup2FA();
      }
    }
    
    // Verify and enable 2FA
    async function verifyAndEnable2FA() {
      const code = document.getElementById('verifyCode').value;
      
      if (!code || code.length !== 6) {
        alert('Please enter a 6-digit code');
        return;
      }
      
      if (!window.setup2FAData) {
        alert('Setup data not found. Please start over.');
        return;
      }
      
      try {
        const response = await fetch('/admin/enable-2fa', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            secret: window.setup2FAData.secret,
            code: code,
            backupCodes: window.setup2FAData.backupCodes
          })
        });
        
        if (response.ok) {
          alert('✅ Two-factor authentication has been enabled!');
          closeSetup2FA();
          check2FAStatus();
        } else {
          const error = await response.json();
          alert('Failed to enable 2FA: ' + (error.error || 'Invalid code'));
        }
      } catch (error) {
        console.error('Error enabling 2FA:', error);
        alert('Failed to enable 2FA: ' + error.message);
      }
    }
    
    // Disable 2FA
    async function disable2FA() {
      if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
        return;
      }
      
      try {
        const response = await fetch('/admin/disable-2fa', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          alert('Two-factor authentication has been disabled.');
          check2FAStatus();
        } else {
          const error = await response.json();
          alert('Failed to disable 2FA: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error disabling 2FA:', error);
        alert('Failed to disable 2FA: ' + error.message);
      }
    }
    
    // Fetch dashboard data
    async function loadDashboard() {
      console.log('Loading dashboard...');
      console.log('Token:', token);
      
      try {
        const response = await fetch('/admin/api/data', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.status === 401) {
          console.error('Unauthorized - redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        if (!response.ok) {
          const text = await response.text();
          console.error('Response not ok:', text);
          throw new Error('Failed to load dashboard: ' + text);
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data);
        
        // Update stats
        document.getElementById('docCount').textContent = data.documents.length;
        document.getElementById('pendingCount').textContent = data.requests.filter(r => r.status === 'pending').length;
        document.getElementById('totalCount').textContent = data.requests.length;
        
        // Populate documents table
        const docsHtml = data.documents.map(doc => 
          '<tr>' +
            '<td>' + doc.title + '</td>' +
            '<td>' + (doc.category || 'N/A') + '</td>' +
            '<td>' + new Date(doc.upload_date).toLocaleDateString() + '</td>' +
            '<td>' +
              '<button class="btn-action btn-delete" onclick="deleteDocument(\'' + doc.id + '\')">Delete</button>' +
            '</td>' +
          '</tr>'
        ).join('');
        document.getElementById('documentsList').innerHTML = docsHtml;
        
        // Populate requests table
        const reqsHtml = data.requests.map(req => 
          '<tr>' +
            '<td>' + req.name + '</td>' +
            '<td>' + req.email + '</td>' +
            '<td>' + new Date(req.submitted_date).toLocaleDateString() + '</td>' +
            '<td><span style="padding: 0.25rem 0.5rem; background: ' + (req.status === 'pending' ? '#fff3cd' : '#d4edda') + '; border-radius: 4px;">' + req.status + '</span></td>' +
          '</tr>'
        ).join('');
        document.getElementById('requestsList').innerHTML = reqsHtml;
        
        // Show dashboard
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // Check 2FA status
        check2FAStatus();
        
      } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error loading dashboard: ' + error.message;
      }
    }
    
    async function deleteDocument(id) {
      if (!confirm('Are you sure you want to delete this document?')) return;
      
      const response = await fetch('/admin/documents/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        loadDashboard();
      } else {
        alert('Failed to delete document');
      }
    }
    
    // Handle document upload
    document.getElementById('uploadFormForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = document.getElementById('file').files[0];
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const category = document.getElementById('category').value;
      
      if (!file || !title) {
        alert('Please select a file and enter a title');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      
      try {
        const response = await fetch('/admin/documents', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
          },
          body: formData
        });
        
        if (response.ok) {
          alert('Document uploaded successfully!');
          document.getElementById('uploadForm').style.display = 'none';
          loadDashboard();
        } else {
          const error = await response.json();
          alert('Upload failed: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Upload failed: ' + error.message);
      }
    });
    
    function logout() {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    
    // Load dashboard on page load
    loadDashboard();
  </script>
</body>
</html>`);
    return addSecurityHeaders(HTML`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard - GCRL</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .dashboard { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .dashboard-section { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .dashboard-section h2 { color: #42514c; margin-bottom: 1rem; }
    .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
    .table th { background: #f5f5f5; font-weight: 600; }
    .btn-action { padding: 0.5rem 1rem; margin: 0.25rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-upload { background: #C2A43B; color: #42514c; }
    .btn-delete { background: #dc3545; color: white; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #42514c; color: white; padding: 1.5rem; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 2rem; font-weight: bold; color: #C2A43B; }
    #loading { text-align: center; padding: 2rem; }
    #error { background: #f8d7da; color: #721c24; padding: 1rem; margin: 2rem; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <nav class="main-nav" style="background: #42514c; padding: 1rem 0;">
      <div class="nav-container">
        <span class="logo" style="color: #C2A43B; font-size: 1.5rem; font-weight: bold;">Admin Dashboard</span>
        <a href="/" class="btn-action" style="text-decoration: none; background: white; color: #42514c; padding: 0.5rem 1rem; border-radius: 4px;">View Site</a>
        <button onclick="logout()" class="btn-action" style="background: #dc3545; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">Logout</button>
      </div>
    </nav>
  </header>
  
  <div id="loading">Loading dashboard...</div>
  <div id="error" style="display: none;"></div>
  
  <div id="dashboard" style="display: none;">
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number" id="docCount">0</div>
          <div>Documents</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="pendingCount">0</div>
          <div>Pending Requests</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="totalCount">0</div>
          <div>Total Requests</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="dashboard-section">
          <h2>📄 Documents</h2>
          <button class="btn-action btn-upload" onclick="document.getElementById('uploadForm').style.display = 'block'">Upload Document</button>
          <div id="uploadForm" style="display: none; margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
            <form id="uploadFormForm" enctype="multipart/form-data">
              <input type="file" id="file" accept=".pdf" required>
              <input type="text" id="title" placeholder="Title" required style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
              <textarea id="description" placeholder="Description" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;"></textarea>
              <input type="text" id="category" placeholder="Category" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
              <button type="submit" class="btn-action btn-upload">Upload</button>
            </form>
          </div>
          <table class="table">
            <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="documentsList"></tbody>
          </table>
        </div>
        
        <div class="dashboard-section">
          <h2>📧 Membership Requests</h2>
          <table class="table">
            <thead><tr><th>Name</th><th>Email</th><th>Date</th><th>Status</th></tr></thead>
            <tbody id="requestsList"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    const token = localStorage.getItem('adminToken');
    
    // Check if logged in
    if (!token) {
      window.location.href = '/admin/login';
    }
    
    // Fetch dashboard data
    async function loadDashboard() {
      console.log('Loading dashboard...');
      console.log('Token:', token);
      
      try {
        const response = await fetch('/admin/api/data', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.status === 401) {
          console.error('Unauthorized - redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        if (!response.ok) {
          const text = await response.text();
          console.error('Response not ok:', text);
          throw new Error('Failed to load dashboard: ' + text);
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data);
        
        // Update stats
        document.getElementById('docCount').textContent = data.documents.length;
        document.getElementById('pendingCount').textContent = data.requests.filter(r => r.status === 'pending').length;
        document.getElementById('totalCount').textContent = data.requests.length;
        
        // Populate documents table
        const docsHtml = data.documents.map(doc => 
          '<tr>' +
            '<td>' + doc.title + '</td>' +
            '<td>' + (doc.category || 'N/A') + '</td>' +
            '<td>' + new Date(doc.upload_date).toLocaleDateString() + '</td>' +
            '<td>' +
              '<button class="btn-action btn-delete" onclick="deleteDocument(\'' + doc.id + '\')">Delete</button>' +
            '</td>' +
          '</tr>'
        ).join('');
        document.getElementById('documentsList').innerHTML = docsHtml;
        
        // Populate requests table
        const reqsHtml = data.requests.map(req => 
          '<tr>' +
            '<td>' + req.name + '</td>' +
            '<td>' + req.email + '</td>' +
            '<td>' + new Date(req.submitted_date).toLocaleDateString() + '</td>' +
            '<td><span style="padding: 0.25rem 0.5rem; background: ' + (req.status === 'pending' ? '#fff3cd' : '#d4edda') + '; border-radius: 4px;">' + req.status + '</span></td>' +
          '</tr>'
        ).join('');
        document.getElementById('requestsList').innerHTML = reqsHtml;
        
        // Show dashboard
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
      } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error loading dashboard: ' + error.message;
      }
    }
    
    async function deleteDocument(id) {
      if (!confirm('Are you sure you want to delete this document?')) return;
      
      const response = await fetch('/admin/documents/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        loadDashboard();
      } else {
        alert('Failed to delete document');
      }
    }
    
    // Handle document upload
    document.getElementById('uploadFormForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = document.getElementById('file').files[0];
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const category = document.getElementById('category').value;
      
      if (!file || !title) {
        alert('Please select a file and enter a title');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      
      try {
        const response = await fetch('/admin/documents', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
          },
          body: formData
        });
        
        if (response.ok) {
          alert('Document uploaded successfully!');
          document.getElementById('uploadForm').style.display = 'none';
          loadDashboard();
        } else {
          const error = await response.json();
          alert('Upload failed: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Upload failed: ' + error.message);
      }
    });
    
    function logout() {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    
    // Load dashboard on page load
    loadDashboard();
  </script>
</body>
</html>`);
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
