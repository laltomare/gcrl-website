# START HERE: Golden Compasses Website Setup
## TypeScript + Plain Cloudflare Workers + D1 + R2 (No Framework)
**For AI Assistants**: Complete setup guide using plain Cloudflare Workers (no framework)

**Pre-installed Tools**: ✅ Node.js v24 + ✅ npm + ✅ GitHub CLI + ✅ Wrangler + ✅ Git

**Tech Stack**: 
- **Plain Cloudflare Workers** (no framework, just TypeScript)
- **D1** (SQLite database for document metadata)
- **R2** (object storage for PDFs - two-tier access)
- **Authentication** (password-protected downloads + admin)
- **Security** (HARDENED - site was previously compromised)

**Timeline**: 5-7 days | **Pages**: 6 + Admin Dashboard

---

## ⚡ 10-Minute Setup
- **R2** (object storage for PDFs)

**Timeline**: 5-7 days | **Pages**: 7 + Admin Dashboard

---

## ⚡ 10-Minute Setup

### Step 1: Create GitHub Repository
```bash
cd ~
mkdir gcrl-website
cd gcrl-website

# Initialize git
git init

# Create GitHub repo (using gh CLI - already logged in)
gh repo create gcrl-website --public --source=. --remote=origin
```

### Step 2: Initialize Project
```bash
# Initialize npm
npm init -y

# Install TypeScript and Workers dependencies
npm install --save-dev typescript @cloudflare/workers-types wrangler
```

### Step 3: Configure TypeScript
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 4: Configure Wrangler
Create `wrangler.toml`:
```toml
name = "gcrl-website"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database (for document metadata)
[[d1_databases]]
binding = "DB"
database_name = "gcrl-documents"
database_id = "YOUR_D1_DATABASE_ID"  # Created later

# R2 Storage (for PDF files)
[[r2_buckets]]
binding = "R2"
bucket_name = "gcrl-documents"

# Environment variables
[vars]
ENVIRONMENT = "production"
```

### Step 5: Update package.json
Replace the `"scripts"` section in `package.json` with:
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "d1:create": "wrangler d1 create gcrl-documents",
    "db:migrate": "wrangler d1 execute gcrl-documents --file=./schema.sql",
    "db:query": "wrangler d1 execute gcrl-documents --command"
  }
}
```

### Step 6: Create Project Structure
```bash
# Create directories
mkdir -p src/routes
mkdir -p src/lib
mkdir -p public/images

