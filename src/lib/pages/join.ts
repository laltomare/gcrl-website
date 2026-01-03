/**
 * Join Page Component
 * 
 * Renders the Join page with membership requirements,
 * benefits, and membership request form.
 * 
 * @module pages/join
 */

import { BasePage } from './base';

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
