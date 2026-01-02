/**
 * HTML Page Generators
 * ====================
 * 
 * Purpose: Generate HTML for all public pages and admin interface
 * 
 * Pages Generated:
 * Public Pages:
 * - HomePage(): Landing page with hero banner and features
 * - AboutPage(): Lodge information and purpose
 * - LibraryPage(): Public catalog of research papers
 * - DocumentDetailPage(): Individual document view with password prompt
 * - LinksPage(): Masonic resources and research lodges
 * - ContactPage(): Contact form and meeting information
 * - JoinPage(): Membership request form
 * 
 * Admin Pages:
 * - AdminLoginPage(): Password entry for admin access
 * - TwoFactorPage(): TOTP code verification
 * - TwoFactorSetupPage(): QR code and backup codes for 2FA setup
 * 
 * Architecture:
 * - BasePage(): Shared layout with header, nav, footer
 * - All pages use consistent styling and navigation
 * - HTML is sanitized to prevent XSS attacks
 * - Responsive design (mobile-friendly)
 * 
 * Security Considerations:
 * - No user input is directly rendered without sanitization
 * - Admin pages protected by password + 2FA
 * - Library downloads require authentication
 * - All forms use POST to prevent CSRF
 * 
 * Author: Lawrence Altomare
 * Created: December 2025
 * Last Modified: December 31, 2025 (v19 - Clean navigation, no hamburger)
 */

import { Env } from './types';

// Site constants
const SITE_NAME = 'Golden Compasses Research Lodge';
const SITE_DESCRIPTION = 'Advancing Masonic knowledge through research and education';

