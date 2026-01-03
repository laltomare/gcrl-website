/**
 * Thank You Page Component
 * 
 * Renders the Thank You page displayed after form submissions.
 * Supports both contact and membership request forms.
 * 
 * @module pages/thank-you
 */

import { BasePage } from './base';

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
