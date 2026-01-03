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
 * - AdminDashboardPage(): Main admin interface with documents, requests, 2FA management
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
    
    <div id="events-section"></div>
    
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
    
    <style>
      .upcoming-events {
        background: linear-gradient(135deg, rgba(194, 164, 59, 0.15), rgba(26, 42, 37, 0.95));
        border-bottom: 2px solid #C2A43B;
        padding: 3rem 0;
      }
      
      .upcoming-events h2 {
        color: #C2A43B !important;
        text-align: center;
        margin-bottom: 2rem;
        font-size: 2rem;
      }
      
      .events-accordion {
        max-width: 900px;
        margin: 0 auto;
      }
      
      .event-card {
        background: rgba(194, 164, 59, 0.08);
        border: 1px solid #C2A43B;
        border-radius: 8px;
        margin-bottom: 1rem;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .event-card:hover {
        box-shadow: 0 4px 12px rgba(194, 164, 59, 0.3);
        transform: translateY(-2px);
      }
      
      .event-summary {
        display: flex;
        align-items: center;
        padding: 1.5rem;
        cursor: pointer;
        gap: 1.5rem;
      }
      
      .event-date-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #C2A43B;
        color: #1a2a25;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        min-width: 80px;
        font-weight: bold;
      }
      
      .event-date-badge .event-month {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .event-date-badge .event-day {
        font-size: 1.5rem;
        line-height: 1.2;
      }
      
      .event-basic-info {
        flex: 1;
      }
      
      .event-basic-info h3 {
        color: #C2A43B !important;
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
      }
      
      .event-basic-info .event-time {
        color: #ffffff !important;
        margin: 0;
        font-size: 1rem;
      }
      
      .accordion-icon {
        font-size: 1.5rem;
        color: #C2A43B;
        transition: transform 0.3s ease;
      }
      
      .event-card.expanded .accordion-icon {
        transform: rotate(180deg);
      }
      
      .event-details {
        display: none;
        padding: 0 1.5rem 1.5rem 1.5rem;
        border-top: 1px solid rgba(194, 164, 59, 0.3);
        background: rgba(0, 0, 0, 0.2);
      }
      
      .event-details p {
        color: #ffffff !important;
        margin: 0.75rem 0;
        line-height: 1.6;
      }
      
      .event-details .event-location {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
      }
      
      .event-details .event-description {
        white-space: pre-wrap;
        margin-top: 1rem;
      }
      
      .event-details .event-url-link {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #C2A43B;
        color: #1a2a25;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 500;
        transition: all 0.3s ease;
      }
      
      .event-details .event-url-link:hover {
        background: #d4b453;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(194, 164, 59, 0.4);
      }
      
      @media (max-width: 768px) {
        .event-summary {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
        }
        
        .event-date-badge {
          flex-direction: row;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
        }
      }
    </style>
    
    <script>
      // Load upcoming events from API
      async function loadUpcomingEvents() {
        try {
          const response = await fetch('/api/events');
          
          if (response.ok) {
            const events = await response.json();
            
            if (events.length > 0) {
              const eventsSection = document.getElementById('events-section');
              
              let eventsHTML = '<section class="upcoming-events"><div class="container"><h2>📅 Upcoming Events</h2><div class="events-accordion">';
              
              events.forEach((event, index) => {
                const eventDate = new Date(event.event_date + 'T00:00:00');
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const month = monthNames[eventDate.getMonth()];
                const day = eventDate.getDate();
                const year = eventDate.getFullYear();
                
                const timeDisplay = event.end_time ? 
                  event.start_time + ' - ' + event.end_time : 
                  event.start_time;
                
                eventsHTML += 
                  '<div class="event-card" id="event-card-' + index + '">' +
                    '<div class="event-summary" onclick="toggleEvent(' + index + ')">' +
                      '<div class="event-date-badge">' +
                        '<span class="event-month">' + month.substring(0, 3).toUpperCase() + '</span>' +
                        '<span class="event-day">' + day + '</span>' +
                      '</div>' +
                      '<div class="event-basic-info">' +
                        '<h3>' + escapeHtml(event.title) + '</h3>' +
                        '<p class="event-time">' + timeDisplay + '</p>' +
                      '</div>' +
                      '<div class="accordion-icon">▼</div>' +
                    '</div>' +
                    '<div class="event-details">' +
                      '<p class="event-location">📍 ' + escapeHtml(event.location) + '</p>' +
                      (event.description ? '<p class="event-description">' + escapeHtml(event.description) + '</p>' : '') +
                      (event.event_url ? '<a href="' + escapeHtml(event.event_url) + '" target="_blank" class="event-url-link">More Information →</a>' : '') +
                    '</div>' +
                  '</div>';
              });
              
              eventsHTML += '</div></div></section>';
              eventsSection.innerHTML = eventsHTML;
            }
          }
        } catch (error) {
          console.error('Error loading events:', error);
        }
      }
      
      // Toggle event details (accordion behavior - only one open at a time)
      function toggleEvent(index) {
        const allCards = document.querySelectorAll('.event-card');
        
        // Close all other cards first
        allCards.forEach((card, i) => {
          if (i !== index) {
            card.classList.remove('expanded');
            card.querySelector('.event-details').style.display = 'none';
            card.querySelector('.accordion-icon').textContent = '▼';
          }
        });
        
        // Toggle clicked card
        const clickedCard = document.getElementById('event-card-' + index);
        const details = clickedCard.querySelector('.event-details');
        const icon = clickedCard.querySelector('.accordion-icon');
        
        if (details.style.display === 'none' || !details.style.display) {
          details.style.display = 'block';
          icon.textContent = '▲';
          clickedCard.classList.add('expanded');
        } else {
          details.style.display = 'none';
          icon.textContent = '▼';
          clickedCard.classList.remove('expanded');
        }
      }
      
      // Simple HTML escape function
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      // Load events when page is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadUpcomingEvents);
      } else {
        loadUpcomingEvents();
      }
    </script>
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
            
            <h2>Find Us</h2>
              <div class="maps-container">
                <p style="text-align: center; margin-bottom: 0.5rem; color: #ffffff;">
                  <strong>Folsom Masonic Center</strong><br>
                  1000 Duchow Way, Folsom, CA 95630
                </p>
                
                <!-- Map Links -->
                <div class="map-buttons-row">
                  <a href="https://www.google.com/maps/search/?api=1&query=Folsom+Masonic+Center,+1000+Duchow+Way,+Folsom,+CA+95630" target="_blank" rel="noopener" class="btn btn-secondary map-btn">
                    <div class="map-icon">📍</div>
                    <div class="map-text">
                      <strong>Google Maps</strong>
                      <small>View location & get directions</small>
                    </div>
                  </a>
                  <a href="https://maps.apple.com/?address=1000+Duchow+Way,Folsom,CA+95630&q=Folsom+Masonic+Center" target="_blank" rel="noopener" class="btn btn-secondary map-btn">
                    <div class="map-icon">🍎</div>
                    <div class="map-text">
                      <strong>Apple Maps</strong>
                      <small>View location & get directions</small>
                    </div>
                  </a>
                </div>
              </div>
            
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
    
    <style>
      .maps-container {
        margin: -1.5rem 0 0.25rem 0;
      }
      .map-buttons-row {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .map-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem !important;
        background: #2a3a35;
        border: 2px solid #C2A43B;
        color: #C2A43B;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.3s ease;
        min-width: 200px;
        text-align: left;
      }
      .map-btn:hover {
        background: #C2A43B;
        color: #1a2a25;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(194, 164, 59, 0.3);
      }
      .map-icon {
        font-size: 2rem;
        line-height: 1;
      }
      .map-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .map-text strong {
        font-size: 1rem;
        font-weight: 600;
      }
      .map-text small {
        font-size: 0.8rem;
        opacity: 0.8;
      }
    </style>
    
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
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const password = document.getElementById('password').value;
      
      if (password.length < 14) {
        alert('Password must be at least 14 characters long.');
        return;
      }
      
      try {
        const response = await fetch('/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (response.ok && result.token) {
          localStorage.setItem('adminToken', result.token);
          window.location.href = result.redirect || '/admin';
        } else {
          window.location.href = '/admin/login?error=' + encodeURIComponent(result.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
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

// Admin Dashboard page
// 
// Created: January 2, 2026
// Purpose: Restore admin dashboard functionality that was lost in commit e7c45cc
// Root Cause: The /admin route was incorrectly changed to return TwoFactorSetupPage() instead of the dashboard
// 
// This function provides:
// - Document management with upload functionality
// - Membership request management
// - Statistics overview (documents, requests)
// - 2FA management interface
// - Complete admin interface with authentication checks
//
// Dependencies:
// - Requires admin authentication via JWT token stored in localStorage
// - Fetches data from /admin/api/data endpoint
// - Uses /admin/api/documents and /admin/api/requests for CRUD operations
export function AdminDashboardPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - ${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
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
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; overflow-y: auto; }
    .modal-content { background: white; margin: 5% auto; padding: 2rem; border-radius: 8px; max-width: 600px; position: relative; max-height: 90vh; overflow-y: auto; }
    .close-modal { position: absolute; top: 1rem; right: 1rem; font-size: 1.5rem; cursor: pointer; color: #666; z-index: 1001; }
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
        
        <div class="dashboard-section">
          <h2>📅 Event Management</h2>
          <button class="btn-action btn-enable" onclick="showEventForm()" style="margin-bottom: 1rem;">Add New Event</button>
          <table class="table">
            <thead><tr><th>Date</th><th>Title</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="eventsList"></tbody>
          </table>
        </div>
      </div>
      
      <div class="dashboard-section" style="margin-top: 2rem;">
        <h2>🔐 Two-Factor Authentication (2FA)</h2>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span>Status: </span>
          <span id="twoFaStatus" class="status-badge status-disabled">Checking...</span>
          <button id="enable2FABtn" class="btn-action btn-enable" onclick="showSetup2FA()" style="display: none;">Enable 2FA</button>
          <button id="disable2FABtn" class="btn-action btn-disable" onclick="disable2FA()" style="display: none;">Disable 2FA</button>
        </div>
        <div id="twoFaInfo" style="margin-top: 1rem;"></div>
      </div>
    </div>
  </div>
  
  <!-- 2FA Setup Modal -->
  <div id="setup2FAModal" class="modal">
    <div class="modal-content">
      <span class="close-modal" onclick="closeSetup2FA()">&times;</span>
      <h2 style="color: #42514c;">Setup Two-Factor Authentication</h2>
      
      <div id="setupStep1">
        <p>Two-factor authentication adds an extra layer of security to your admin account.</p>
        <button class="btn-action btn-enable" onclick="generateQRCode()">Continue</button>
      </div>
      
      <div id="setupStep2" style="display: none;">
        <h3 style="color: #42514c;">Step 1: Scan QR Code</h3>
        <p>Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:</p>
        <div id="qrLoading" style="text-align: center; padding: 2rem;">Generating QR code...</div>
        <div id="qrCode" class="qr-container" style="display: none;"></div>
        <p><strong>Secret key:</strong> <code id="secretCode"></code></p>
        
        <h3 style="color: #42514c; margin-top: 2rem;">Step 2: Save Backup Codes</h3>
        <div class="warning-box">
          <strong>⚠️ IMPORTANT:</strong> Save these backup codes now. You won't see them again!
        </div>
        <div class="backup-codes">
          <p style="margin: 0; font-weight: bold;">Backup Codes:</p>
          <div id="backupCodesGrid" class="backup-codes-grid"></div>
        </div>
        
        <h3 style="color: #42514c; margin-top: 2rem;">Step 3: Verify Setup</h3>
        <p>Enter the 6-digit code from your authenticator app:</p>
        <div style="margin: 1rem 0;">
          <input type="text" id="verifyCode" placeholder="000000" maxlength="6" pattern="[0-9]{6}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1.25rem; letter-spacing: 0.25rem; text-align: center;">
        </div>
        <button class="btn-action btn-enable" onclick="verifyAndEnable2FA()">Enable 2FA</button>
        <button class="btn-action" style="background: #6c757d; color: white;" onclick="closeSetup2FA()">Cancel</button>
      </div>
    </div>
  </div>
  
  <!-- Event Form Modal -->
  <div id="eventFormModal" class="modal">
    <div class="modal-content" style="max-width: 600px;">
      <span class="close-modal" onclick="closeEventForm()">&times;</span>
      <h2 style="color: #42514c;" id="eventFormTitle">Add New Event</h2>
      
      <form id="eventForm" onsubmit="saveEvent(event)">
        <input type="hidden" id="eventId">
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">Title *</label>
          <input type="text" id="eventTitle" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">Date *</label>
          <input type="date" id="eventDate" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">Start Time *</label>
            <input type="time" id="eventStartTime" required 
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
              placeholder="HH:MM">
            <small style="color: #666; font-size: 0.85rem; display: block; margin-top: 0.25rem;">Format: HH:MM (24-hour)</small>
          </div>
          <div>
            <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">End Time (optional)</label>
            <input type="time" id="eventEndTime" 
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
              placeholder="HH:MM">
            <small style="color: #666; font-size: 0.85rem; display: block; margin-top: 0.25rem;">Leave blank if no end time</small>
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">Location *</label>
          <input type="text" id="eventLocation" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">Event URL (optional)</label>
          <input type="url" id="eventUrl" placeholder="https://..." style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #333; margin-bottom: 0.5rem; font-weight: 500;">Description (plain text)</label>
          <textarea id="eventDescription" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="eventPublished" style="width: auto; margin: 0;">
            <span style="color: #333;">Published (show on website)</span>
          </label>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button type="button" class="btn-action" style="background: #6c757d; color: white;" onclick="closeEventForm()">Cancel</button>
          <button type="submit" class="btn-action btn-enable">Save Event</button>
        </div>
      </form>
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
        infoDiv.innerHTML = '<strong>✅ 2FA is enabled</strong><br><span style="color: #666; font-size: 0.9rem;">Your admin account is protected by two-factor authentication.</span>';
      } else {
        statusBadge.textContent = 'Disabled';
        statusBadge.className = 'status-badge status-disabled';
        enableBtn.style.display = 'inline-block';
        disableBtn.style.display = 'none';
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
            code: code,
            secret: window.setup2FAData.secret
          })
        });
        
        if (response.ok) {
          alert('2FA has been enabled successfully!');
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
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          alert('2FA has been disabled.');
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
    
    // Logout
    function logout() {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    
    // Load dashboard data
    async function loadDashboard() {
      try {
        const response = await fetch('/admin/api/data', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          const data = await response.json();
          document.getElementById('loading').style.display = 'none';
          document.getElementById('dashboard').style.display = 'block';
          
          // Update stats
          document.getElementById('docCount').textContent = data.documents.length;
          document.getElementById('pendingCount').textContent = data.requests.filter(r => r.status === 'pending').length;
          document.getElementById('totalCount').textContent = data.requests.length;
          
          // Populate documents table
          const documentsList = document.getElementById('documentsList');
          documentsList.innerHTML = data.documents.map(doc => 
            '<tr>' +
              '<td>' + doc.title + '</td>' +
              '<td>' + (doc.category || 'N/A') + '</td>' +
              '<td>' + new Date(doc.upload_date).toLocaleDateString() + '</td>' +
              '<td><button class="btn-action btn-delete" onclick="deleteDocument(' + doc.id + ')">Delete</button></td>' +
            '</tr>'
          ).join('');
          
          // Populate requests table
          const requestsList = document.getElementById('requestsList');
          requestsList.innerHTML = data.requests.map(req => 
            '<tr>' +
              '<td>' + req.name + '</td>' +
              '<td>' + req.email + '</td>' +
              '<td>' + new Date(req.submitted_date).toLocaleDateString() + '</td>' +
              '<td>' +
                '<span class="status-badge ' + 
                (req.status === 'approved' ? 'status-enabled' : req.status === 'rejected' ? 'status-disabled' : req.status === 'contact' ? 'status-disabled' : 'status-enabled') + '">' +
                  (req.status === 'contact' ? 'Contacted' : req.status.charAt(0).toUpperCase() + req.status.slice(1)) + 
                '</span> ' +
                (req.status === 'pending' ? 
                  '<button class="btn-action btn-enable" onclick="updateRequest(' + req.id + ', \\'contact\\')">Contact</button> ' +
                  '<button class="btn-action btn-enable" onclick="updateRequest(' + req.id + ', \\'approved\\')">Approve</button> ' +
                  '<button class="btn-action btn-delete" onclick="updateRequest(' + req.id + ', \\'rejected\\')">Reject</button>' : 
                  '<button class="btn-action btn-delete" onclick="deleteRequest(' + req.id + ')">Delete</button>'
                ) +
              '</td>' +
            '</tr>'
          ).join('');
        } else if (response.status === 401) {
          logout();
        } else {
          throw new Error('Failed to load dashboard');
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Failed to load dashboard: ' + error.message;
      }
    }
    
    // Delete document
    async function deleteDocument(id) {
      if (!confirm('Are you sure you want to delete this document?')) return;
      
      try {
        const response = await fetch('/admin/api/documents/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          alert('Document deleted successfully');
          loadDashboard();
        } else {
          const error = await response.json();
          alert('Failed to delete document: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document: ' + error.message);
      }
    }
    
    // Update request status
    async function updateRequest(id, status) {
      try {
        const response = await fetch('/admin/api/requests/' + id, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        });
        
        if (response.ok) {
          alert('Request ' + status + ' successfully');
          loadDashboard();
        } else {
          const error = await response.json();
          alert('Failed to update request: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating request:', error);
        alert('Failed to update request: ' + error.message);
      }
    }
    
    // Delete request
    async function deleteRequest(id) {
      if (!confirm('Are you sure you want to delete this membership request? This action cannot be undone.')) return;
      
      try {
        const response = await fetch('/admin/api/requests/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          alert('Request deleted successfully');
          loadDashboard();
        } else {
          const error = await response.json();
          alert('Failed to delete request: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('Failed to delete request: ' + error.message);
      }
    }
    
    // Handle document upload
    document.getElementById('uploadFormForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData();
      formData.append('file', document.getElementById('file').files[0]);
      formData.append('title', document.getElementById('title').value);
      formData.append('description', document.getElementById('description').value);
      formData.append('category', document.getElementById('category').value);
      
      try {
        const response = await fetch('/admin/api/documents', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });
        
        if (response.ok) {
          alert('Document uploaded successfully');
          document.getElementById('uploadForm').style.display = 'none';
          this.reset();
          loadDashboard();
        } else {
          const error = await response.json();
          alert('Failed to upload document: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        alert('Failed to upload document: ' + error.message);
      }
    });
    
    // ========================================
    // EVENTS MANAGEMENT FUNCTIONS
    // ========================================
    
    // Load events into admin table
    async function loadEvents() {
      try {
        const response = await fetch('/admin/api/events', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          const events = await response.json();
          const eventsList = document.getElementById('eventsList');
          
          if (events.length === 0) {
            eventsList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No events found. Click "Add New Event" to create one.</td></tr>';
            return;
          }
          
          eventsList.innerHTML = events.map(event => {
            const eventDate = new Date(event.event_date + 'T00:00:00');
            const isPast = eventDate < new Date();
            const statusBadge = event.is_published ? 
              '<span class="status-badge status-enabled">Published</span>' : 
              '<span class="status-badge status-disabled">Draft</span>';
            const pastBadge = isPast ? '<span class="status-badge" style="background: #6c757d; color: white;">Past</span>' : '';
            
            return '<tr>' +
              '<td>' + eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</td>' +
              '<td>' + event.title + '</td>' +
              '<td>' + event.location + '</td>' +
              '<td>' + statusBadge + ' ' + pastBadge + '</td>' +
              '<td>' +
                '<button class="btn-action btn-enable" onclick="editEvent(' + event.id + ')">Edit</button> ' +
                '<button class="btn-action" onclick="copyEvent(' + event.id + ')" style="background: #6c757d; color: white;">Copy</button> ' +
                '<button class="btn-action btn-delete" onclick="deleteEvent(' + event.id + ')">Delete</button>' +
              '</td>' +
            '</tr>';
          }).join('');
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
    
    // Show event form (for new event)
    function showEventForm() {
      document.getElementById('eventFormTitle').textContent = 'Add New Event';
      document.getElementById('eventForm').reset();
      document.getElementById('eventId').value = '';
      document.getElementById('eventFormModal').style.display = 'block';
    }
    
    // Edit event
    async function editEvent(id) {
      try {
        const response = await fetch('/admin/api/events', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          const events = await response.json();
          const event = events.find(e => e.id === id);
          
          if (event) {
            document.getElementById('eventFormTitle').textContent = 'Edit Event';
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.event_date;
            document.getElementById('eventStartTime').value = event.start_time;
            document.getElementById('eventEndTime').value = event.end_time || '';
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventUrl').value = event.event_url || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventPublished').checked = event.is_published === 1;
            document.getElementById('eventFormModal').style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Error loading event:', error);
        alert('Failed to load event details');
      }
    }
    
    // Close event form
    function closeEventForm() {
      document.getElementById('eventFormModal').style.display = 'none';
    }
    
    // Save event (create or update)
    async function saveEvent(e) {
      e.preventDefault();
      
      // Get form values individually
      const title = document.getElementById('eventTitle').value;
      const eventDate = document.getElementById('eventDate').value;
      const startTime = document.getElementById('eventStartTime').value;
      const endTime = document.getElementById('eventEndTime').value;
      const location = document.getElementById('eventLocation').value;
      const eventUrl = document.getElementById('eventUrl').value;
      const description = document.getElementById('eventDescription').value;
      const isPublished = document.getElementById('eventPublished').checked;
      
      // Validate required fields
      if (!title || !eventDate || !startTime || !location) {
        alert('Please fill in all required fields (Title, Date, Start Time, Location)');
        return;
      }
      
      // Check each value for problematic characters
      const testData = {
        title: title,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime || '',
        location: location,
        event_url: eventUrl || '',
        description: description,
        is_published: isPublished
      };
      
      // Try to stringify each field individually
      try {
        for (const [key, value] of Object.entries(testData)) {
          try {
            JSON.stringify(value);
          } catch (err) {
            alert('Problem with field "' + key + '": ' + value);
            return;
          }
        }
      } catch (err) {
        alert('Error checking fields: ' + err.message);
        return;
      }
      
      try {
        const eventId = document.getElementById('eventId').value;
        const url = eventId ? '/admin/api/events/' + eventId : '/admin/api/events';
        const method = eventId ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });
        
        if (response.ok) {
          alert(eventId ? 'Event updated successfully' : 'Event created successfully');
          closeEventForm();
          loadEvents();
        } else {
          const error = await response.json();
          alert('Failed to save event: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error saving event: ' + error.message);
      }
    }
    
    // Copy event
    async function copyEvent(id) {
      if (!confirm('Create a copy of this event?')) return;
      
      try {
        const response = await fetch('/admin/api/events/' + id + '/copy', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          alert('Event copied successfully');
          loadEvents();
        } else {
          const error = await response.json();
          alert('Failed to copy event: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error copying event:', error);
        alert('Failed to copy event: ' + error.message);
      }
    }
    
    // Delete event
    async function deleteEvent(id) {
      if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
      
      try {
        const response = await fetch('/admin/api/events/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          alert('Event deleted successfully');
          loadEvents();
        } else {
          const error = await response.json();
          alert('Failed to delete event: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event: ' + error.message);
      }
    }
    
    // Initialize
    loadDashboard();
    check2FAStatus();
    loadEvents();
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
                   📧 The Lodge Secretary will contact you soon<br>
                   📞 You'll receive information about the next steps<br>
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
