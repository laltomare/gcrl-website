/**
 * Library Pages Component
 * 
 * Renders the library page and document detail page.
 * 
 * @module pages/library
 */

import { BasePage } from './base';

/**
 * HTML escape utility function
 * Sanitizes user input to prevent XSS attacks
 */
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

/**
 * Library page (public view - titles and descriptions only)
 */
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

/**
 * Document detail page with password protection
 */
export function DocumentDetailPage(document: any, error: string = ''): string {
  return BasePage(document.title, `
    <section class="page-header">
      <div class="container">
        <h1>${escapeHtml(document.title)}</h1>
      </div>
    </section>
    
    <section class="content-section">
      <div class="container">
        <div class="document-detail">
          ${error ? `<div class="error-message">${escapeHtml(error)}</div>` : ''}
          
          <div class="document-info">
            <h2>Document Information</h2>
            <p><strong>Title:</strong> ${escapeHtml(document.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(document.description || 'No description available.')}</p>
            <p><strong>Category:</strong> ${escapeHtml(document.category || 'General')}</p>
            <p><strong>Uploaded:</strong> ${new Date(document.upload_date).toLocaleDateString()}</p>
          </div>
          
          <div class="document-download">
            <h2>Download Document</h2>
            <p>This document is available to Golden Compasses Research Lodge members. Please enter the library password to download.</p>
            
            <form method="POST" action="/library/${document.id}/download" class="password-form">
              <div class="form-group">
                <label for="password">Library Password:</label>
                <input type="password" id="password" name="password" required autofocus>
              </div>
              <button type="submit" class="btn btn-primary">Download PDF</button>
            </form>
          </div>
        </div>
      </div>
    </section>
    
    <style>
      .document-detail {
        max-width: 800px;
        margin: 0 auto;
      }
      
      .document-info {
        background: rgba(194, 164, 59, 0.1);
        border: 1px solid #C2A43B;
        border-radius: 8px;
        padding: 2rem;
        margin-bottom: 2rem;
      }
      
      .document-info h2 {
        color: #C2A43B;
        margin-top: 0;
      }
      
      .document-info p {
        margin: 0.75rem 0;
        line-height: 1.6;
      }
      
      .document-download {
        background: rgba(26, 42, 37, 0.5);
        border: 1px solid rgba(194, 164, 59, 0.3);
        border-radius: 8px;
        padding: 2rem;
      }
      
      .document-download h2 {
        color: #C2A43B;
        margin-top: 0;
      }
      
      .password-form {
        max-width: 400px;
      }
      
      .error-message {
        background: rgba(220, 38, 38, 0.2);
        border: 1px solid #dc2626;
        color: #fca5a5;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
      }
    </style>
  `, 'library');
}
