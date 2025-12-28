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
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header>
    <nav class="main-nav">
      <div class="nav-container">
        <a href="/" class="logo-link">
          <img src="/logo.png" alt="${SITE_NAME}" class="logo">
        </a>
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
      <h3>${escapeHtml(doc.title)}</h3>
      <p class="document-description">${escapeHtml(doc.description || 'No description available.')}</p>
      <div class="document-meta">
        <span class="document-category">${escapeHtml(doc.category || 'General')}</span>
        <span class="document-date">${new Date(doc.upload_date).toLocaleDateString()}</span>
      </div>
      <p class="document-access">🔒 Full access available to Research Lodge members only</p>
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
            <p><strong>When:</strong> Third Saturday of January, March, May, September, and November</p>
            <p><strong>Time:</strong> 9:30 AM - Breakfast, 10:30 AM - Meeting</p>
            <p><strong>Location:</strong> Scottish Rite Center, 6191 Lusk Blvd, San Diego, CA 92121</p>
            
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
  `, 'join');
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