// HTML Template generator
export function HTML(strings: TemplateStringsArray, ...values: any[]): Response {
  const html = String.raw(strings, ...values);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Base page layout with navigation
export function BasePage(title: string, content: string, currentPage: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">  
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${SITE_NAME}</title>
  <meta name="description" content="${SITE_DESCRIPTION}">
  <meta name="theme-color" content="#C2A43B">
  <link rel="stylesheet" href="/styles.css?v=19">
</head>
<body>
  <header>
    <nav class="main-nav">
      <div class="nav-container">
        <div class="logo-section">
          <a href="/" class="logo-link">
            <img src="/logo.png?v=2" alt="Golden Compasses Logo" class="logo">
          </a>
          <div class="site-title-section">
            <h1 class="site-title">Golden Compasses Research Lodge</h1>
            <p class="site-tagline">A California Research Lodge "Where Curiosity Meets Passion"</p>
          </div>
        </div>
        <ul class="nav-menu">
          <li class="${currentPage === 'home' ? 'active' : ''}"><a href="/">Home</a></li>
          <li class="${currentPage === 'about' ? 'active' : ''}"><a href="/about">About</a></li>
          <li class="${currentPage === 'library' ? 'active' : ''}"><a href="/library">Library</a></li>
          <li class="${currentPage === 'links' ? 'active' : ''}"><a href="/links">Links</a></li>
          <li class="${currentPage === 'contact' ? 'active' : ''}"><a href="/contact">Contact</a></li>
          <li class="${currentPage === 'join' ? 'active' : ''}"><a href="/join" class="join-btn">Join</a></li>
        </ul>
      </div>
    </nav>
  </header>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <div class="footer-content">
      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
      <p class="footer-links">
        <a href="/contact">Contact</a> | 
        <a href="/library">Library</a> | 
        <a href="/join">Join GCRL</a>
      </p>
    </div>
  </footer>
</body>
</html>`;
}

// Home page
export function HomePage(): string {
  return BasePage('Home', `
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome to Golden Compasses Research Lodge</h1>
        <p class="hero-subtitle">Advancing Masonic Knowledge Through Research and Education</p>
        <div class="hero-actions">
          <a href="/about" class="btn btn-primary">Learn More</a>
          <a href="/join" class="btn btn-secondary">Become a Member</a>
        </div>
      </div>
    </section>
    <section class="content-section">
      <div class="container">
        <h2>Our Mission</h2>
        <p>Golden Compasses Research Lodge is dedicated to the study, preservation, and dissemination of Masonic knowledge. We provide a forum for Masonic writers, researchers, and educators to share their work and advance understanding of the Craft.</p>
        
        <div class="features">
          <div class="feature-card">
            <h3>📚 Research Library</h3>
            <p>Access our collection of Masonic papers, research documents, and educational materials. Members enjoy full access to download and study resources.</p>
            <a href="/library" class="feature-link">Explore Library →</a>
          </div>
          
          <div class="feature-card">
            <h3>🤝 Fellowship</h3>
            <p>Join a community of Masonic scholars and researchers. Participate in discussions, present your research, and learn from experienced brethren.</p>
            <a href="/about" class="feature-link">Learn More →</a>
          </div>
          
          <div class="feature-card">
            <h3>📖 Education</h3>
            <p>We support Masonic education through regular meetings, presentations, and publications. Expand your knowledge of Masonic history, philosophy, and ritual.</p>
            <a href="/contact" class="feature-link">Contact Us →</a>
          </div>
        </div>
      </div>
    </section>
  `, 'home');
}

// About page
export function AboutPage(): string {
  return BasePage('About', `
    <section class="page-header">
      <div class="container">
        <h1>About Golden Compasses Research Lodge</h1>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <h2>Who We Are</h2>
        <p>Golden Compasses Research Lodge is a research lodge constituted under the Grand Lodge of California. We are dedicated to Masonic research, education, and the dissemination of knowledge.</p>
        
        <h2>Our Purpose</h2>
        <ul>
          <li>To encourage and facilitate Masonic research and writing</li>
          <li>To provide a platform for presenting Masonic papers and research</li>
          <li>To maintain a library of Masonic resources for members</li>
          <li>To foster fellowship among Masonic researchers and scholars</li>
          <li>To support Masonic education in lodges and the community</li>
        </ul>
        
        <h2>What We Do</h2>
        <p>Our lodge meets regularly to hear presentations on Masonic topics, discuss research findings, and share knowledge. Members contribute papers on various aspects of Masonic history, philosophy, symbolism, and practice.</p>
        
        <h2>Membership</h2>
        <p>Membership is open to Master Masons in good standing who have an interest in Masonic research and education. We welcome both experienced researchers and those new to Masonic scholarship.</p>
        <p>If you're interested in joining our community of Masonic scholars, please visit our <a href="/join">membership page</a>.</p>
      </div>
    </section>
  `, 'about');
}

// Library page (public view - titles and descriptions only)
export function LibraryPage(documents: any[] = []): string {
  const documentCards = documents.map(doc => `
    <article class="document-card">
      <h3><a href="/library/${doc.id}" class="document-title-link">${escapeHtml(doc.title)}</a></h3>
      <p class="document-description">${escapeHtml(doc.description || 'No description available.')}</p>
      <div class="document-meta">
        <span class="document-category">${escapeHtml(doc.category || 'General')}</span>
        <span class="document-date">${new Date(doc.upload_date).toLocaleDateString()}</span>
      </div>
      <p class="document-access">🔒 Full access available to Research Lodge members only</p>
      <a href="/library/${doc.id}" class="btn btn-secondary">View Document</a>
    </article>
  `).join('');
  
  return BasePage('Library', `
    <section class="page-header">
      <div class="container">
        <h1>Masonic Research Library</h1>
        <p class="subtitle">Explore our collection of Masonic research papers and educational materials</p>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <div class="library-notice">
          <h2>📖 Public Access</h2>
          <p>Browse our library catalog below. All visitors can view titles and descriptions of our research collection.</p>
          <p><strong>Members Only:</strong> Full access to download PDF documents is available to Golden Compasses Research Lodge members in good standing.</p>
          <a href="/join" class="btn btn-primary">Join to Access Full Library</a>
        </div>
        
        <div class="documents-grid">
          ${documents.length > 0 ? documentCards : '<p class="no-documents">Library coming soon. Check back for new research papers.</p>'}
        </div>
      </div>
    </section>
  `, 'library');
}

// Document detail page with password protection
export function DocumentDetailPage(document: any, error: string = ''): string {
  const fileSizeKB = Math.round(document.file_size / 1024);
  
  return BasePage(document.title, `
    <section class="page-header">
      <div class="container">
        <h1>${escapeHtml(document.title)}</h1>
        <p class="subtitle">Masonic Research Paper</p>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <div class="document-detail">
          <div class="document-info">
            <h2>Document Information</h2>
            <p><strong>Description:</strong> ${escapeHtml(document.description || 'No description available.')}</p>
            <p><strong>Category:</strong> ${escapeHtml(document.category || 'General')}</p>
            <p><strong>File Size:</strong> ${fileSizeKB} KB</p>
            <p><strong>Uploaded:</strong> ${new Date(document.upload_date).toLocaleDateString()}</p>
          </div>
          
          <div class="document-access-section">
            <h2>🔒 Member Access Required</h2>
            <p>Full access to download this document is available to Golden Compasses Research Lodge members in good standing.</p>
            
            ${error ? `<div class="error-message">${escapeHtml(error)}</div>` : ''}
            
            <form id="passwordForm" method="POST" action="/library/${document.id}/download">
              <div class="form-group">
                <label for="password">Enter Library Password:</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  required 
                  autocomplete="current-password"
                  placeholder="Enter member password"
                >
              </div>
              
              <button type="submit" class="btn btn-primary">Download Document</button>
            </form>
            
            <p class="password-hint">Members: Use the library password provided by the lodge.</p>
            <p class="join-reminder">Not a member? <a href="/join">Join Golden Compasses Research Lodge</a></p>
          </div>
        </div>
        
        <div class="back-link">
          <a href="/library">← Back to Library</a>
        </div>
      </div>
    </section>
    
    <style>
      .document-detail {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: 2rem;
      }
      
      @media (max-width: 768px) {
        .document-detail {
          grid-template-columns: 1fr;
        }
      }
      
      .document-info, .document-access-section {
        background: rgba(194, 164, 59, 0.1);
        border: 1px solid #C2A43B;
        border-radius: 8px;
        padding: 2rem;
      }
      
      .document-info h2, .document-access-section h2 {
        color: #C2A43B !important;
        margin-top: 0;
        margin-bottom: 1rem;
      }
      
      .document-info p {
        color: #ffffff !important;
        line-height: 1.8;
        margin-bottom: 0.75rem;
      }
      
      .document-info strong {
        color: #C2A43B;
      }
      
      .document-access-section p {
        color: #ffffff !important;
        margin-bottom: 1.5rem;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-group label {
        display: block;
        color: #ffffff !important;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #4a5a55;
        border-radius: 4px;
        background: #1a2a25;
        color: #ffffff;
        font-size: 1rem;
        box-sizing: border-box;
      }
      
      .form-group input:focus {
        outline: none;
        border-color: #C2A43B;
        box-shadow: 0 0 0 2px rgba(194, 164, 59, 0.2);
      }
      
      .error-message {
        background: rgba(220, 38, 38, 0.2);
        border: 1px solid #dc2626;
        color: #fca5a5;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
      }
      
      .password-hint {
        color: #C2A43B !important;
        font-size: 0.9rem;
        margin-top: 1rem;
      }
      
      .join-reminder {
        color: #ffffff !important;
        margin-top: 1rem;
      }
      
      .join-reminder a {
        color: #C2A43B !important;
        text-decoration: none;
        font-weight: 600;
      }
      
      .join-reminder a:hover {
        text-decoration: underline;
      }
      
      .back-link {
        text-align: center;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #4a5a55;
      }
      
      .back-link a {
        color: #C2A43B !important;
        text-decoration: none;
        font-size: 1.1rem;
      }
      
      .back-link a:hover {
        text-decoration: underline;
      }
      
      .document-title-link {
        color: #C2A43B !important;
        text-decoration: none;
      }
      
      .document-title-link:hover {
        text-decoration: underline;
      }
      
      .btn-secondary {
        background: transparent;
        color: #C2A43B;
        border: 1px solid #C2A43B;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        display: inline-block;
        margin-top: 1rem;
        transition: all 0.3s;
      }
      
      .btn-secondary:hover {
        background: rgba(194, 164, 59, 0.1);
        transform: translateY(-1px);
      }
    </style>
  `, 'library');
}

// Links page
export function LinksPage(): string {
  return BasePage('Links', `
    <section class="page-header">
      <div class="container">
        <h1>Masonic Links</h1>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <h2>Masonic Resources</h2>
        <ul class="links-list">
          <li><a href="https://www.freemason.org" target="_blank" rel="noopener">Grand Lodge of California</a></li>
          <li><a href="https://www.masoniclibrary.com" target="_blank" rel="noopener">Masonic Library and Museum</a></li>
          <li><a href="https://www.scottishrite.org" target="_blank" rel="noopener">Scottish Rite Southern Jurisdiction</a></li>
          <li><a href="https://www.yorkrite.org" target="_blank" rel="noopener">York Rite</a></li>
        </ul>
        
        <h2>Research Lodges</h2>
        <ul class="links-list">
          <li><a href="https://www.masonicresearch society.org" target="_blank" rel="noopener">Masonic Research Society</a></li>
          <li><a href="https://www.quatuorcoronati.com" target="_blank" rel="noopener">Quatuor Coronati Lodge No. 2076</a></li>
          <li><a href="https://www.masonicworld.com" target="_blank" rel="noopener">Masonic World</a></li>
        </ul>
      </div>
    </section>
  `, 'links');
}

// Contact page with meeting schedule
export function ContactPage(): string {
  return BasePage('Contact', `
    <section class="page-header">
      <div class="container">
        <h1>Contact Us</h1>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h2>Meeting Information</h2>
            <p><strong>When:</strong> First Tuesday of the second month of each quarter at 7:00 PM</p>
            <p><strong>2026 Meeting Dates:</strong> February 3rd, May 5th, August 4th, November 3rd</p>
            <p><strong>Location:</strong> Folsom Masonic Center, 1000 Duchow Way, Folsom, CA 95630</p>
            
            <h2>Get in Touch</h2>
            <p>For more information about Golden Compasses Research Lodge or membership inquiries, please use the form below or contact us at:</p>
            <p><strong>Email:</strong> info@goldencompasses.org</p>
          </div>
          
          <div class="contact-form">
            <h2>Send Us a Message</h2>
            <form id="contactForm" method="POST" action="/api/contact">
              <div class="form-group">
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" required>
              </div>
              
              <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="subject">Subject</label>
                <input type="text" id="subject" name="subject">
              </div>
              
              <div class="form-group">
                <label for="message">Message *</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              
              <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
    
    <script>
      document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const form = this;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (result.success && result.redirect) {
            window.location.href = result.redirect;
          } else {
            alert('There was an error submitting your message. Please try again.');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('There was an error submitting your message. Please try again.');
        }
      });
    </script>
  `, 'contact');
}

// Join page
export function JoinPage(): string {
  return BasePage('Join', `
    <section class="page-header">
      <div class="container">
        <h1>Join Golden Compasses Research Lodge</h1>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <div class="join-info">
          <h2>Membership Requirements</h2>
          <ul>
            <li>You must be a Master Mason in good standing</li>
            <li>You should have an interest in Masonic research and education</li>
            <li>You are willing to contribute to the lodge's mission</li>
            <li>You can attend our regular meetings (or participate remotely)</li>
          </ul>
          
          <h2>Benefits of Membership</h2>
          <ul>
            <li>Access to our complete research library (PDF downloads)</li>
            <li>Opportunity to present your research papers</li>
            <li>Participation in Masonic discussions and education</li>
            <li>Fellowship with like-minded Masonic scholars</li>
            <li>Subscription to lodge publications and newsletters</li>
          </ul>
        </div>
        
        <div class="join-form">
          <h2>Membership Request Form</h2>
          <p>Please complete the form below to express your interest in joining Golden Compasses Research Lodge.</p>
          
          <form id="membershipForm" method="POST" action="/api/join">
            <div class="form-group">
              <label for="fullName">Full Name *</label>
              <input type="text" id="fullName" name="name" required>
            </div>
            
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
              <label for="phone">Phone</label>
              <input type="tel" id="phone" name="phone">
            </div>
            
            <div class="form-group">
              <label for="lodge">Lodge Affiliation</label>
              <input type="text" id="lodge" name="lodge" placeholder="Lodge Name, Number, and Jurisdiction">
            </div>
            
            <div class="form-group">
              <label for="interests">Areas of Interest</label>
              <textarea id="interests" name="interests" rows="3" placeholder="Tell us about your Masonic interests or research areas..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="message">Additional Message</label>
              <textarea id="message" name="message" rows="4" placeholder="Any additional information you'd like to share..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">Submit Membership Request</button>
          </form>
        </div>
      </div>
    </section>
    
    <script>
      document.getElementById('membershipForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const form = this;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
          const response = await fetch('/api/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (result.success && result.redirect) {
            window.location.href = result.redirect;
          } else {
            alert('There was an error submitting your request. Please try again.');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('There was an error submitting your request. Please try again.');
        }
      });
    </script>
  `, 'join');
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Admin login page with 2FA support
export function AdminLoginPage(error: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - ${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .login-box {
      background: #2a3a35;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 400px;
    }
    .login-box h1 {
      color: #C2A43B !important;
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }
    .login-box p {
      color: #ffffff !important;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      color: #ffffff !important;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #4a5a55;
      border-radius: 4px;
      background: #1a2a25;
      color: #ffffff;
      font-size: 1rem;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #C2A43B;
      box-shadow: 0 0 0 2px rgba(194, 164, 59, 0.2);
    }
    .btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: #C2A43B;
      color: #1a2a25;
    }
    .btn-primary:hover {
      background: #d4b55a;
      transform: translateY(-1px);
    }
    .error-message {
      background: rgba(220, 38, 38, 0.2);
      border: 1px solid #dc2626;
      color: #fca5a5;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #4a5a55;
    }
    .login-footer a {
      color: #C2A43B !important;
      text-decoration: none;
    }
    .login-footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-box">
      <h1>Admin Login</h1>
      <p>Enter your credentials to access the admin dashboard</p>
      
      ${error ? `<div class="error-message">${escapeHtml(error)}</div>` : ''}
      
      <form id="loginForm" method="POST" action="/admin/verify">
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required 
            autocomplete="current-password"
            placeholder="Enter your admin password"
          >
        </div>
        
        <button type="submit" class="btn btn-primary">Continue</button>
      </form>
      
      <div class="login-footer">
        <p><a href="/">← Back to Website</a></p>
      </div>
    </div>
  </div>
  
  <script>
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', function(e) {
      const password = document.getElementById('password').value;
      
      if (password.length < 14) {
        e.preventDefault();
        alert('Password must be at least 14 characters long.');
        return false;
      }
    });
  </script>
</body>
</html>`;
}

