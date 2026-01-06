/**
 * Base Page Component
 * 
 * Provides the HTML template generator and base page layout
 * with navigation header and footer.
 * 
 * @module pages/base
 */

// Site constants
const SITE_NAME = 'Golden Compasses Research Lodge';
const SITE_DESCRIPTION = 'Advancing Masonic knowledge through research and education';

/**
 * HTML utility object with helper methods
 */
export const HTML = {
  /**
   * Escape HTML special characters to prevent XSS
   */
  escape(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },
};

/**
 * HTML Template generator
 * Creates a Response object with HTML content type
 */
export function HTMLResponse(strings: TemplateStringsArray, ...values: any[]): Response {
  const html = String.raw(strings, ...values);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Base page layout with navigation
 * Provides consistent header, navigation, and footer for all pages
 * 
 * @param title - Page title
 * @param content - Page content HTML
 * @param currentPage - Current page identifier for active nav highlighting
 */
export function BasePage(title: string, content: string, currentPage: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">  
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${SITE_NAME}</title>
  <meta name="description" content="${SITE_DESCRIPTION}">
  <meta name="theme-color" content="#C2A43B">
  <link rel="stylesheet" href="/styles.css?v=21">
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