# Copy images
cp /Users/lawrencealtomare/Downloads/goldencompasses-assets/*.png public/images/
cp /Users/lawrencealtomare/Downloads/goldencompasses-assets/*.jpg public/images/
```

### Step 7: Initial Commit
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 📁 Project Structure (Simple)

```
gcrl-website/
├── src/
│   ├── index.ts                 # Main entry point (all routes)
│   ├── lib/
│   │   ├── html.ts              # HTML template helpers
│   │   └── db.ts                # Database helpers
│   └── types/
│       └── index.d.ts           # TypeScript types
├── public/
│   └── images/
│       ├── golden-compasses-logo.png
│       ├── hero-banner.jpg
│       └── background-image.jpg
├── schema.sql                   # D1 database schema
├── package.json
├── tsconfig.json
├── wrangler.toml
└── README.md
```

---

## 🗄️ Database Schema (D1)

Create `schema.sql`:
```sql
-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  filename TEXT NOT NULL,
  size INTEGER,
  upload_date TEXT NOT NULL,
  is_private INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_private ON documents(is_private);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
```

Apply schema:
```bash
# Create D1 database
npm run d1:create
# Copy the database_id from output to wrangler.toml

# Apply schema
npm run db:migrate
```

---

## 🔐 Main Application (Plain Workers)

Create `src/index.ts`:
```typescript
// Types
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  ADMIN_PASSWORD: string;
  LIBRARY_PASSWORD: string;
}

// HTML template helper
const HTML = (strings: TemplateStringsArray, ...values: any[]) => {
  return new Response(
    String.raw({ raw: strings }, ...values),
    {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    }
  );
};

// Main fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Static assets
    if (path.startsWith('/images/')) {
      return env.R2.get(path.replace('/images/', ''))
        .then(object => object || new Response('Not found', { status: 404 }))
        .then(object => new Response(object?.body, {
          headers: { 'Content-Type': object?.httpMetadata?.contentType || 'image/jpeg' }
        }));
    }

    // Routes
    if (path === '/' || path === '/home') {
      return homePage(env);
    }
    
    if (path === '/about') {
      return aboutPage();
    }
    
    // Library is public (view titles/descriptions), downloads require membership
    if (path === '/library') {
      return libraryPage(env);
    }
    
    if (path === '/admin') {
      return adminPage(request, env);
    }
    
    if (path === '/links') {
      return linksPage();
    }
    
    if (path === '/contact') {
      return contactPage();
    }
    
    if (path === '/join') {
      return joinPage();
    }

    // API routes
    if (path === '/api/documents') {
      return listDocuments(env);
    }
    
    if (path.startsWith('/api/documents/') && path.endsWith('/download')) {
      const id = path.split('/')[3];
      return downloadDocument(id, request, env);
    }
    
    if (path === '/admin/upload' && request.method === 'POST') {
      return uploadDocument(request, env);
    }
    
    if (path.startsWith('/admin/documents/') && request.method === 'DELETE') {
      const id = path.split('/')[3];
      return deleteDocument(id, env);
    }

    // Health check
    if (path === '/api/health') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

---

## 📄 Page Handlers

### Home Page
```typescript
async function homePage(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM documents WHERE is_private = 0'
  ).first();
  
  return HTML`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Golden Compasses Research Lodge</title>
  <link href="https://fonts.googleapis.com/css2?family=Saginaw&family=Montserrat:wght@400;700&family=Gentium+Basic:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root { --color-gold: #C2A43B; --color-green: #42514c; }
    body { font-family: 'Gentium Basic', serif; margin: 0; }
    .navbar { background: var(--color-green); padding: 1rem; display: flex; justify-content: space-between; }
    .nav-menu { display: flex; gap: 2rem; list-style: none; }
    .nav-menu a { color: white; text-decoration: none; }
    .hero { background: url('/images/hero-banner.jpg') center/cover; padding: 4rem; text-align: center; color: white; }
    .btn-primary { background: var(--color-gold); color: var(--color-green); padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; }
    footer { background: var(--color-green); color: white; text-align: center; padding: 2rem; margin-top: 4rem; }
  </style>
</head>
<body>
  <header>
    <nav class="navbar">
      <div class="logo">
        <img src="/images/golden-compasses-logo.png" alt="GCRL" style="height: 60px;">
      </div>
      <ul class="nav-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/library">Library (${results?.count || 0} docs)</a></li>
        <li><a href="/links">Links</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/join" class="btn-primary">Join GCRL</a></li>
      </ul>
    </nav>
  </header>

  <section class="hero">
    <h1>Welcome to Golden Compasses Research Lodge</h1>
    <p style="font-size: 1.5rem;">Fostering Masonic Education, Brotherhood, and Service</p>
    <a href="/join" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Learn More</a>
  </section>

  <main style="padding: 4rem; max-width: 1200px; margin: 0 auto;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
      <article style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: var(--color-gold);">Masonic Education</h2>
        <p>Deepening our understanding of Masonic principles, rituals, and history.</p>
      </article>
      <article style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: var(--color-gold);">Brotherhood</h2>
        <p>Building lasting bonds among Masons through fellowship and mentorship.</p>
      </article>
      <article style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: var(--color-gold);">Community Service</h2>
        <p>Extending Masonic values into the community through charitable service.</p>
      </article>
    </div>
  </main>

  <footer>
    <p>&copy; 2025 Golden Compasses Research Lodge F.&amp;A.M.</p>
  </footer>
</body>
</html>`;
}
```

### Library Page (Public View - Titles + Descriptions)
```typescript
async function libraryPage(env: Env): Promise<Response> {
  // Public query - show all documents to visitors
  const { results } = await env.DB.prepare(
    'SELECT * FROM documents ORDER BY upload_date DESC'
  ).all();
  
  const documents = results as any[];
  
  const documentCards = documents.map(doc => `
    <article style="background: white; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h3 style="color: #C2A43B; font-size: 1.5rem; margin: 0 0 0.5rem 0;">${doc.title}</h3>
      <p style="color: #333; line-height: 1.6;">${doc.description || 'No description available'}</p>
      <p style="color: #666; font-size: 0.9rem; margin-top: 1rem;">
        <strong>Category:</strong> ${doc.category || 'General'} | 
        <strong>Added:</strong> ${new Date(doc.upload_date).toLocaleDateString()} |
        <strong>Downloads:</strong> ${doc.download_count}
      </p>
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
        <p style="color: #C2A43B; font-weight: bold; font-size: 0.9rem;">🔒 Full access available to Research Lodge members only</p>
        <a href="/join" style="display: inline-block; background: #42514c; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; margin-top: 0.5rem;">Join GCRL to Download</a>
      </div>
    </article>
  `).join('');
  
  return HTML`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Library - Golden Compasses Research Lodge</title>
  <link href="https://fonts.googleapis.com/css2?family=Saginaw&family=Montserrat:wght@400;700&family=Gentium+Basic:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root { --color-gold: #C2A43B; --color-green: #42514c; }
    body { font-family: 'Gentium Basic', serif; margin: 0; background: #f5f5f5; }
    .navbar { background: var(--color-green); padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
    .nav-menu { display: flex; gap: 2rem; list-style: none; margin: 0; padding: 0; }
    .nav-menu a { color: white; text-decoration: none; font-weight: 500; }
    .hero { background: var(--color-green); color: white; padding: 3rem 2rem; text-align: center; }
    .hero h1 { margin: 0 0 0.5rem 0; }
    .hero p { margin: 0; opacity: 0.9; }
  </style>
</head>
<body>
  <header>
    <nav class="navbar">
      <div class="logo">
        <img src="/images/golden-compasses-logo.png" alt="GCRL" style="height: 60px;">
      </div>
      <ul class="nav-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/library" style="color: #C2A43B;">Library</a></li>
        <li><a href="/links">Links</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/join" style="background: #C2A43B; color: #42514c; padding: 0.5rem 1rem; border-radius: 4px;">Join GCRL</a></li>
      </ul>
    </nav>
  </header>

  <section class="hero">
    <h1>Masonic Research Library</h1>
    <p>Browse our collection of Masonic educational papers, research documents, and historical materials</p>
  </section>

  <main style="max-width: 1200px; margin: 2rem auto; padding: 0 1rem;">
    <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #C2A43B;">
      <h2 style="color: #42514c; margin-top: 0;">About Our Library</h2>
      <p style="color: #666; line-height: 1.6;">
        Our Research Lodge maintains a comprehensive collection of Masonic educational materials, 
        including historical papers, philosophical treatises, ritual studies, and research documents. 
        Below you can preview the titles and descriptions of our collection.
      </p>
      <p style="color: #C2A43B; font-weight: bold; margin-top: 1rem;">
        Full access (including PDF downloads) is available to Golden Compasses Research Lodge members.
      </p>
      <a href="/join" style="display: inline-block; background: #C2A43B; color: #42514c; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; margin-top: 1rem; font-weight: bold;">
        Become a Member →
      </a>
    </div>
    
    <h2 style="color: #42514c; margin-bottom: 1.5rem;">Library Collection (${documents.length} documents)</h2>
    ${documentCards || '<p style="text-align: center; color: #666; padding: 3rem; background: white; border-radius: 8px;">No documents available yet. Check back soon!</p>'}
  </main>

  <footer style="background: var(--color-green); color: white; text-align: center; padding: 2rem; margin-top: 4rem;">
    <p>&copy; 2025 Golden Compasses Research Lodge F.&amp;A.M.</p>
    <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">Fostering Masonic Education, Brotherhood, and Service</p>
  </footer>
</body>
</html>`;
}
```

### Other Pages (simple versions)
```typescript
async function aboutPage(): Promise<Response> {
  return HTML`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>About - Golden Compasses Research Lodge</title>
  <link href="https://fonts.googleapis.com/css2?family=Saginaw&family=Gentium+Basic&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Gentium Basic', serif; margin: 0;">
  <nav style="background: #42514c; padding: 1rem;">
    <a href="/" style="color: white;">Home</a>
    <a href="/library" style="color: white; margin-left: 2rem;">Library</a>
  </nav>
  <main style="padding: 4rem; max-width: 1200px; margin: 0 auto;">
    <h1 style="color: #C2A43B;">About Golden Compasses Research Lodge</h1>
    <p>Content coming soon...</p>
  </main>
</body>
</html>`;
}

async function linksPage(): Promise<Response> {
  // Content from: /Users/lawrencealtomare/Downloads/goldencompasses-content/content/links.md
  return HTML`<!DOCTYPE html>
<html>
<head><title>Links - GCRL</title></head>
<body>
  <nav style="background: #42514c; padding: 1rem;"><a href="/" style="color: white;">Home</a></nav>
  <main style="padding: 2rem;">
    <h1>Masonic Links</h1>
    <ul>
      <li><a href="https://calodges.org">Grand Lodge of California</a></li>
      <li><a href="https://msana.com">Masonic Service Association</a></li>
      <!-- More links from content/links.md -->
    </ul>
  </main>
</body>
</html>`;
}

async function contactPage(): Promise<Response> {
  return HTML`<!DOCTYPE html>
<html>
<head><title>Contact - GCRL</title></head>
<body>
  <nav style="background: #42514c; padding: 1rem;"><a href="/" style="color: white;">Home</a></nav>
  <main style="padding: 2rem;">
    <h1>Contact Us</h1>
    <!-- Meeting info from: content/contact.md -->
  </main>
</body>
</html>`;
}

async function joinPage(): Promise<Response> {
  return HTML`<!DOCTYPE html>
<html>
<head><title>Join GCRL</title></head>
<body>
  <nav style="background: #42514c; padding: 1rem;"><a href="/" style="color: white;">Home</a></nav>
  <main style="padding: 2rem;">
    <h1>Join Golden Compasses Research Lodge</h1>
    <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" style="max-width: 600px;">
      <input type="text" name="name" placeholder="Full Name" required style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;">
      <input type="email" name="email" placeholder="Email" required style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;">
      <button type="submit" style="padding: 0.75rem 1.5rem; background: #C2A43B;">Submit</button>
    </form>
  </main>
</body>
</html>`;
}
```

---

## 📚 API Endpoints

### List Documents
```typescript
async function listDocuments(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM documents WHERE is_private = 0 ORDER BY upload_date DESC'
  ).all();
  
  return Response.json(results);
}
```

### Download Document (Requires Membership)
```typescript
async function downloadDocument(id: string, request: Request, env: Env): Promise<Response> {
  // Check for membership password
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.LIBRARY_PASSWORD}`) {
    return new Response(
      JSON.stringify({ 
        error: 'Membership required',
        message: 'Full access to documents is available to Golden Compasses Research Lodge members. Please join to access our complete collection.',
        joinUrl: '/join'
      }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Get document metadata
  const doc = await env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(id).first();
  
  if (!doc) {
    return new Response('Document not found', { status: 404 });
  }
  
  // Get file from R2
  const object = await env.R2.get(doc.filename);
  
  if (!object) {
    return new Response('File not found in storage', { status: 404 });
  }
  
  // Increment download count
  await env.DB.prepare(
    'UPDATE documents SET download_count = download_count + 1 WHERE id = ?'
  ).bind(id).run();
  
  // Return PDF file
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.filename}"`,
    },
  });
}
```

---

## 🔐 Admin Dashboard (CRUD)

```typescript
async function adminPage(request: Request, env: Env): Promise<Response> {
  // Check authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { results } = await env.DB.prepare(
    'SELECT * FROM documents ORDER BY upload_date DESC'
  ).all();
  
  const documents = results as any[];
  
  return HTML`
<!DOCTYPE html>
<html>
<head><title>Admin Dashboard</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem;">
  <h1>Admin Dashboard</h1>
  
  <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 2rem;">
    <h2>Upload Document</h2>
    <form method="POST" action="/admin/upload" enctype="multipart/form-data">
      <input type="text" name="title" placeholder="Title" required style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;">
      <textarea name="description" placeholder="Description" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;" rows="3"></textarea>
      <input type="text" name="category" placeholder="Category" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;">
      <label><input type="checkbox" name="is_private"> Private Document</label>
      <br><br>
      <input type="file" name="file" accept=".pdf" required>
      <br><br>
      <button type="submit" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px;">Upload</button>
    </form>
  </div>
  
  <div>
    <h2>Documents (${documents.length})</h2>
    ${documents.map(doc => `
      <div style="background: #f5f5f5; padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
        <h3>${doc.title}</h3>
        <p>${doc.description || 'No description'}</p>
        <p>Private: ${doc.is_private ? 'Yes' : 'No'}</p>
        <button onclick="deleteDocument('${doc.id}')" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
      </div>
    `).join('')}
  </div>
  
  <script>
    async function deleteDocument(id) {
      if (!confirm('Delete this document?')) return;
      await fetch(\`/admin/documents/\${id}\`, { method: 'DELETE', headers: { 'Authorization': 'Bearer \${localStorage.getItem('adminToken')}' } });
      location.reload();
    }
  </script>
</body>
</html>`;
}

async function uploadDocument(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const isPrivate = formData.get('is_private') === 'on';
  
  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }
  
  // Upload to R2
  const filename = `${Date.now()}-${file.name}`;
  await env.R2.put(filename, file.stream());
  
  // Save to D1
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO documents (id, title, description, category, filename, size, upload_date, is_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, title, description, category, filename, file.size, new Date().toISOString(), isPrivate ? 1 : 0).run();
  
  return Response.redirect(new URL('/admin', request.url), 303);
}

async function deleteDocument(id: string, env: Env): Promise<Response> {
  const doc = await env.DB.prepare('SELECT filename FROM documents WHERE id = ?').bind(id).first();
  if (!doc) return new Response('Not found', { status: 404 });
  
  await env.R2.delete(doc.filename);
  await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
  
  return Response.json({ success: true });
}
```

---

## 🔄 Development Workflow

```bash
# Development server (live reload)
npm run dev
# Opens at http://localhost:8787

# Create database
npm run d1:create
# Copy database_id to wrangler.toml

# Apply schema
npm run db:migrate

# Deploy to production
npm run deploy

# Query database
npm run db:query "SELECT * FROM documents"
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Day 1)
- [ ] Create GitHub repo
- [ ] Initialize TypeScript
- [ ] Configure Wrangler
- [ ] Set up D1 database
- [ ] Set up R2 bucket
- [ ] Create main index.ts with routes

### Phase 2: Public Pages (Day 2-3)
- [ ] Home page
- [ ] About page
- [ ] Library page (with DB queries)
- [ ] Links page
- [ ] Contact page
- [ ] Join page

### Phase 3: Private Library (Day 4)
- [ ] Private library route
- [ ] Password authentication
- [ ] Document download with tracking

### Phase 4: Admin Dashboard (Day 5)
- [ ] Admin authentication
- [ ] Upload document (Create)
- [ ] List documents (Read)
- [ ] Update document metadata
- [ ] Delete document

### Phase 5: Testing & Deployment (Day 6-7)
- [ ] Test all routes
- [ ] Test CRUD operations
- [ ] Deploy to Workers
- [ ] Set up custom domain

---

## 🎯 For AI Assistants

### Your Task Sequence

1. **Create project structure** (use structure above)
2. **Set up D1 database** with schema.sql
3. **Set up R2 bucket** for PDF storage
4. **Create main index.ts** with fetch handler and route matching
5. **Implement page handlers** (home, about, library, etc.)
6. **Implement API endpoints** (list, download, upload, delete)
7. **Add authentication** for admin and private library
8. **Test locally** with `npm run dev`
9. **User will deploy** with `npm run deploy`

### Content Reference
```
/Users/lawrencealtomare/Downloads/goldencompasses-content/
├── FINAL-SITE-STRUCTURE.md
├── INDEX.md
├── content/
│   ├── home.md
│   ├── links.md
│   └── contact.md
└── pages/ (original HTML reference)
```

### Assets Reference
```
/Users/lawrencealtomare/Downloads/goldencompasses-assets/
├── golden-compasses-logo.png
├── hero-banner.jpg
└── background-image.jpg
```

---

## 🚀 Quick Commands

```bash
# Create repo
gh repo create gcrl-website --public --source=. --remote=origin

# Development
npm run dev                    # Live reload

# Database
npm run d1:create              # Create D1
npm run db:migrate             # Apply schema
npm run db:query "SELECT * FROM documents"

# R2
wrangler r2 bucket create gcrl-documents

# Deployment
npm run deploy
```

---

## 📖 Resources

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **D1 Database**: https://developers.cloudflare.com/d1/
- **R2 Storage**: https://developers.cloudflare.com/r2/
- **Wrangler**: https://developers.cloudflare.com/workers/wrangler/

---

*Created: 2025-12-27*
*Tech Stack: Plain TypeScript + Cloudflare Workers + D1 + R2*
*No Framework Required - AI Can Write All Code*
