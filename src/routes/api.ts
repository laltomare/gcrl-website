/**
 * API Routes
 * Endpoints for form submissions and data retrieval
 */
import { Hono } from 'hono';
import { Env } from '../types';
import { addSecurityHeaders } from '../lib/headers';
import { getClientIP, checkRateLimit, logSecurityEvent } from '../lib/auth';
import { sanitizeInput } from '../lib/sanitize';

const apiRoutes = new Hono<{ Bindings: Env }>();

// Email sending function using Resend
async function sendEmail(env: Env, to: string, subject: string, content: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Golden Compasses Research Lodge <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        text: content,
      }),
    });

    if (response.ok) {
      console.log(`Email sent successfully to ${to}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Failed to send email to ${to}: ${response.status} ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * POST /api/contact
 * Handle contact form submissions
 * - Validates input (name, email, message required)
 * - Rate limited (5 attempts per 15 minutes)
 * - Stores in database
 * - Sends email notification to secretary
 * - Logs security event
 */
apiRoutes.post('/contact', async (c) => {
  const ip = getClientIP(c.req.raw);
  const env = c.env;

  // Rate limiting
  if (!checkRateLimit(ip)) {
    await logSecurityEvent(env, 'RATE_LIMIT_EXCEEDED', c.req.raw, 'Contact form');
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  try {
    const data = await c.req.json();
    const name = sanitizeInput(data.name || '');
    const email = sanitizeInput(data.email || '');
    const subject = sanitizeInput(data.subject || '');
    const message = sanitizeInput(data.message || '');

    if (!name || !email || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Store in database
    await env.DB.prepare(
      'INSERT INTO membership_requests (name, email, phone, message, submitted_date, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, subject, message, new Date().toISOString(), 'contact').run();

    await logSecurityEvent(env, 'CONTACT_SUBMISSION', c.req.raw, `From: ${name} (${email})`);

    // Send email notification
    const emailContent = `You have received a new contact form submission from the Golden Compasses website.

CONTACT INFORMATION:
---------------------
Name: ${name}
Email: ${email}
Subject: ${subject}

MESSAGE:
--------
${message}

SUBMITTED: ${new Date().toLocaleString()}

---
View this submission in the admin dashboard: ${env.SITE_URL}/admin`;

    await sendEmail(env, env.SECRETARY_EMAIL, '🔔 New Contact Form Submission - Golden Compasses Lodge', emailContent);

    return c.json({ success: true, redirect: '/thank-you?type=contact' });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return c.json({ error: 'Invalid request', details: error.message }, 400);
  }
});

/**
 * POST /api/join
 * Handle membership request submissions
 * - Validates input (name, email required)
 * - Rate limited (5 attempts per 15 minutes)
 * - Stores in database with 'pending' status
 * - Sends email notification to secretary
 * - Logs security event
 */
apiRoutes.post('/join', async (c) => {
  const ip = getClientIP(c.req.raw);
  const env = c.env;

  // Rate limiting
  if (!checkRateLimit(ip)) {
    await logSecurityEvent(env, 'RATE_LIMIT_EXCEEDED', c.req.raw, 'Membership request');
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  try {
    const data = await c.req.json();
    const name = sanitizeInput(data.name || '');
    const email = sanitizeInput(data.email || '');
    const phone = sanitizeInput(data.phone || '');
    const interests = sanitizeInput(data.interests || '');
    const message = sanitizeInput(data.message || '');

    if (!name || !email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    // Store in database
    await env.DB.prepare(
      'INSERT INTO membership_requests (name, email, phone, message, submitted_date, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, phone, `${interests}\n\n${message}`, new Date().toISOString(), 'pending').run();

    await logSecurityEvent(env, 'MEMBERSHIP_REQUEST', c.req.raw, `From: ${name} (${email})`);

    // Send email notification
    const emailContent = `You have received a new membership request from the Golden Compasses website.

CONTACT INFORMATION:
---------------------
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}

AREAS OF INTEREST:
------------------
${interests || 'Not specified'}

ADDITIONAL MESSAGE:
-------------------
${message || 'No additional message provided.'}

SUBMITTED: ${new Date().toLocaleString()}

---
View this submission in the admin dashboard: ${env.SITE_URL}/admin`;

    await sendEmail(env, env.SECRETARY_EMAIL, '🎉 New Membership Request - Golden Compasses Lodge', emailContent);

    return c.json({ 
      success: true, 
      redirect: '/thank-you?type=join'
    });
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

/**
 * GET /api/events
 * Get upcoming events
 * - Returns next 3 published events
 * - Public endpoint (no authentication required)
 * - Ordered by event date ascending
 */
apiRoutes.get('/events', async (c) => {
  const env = c.env;

  try {
    const events = await env.DB.prepare(`
      SELECT * FROM events 
      WHERE event_date >= DATE('now')
        AND is_published = 1
      ORDER BY event_date ASC
      LIMIT 3
    `).all();

    return c.json(events.results || []);
  } catch (error) {
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

export default apiRoutes;
