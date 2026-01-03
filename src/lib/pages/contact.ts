/**
 * Contact Page Component
 * 
 * Renders the Contact page with meeting information,
 * map links, and contact form.
 * 
 * @module pages/contact
 */

import { BasePage } from './base';

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
