/**
 * About Page Component
 * 
 * Renders the About page with lodge information,
 * purpose, and membership details.
 * 
 * @module pages/about
 */

import { BasePage } from './base';

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