// 2FA verification page
export function TwoFactorPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Two-Factor Authentication - ${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .login-box {
      background: #2a3a35;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 400px;
    }
    .login-box h1 {
      color: #C2A43B !important;
      text-align: center;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .login-box p {
      color: #ffffff !important;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      color: #ffffff !important;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #4a5a55;
      border-radius: 4px;
      background: #1a2a25;
      color: #ffffff;
      font-size: 1.25rem;
      letter-spacing: 0.25rem;
      text-align: center;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #C2A43B;
      box-shadow: 0 0 0 2px rgba(194, 164, 59, 0.2);
    }
    .btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: #C2A43B;
      color: #1a2a25;
    }
    .btn-primary:hover {
      background: #d4b55a;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: transparent;
      color: #C2A43B;
      border: 1px solid #C2A43B;
      margin-top: 1rem;
    }
    .btn-secondary:hover {
      background: rgba(194, 164, 59, 0.1);
    }
    .error-message {
      background: rgba(220, 38, 38, 0.2);
      border: 1px solid #dc2626;
      color: #fca5a5;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .backup-code-link {
      text-align: center;
      margin-top: 1rem;
    }
    .backup-code-link a {
      color: #C2A43B !important;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .backup-code-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-box">
      <h1>Two-Factor Authentication</h1>
      <p>Enter the 6-digit code from your authenticator app</p>
      
      <div id="errorContainer"></div>
      
      <form id="totpForm" method="POST" action="/admin/verify-2fa">
        <div class="form-group">
          <label for="code">Authentication Code</label>
          <input 
            type="text" 
            id="code" 
            name="code" 
            required 
            maxlength="6"
            pattern="[0-9]{6}"
            placeholder="000000"
            autocomplete="one-time-code"
            autofocus
          >
        </div>
        
        <button type="submit" class="btn btn-primary">Verify</button>
        
        <div class="backup-code-link">
          <a href="#" id="useBackupCode">Use a backup code instead</a>
        </div>
      </form>
      
      <button class="btn btn-secondary" onclick="window.location.href='/admin/login'">Cancel</button>
    </div>
  </div>
  
  <script>
    const codeInput = document.getElementById('code');
    
    // Auto-format and submit when 6 digits entered
    codeInput.addEventListener('input', function(e) {
      // Remove non-numeric characters
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Auto-submit when 6 digits entered
      if (this.value.length === 6) {
        document.getElementById('totpForm').submit();
      }
    });
    
    // Handle backup code link
    document.getElementById('useBackupCode').addEventListener('click', function(e) {
      e.preventDefault();
      const backupCode = prompt('Enter your backup code:');
      if (backupCode) {
        // Create form to submit backup code
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/admin/verify-2fa';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'backup_code';
        input.value = backupCode;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      }
    });
  </script>
</body>
</html>`;
}

// 2FA Setup page with QR code
export function TwoFactorSetupPage(qrCodeDataUrl: string, secret: string, backupCodes: string[]): string {
  const formattedCodes = backupCodes.map(code => code.substring(0, 4) + '-' + code.substring(4));
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Two-Factor Authentication - ${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .setup-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem;
      background: #2a3a35;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    .setup-container h1 {
      color: #C2A43B !important;
      text-align: center;
      margin-bottom: 1rem;
    }
    .setup-container h2 {
      color: #C2A43B !important;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    .setup-container p {
      color: #ffffff !important;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .step {
      background: rgba(194, 164, 59, 0.1);
      border: 1px solid #C2A43B;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }
    .step-number {
      display: inline-block;
      background: #C2A43B;
      color: #1a2a25;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      text-align: center;
      line-height: 30px;
      font-weight: bold;
      margin-right: 0.5rem;
    }
    .qr-container {
      text-align: center;
      margin: 2rem 0;
    }
    .qr-container img {
      max-width: 250px;
      border: 4px solid #ffffff;
      border-radius: 8px;
      padding: 1rem;
      background: #ffffff;
    }
    .secret-display {
      background: #1a2a25;
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
      font-family: monospace;
      font-size: 1.1rem;
      color: #C2A43B;
      margin: 1rem 0;
      word-break: break-all;
    }
    .backup-codes {
      background: #1a2a25;
      padding: 1.5rem;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .backup-codes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .backup-code {
      background: #2a3a35;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      font-family: monospace;
      color: #C2A43B;
      font-size: 0.9rem;
    }
    .warning-box {
      background: rgba(245, 158, 11, 0.2);
      border: 2px solid #f59e0b;
      color: #fcd34d;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin: 0.5rem;
    }
    .btn-primary {
      background: #C2A43B;
      color: #1a2a25;
    }
    .btn-primary:hover {
      background: #d4b55a;
    }
    .btn-secondary {
      background: transparent;
      color: #C2A43B;
      border: 1px solid #C2A43B;
    }
    .btn-secondary:hover {
      background: rgba(194, 164, 59, 0.1);
    }
    .button-container {
      text-align: center;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="setup-container">
    <h1>Setup Two-Factor Authentication</h1>
    <p>Two-factor authentication adds an extra layer of security to your admin account. Even if someone obtains your password, they won't be able to access the admin dashboard without the authentication code from your phone.</p>
    
    <div class="step">
      <p><span class="step-number">1</span><strong>Install an Authenticator App</strong></p>
      <p>If you don't already have one, install a TOTP-compatible authenticator app on your smartphone:</p>
      <ul>
        <li><strong>Google Authenticator</strong> (iOS/Android)</li>
        <li><strong>Authy</strong> (iOS/Android)</li>
        <li><strong>1Password</strong> (if you're already using it)</li>
        <li><strong>Microsoft Authenticator</strong> (iOS/Android)</li>
      </ul>
    </div>
    
    <div class="step">
      <p><span class="step-number">2</span><strong>Scan the QR Code</strong></p>
      <p>Open your authenticator app and scan the QR code below:</p>
      <div class="qr-container">
        <img src="${qrCodeDataUrl}" alt="QR Code for TOTP Setup">
      </div>
      <p>Or enter this code manually:</p>
      <div class="secret-display">${secret}</div>
    </div>
    
    <div class="step">
      <p><span class="step-number">3</span><strong>Save Your Backup Codes</strong></p>
      <p><strong>IMPORTANT:</strong> Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.</p>
      <div class="warning-box">
        <strong>⚠️ These codes will only be shown ONCE. Save them now!</strong>
      </div>
      <div class="backup-codes">
        <p style="color: #C2A43B; font-weight: bold;">Your Backup Codes:</p>
        <div class="backup-codes-grid">
          ${formattedCodes.map(code => `<div class="backup-code">${code}</div>`).join('')}
        </div>
      </div>
    </div>
    
    <div class="step">
      <p><span class="step-number">4</span><strong>Verify Setup</strong></p>
      <p>Enter the 6-digit code from your authenticator app to complete setup:</p>
      <form id="verifyForm" method="POST" action="/admin/verify-2fa">
        <div class="form-group">
          <input 
            type="text" 
            id="code" 
            name="code" 
            required 
            maxlength="6"
            pattern="[0-9]{6}"
            placeholder="000000"
            autocomplete="one-time-code"
            style="width: 100%; padding: 0.75rem; border: 1px solid #4a5a55; border-radius: 4px; background: #1a2a25; color: #ffffff; font-size: 1.25rem; letter-spacing: 0.25rem; text-align: center;"
          >
        </div>
      </form>
    </div>
    
    <div class="button-container">
      <button class="btn btn-primary" onclick="document.getElementById('verifyForm').submit()">Enable 2FA</button>
      <button class="btn btn-secondary" onclick="if(confirm('Are you sure? Skipping 2FA will leave your account less secure.')) window.location.href='/admin/dashboard'">Skip for Now</button>
    </div>
  </div>
  
  <script>
    const codeInput = document.getElementById('code');
    
    codeInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  </script>
</body>
</html>`;
}

// Thank You page for form submissions
export function ThankYouPage(type: 'contact' | 'join'): string {
  const isContact = type === 'contact';
  
  const title = isContact ? 'Thank You for Contacting Us' : 'Thank You for Your Interest';
  const message = isContact 
    ? `Your message has been sent to the Lodge Secretary. We'll get back to you within 1-2 business days.`
    : `Your membership request has been submitted. The Lodge Secretary will contact you soon with next steps.`;
  const emoji = isContact ? '✉️' : '🎉';
  
  const content = `
    <style>
      .thank-you-container {
        max-width: 700px;
        margin: 3rem auto;
        padding: 3rem 2rem;
        text-align: center;
        background: linear-gradient(135deg, rgba(194, 164, 59, 0.1), rgba(26, 42, 37, 0.9));
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        border: 2px solid #C2A43B;
      }
      .thank-you-container .emoji {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .thank-you-container h2 {
        color: #C2A43B !important;
        margin-bottom: 1rem;
        font-size: 1.8rem;
      }
      .thank-you-container p {
        color: #ffffff !important;
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }
      .checkmark {
        width: 80px;
        height: 80px;
        margin: 0 auto 2rem;
        background: #C2A43B;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: #1a2a25;
        animation: scaleIn 0.5s ease-out;
      }
      @keyframes scaleIn {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
      }
      .button-group .btn {
        padding: 0.875rem 2rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        text-decoration: none;
        display: inline-block;
      }
      .button-group .btn-primary {
        background: #C2A43B;
        color: #1a2a25;
      }
      .button-group .btn-primary:hover {
        background: #d4b453;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(194, 164, 59, 0.4);
      }
      .button-group .btn-secondary {
        background: transparent;
        color: #C2A43B;
        border: 2px solid #C2A43B;
      }
      .button-group .btn-secondary:hover {
        background: rgba(194, 164, 59, 0.1);
        transform: translateY(-2px);
      }
      .info-box {
        background: rgba(194, 164, 59, 0.1);
        border: 1px solid #C2A43B;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 2rem 0;
        text-align: left;
      }
      .info-box p {
        color: #ffffff !important;
        margin: 0;
        font-size: 0.95rem;
      }
    </style>
    
    <section class="page-header">
      <div class="container">
        <h1>${title}</h1>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <div class="thank-you-container">
          <div class="checkmark">✓</div>
          <div class="emoji">${emoji}</div>
          <h2>${title}</h2>
          <p>${message}</p>
          
          <div class="info-box">
            <p><strong>What happens next?</strong></p>
            ${isContact 
              ? `<p style="margin-top: 0.5rem;">📧 Your message has been sent to our Lodge Secretary<br>
                   📋 We've recorded your information in our system<br>
                   📞 You'll receive a response within 1-2 business days</p>`
              : `<p style="margin-top: 0.5rem;">📋 Your membership request has been submitted<br>
                   📧 The Lodge Secretary will review your application<br>
                   📞 You'll be contacted with information about the next steps<br>
                   📖 In the meantime, feel free to browse our research library</p>`
            }
          </div>
          
          <div class="button-group">
            <a href="/" class="btn btn-primary">Return Home</a>
            <a href="/library" class="btn btn-secondary">Browse Library</a>
            ${!isContact ? '<a href="/join" class="btn btn-secondary">Submit Another Request</a>' : '<a href="/contact" class="btn btn-secondary">Send Another Message</a>'}
          </div>
        </div>
      </div>
    </section>
  `;
  
  return BasePage('Thank You', content, '');
}
