/**
 * Home Page Component
 * 
 * Renders the home page with hero section, mission statement,
 * and upcoming events section.
 * 
 * @module pages/home
 */

import { BasePage } from './base';

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
