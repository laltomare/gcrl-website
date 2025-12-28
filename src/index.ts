import { Env } from './types';
import { HTML } from './lib/pages';
import { HomePage, AboutPage, LibraryPage, LinksPage, ContactPage, JoinPage } from './lib/pages';
import { addSecurityHeaders, handleCors } from './lib/headers';
import { getClientIP, checkRateLimit, verifyToken, logSecurityEvent } from './lib/auth';
import { sanitizeInput } from './lib/sanitize';

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
    <form id="loginForm">
      <label for="password">Admin Password</label>
      <input 
        type="password" 
        id="password" 
        name="password" 
        required 
        placeholder="Enter your admin password"
        minlength="14"
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
        
        if (response.ok) {
          const { token } = await response.json();
          localStorage.setItem('adminToken', token);
          window.location.href = '/admin';
        } else {
          const { error } = await response.json();
          errorDiv.textContent = error;
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = 'Login failed: ' + error.message;
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
      const { password } = await request.json();
      const verification = verifyToken(password, env, true);

      if (verification.valid) {
        await logSecurityEvent(env, 'ADMIN_LOGIN_SUCCESS', request);
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

  // Admin dashboard (requires authentication)
  if (path === '/admin' && request.method === 'GET') {
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
  </style>
</head>
<body>
  <header>
    <nav class="main-nav">
      <div class="nav-container">
        <span class="logo">Admin Dashboard</span>
        <a href="/" class="btn-action" style="text-decoration: none;">View Site</a>
      </div>
    </nav>
  </header>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${documents.length}</div>
        <div>Documents</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${requests.filter(r => r.status === 'pending').length}</div>
        <div>Pending Requests</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${requests.length}</div>
        <div>Total Requests</div>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <div class="dashboard-section">
        <h2>📄 Documents</h2>
        <button class="btn-action btn-upload" onclick="document.getElementById('uploadForm').style.display = 'block'">Upload Document</button>
        <div id="uploadForm" style="display: none; margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
          <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" id="file" accept=".pdf" required>
            <input type="text" id="title" placeholder="Title" required>
            <textarea id="description" placeholder="Description"></textarea>
            <input type="text" id="category" placeholder="Category">
            <button type="submit" class="btn-action btn-upload">Upload</button>
          </form>
        </div>
        <table class="table">
          <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${documents.map(doc => `
              <tr>
                <td>${doc.title}</td>
                <td>${doc.category || 'N/A'}</td>
                <td>${new Date(doc.upload_date).toLocaleDateString()}</td>
                <td>
                  <button class="btn-action btn-delete" onclick="deleteDocument('${doc.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="dashboard-section">
        <h2>📧 Membership Requests</h2>
        <table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            ${requests.map(req => `
              <tr>
                <td>${req.name}</td>
                <td>${req.email}</td>
                <td>${new Date(req.submitted_date).toLocaleDateString()}</td>
                <td><span style="padding: 0.25rem 0.5rem; background: ${req.status === 'pending' ? '#fff3cd' : '#d4edda'}; border-radius: 4px;">${req.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <script>
    const token = localStorage.getItem('adminToken');
    
    async function deleteDocument(id) {
      if (!confirm('Are you sure you want to delete this document?')) return;
      
      const response = await fetch('/admin/documents/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        location.reload();
      } else {
        alert('Failed to delete document');
      }
    }
  </script>
</body>
</html>`);
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
