/**
 * Links Page Component
 * 
 * Renders the Links page with Masonic resources
 * and research lodge links.
 * 
 * @module pages/links
 */

import { BasePage } from './base';

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
          <li><a href="https://www.scottishrite.org" target="_blank" rel="noopener">Scottish Rite Southern Jurisdiction</a></li>
          <li><a href="https://www.yorkrite.org" target="_blank" rel="noopener">York Rite</a></li>
        </ul>
        
        <h2>Research Lodges</h2>
        <ul class="links-list">
          <li><a href="https://www.quatuorcoronati.com" target="_blank" rel="noopener">Quatuor Coronati Lodge No. 2076</a></li>
          <li><a href="https://www.masonicworld.com" target="_blank" rel="noopener">Masonic World</a></li>
        </ul>
      </div>
    </section>
  `, 'links');
}
