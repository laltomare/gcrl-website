# Golden Compasses Research Lodge - TODO & Future Tasks

## 🚨 PRIORITY: Update Secretary Email

**Status**: 🔴 URGENT - Currently using placeholder email

**Current Setting**:
- File: `wrangler.toml` (line 21)
- Value: `lawrence@altomare.org` (placeholder)
- This email receives ALL form submissions (contact forms, membership requests)

**Action Required**:
When you receive Bill's secretary's email address:

1. Open `wrangler.toml` in a text editor
2. Find line 21:
   ```toml
   SECRETARY_EMAIL = "lawrence@altomare.org" # TODO: Update to Bill's secretary email when available
   ```
3. Replace `lawrence@altomare.org` with the actual secretary email
4. Save the file
5. Deploy changes:
   ```bash
   npm run deploy
   ```
6. Test by submitting a contact form and verify email arrives at the new address

**Why This Matters**:
- Contact form submissions are emailed to this address
- Membership requests are emailed to this address
- Currently going to placeholder (lawrence@altomare.org)
- Need to redirect to Bill's secretary for actual responses

---

## 📋 Optional Future Tasks

### 1. Domain DNS Configuration (When You Get DNS Access)

**Status**: ⏳ Waiting for DNS access

**Tasks**:
1. Point `goldencompasses.org` to your Cloudflare Worker
2. Add SPF record for better email deliverability:
   ```
   TXT: v=spf1 include:resend.com ~all
   ```
3. Optional: Add DKIM record (Resend provides this)

**Benefits**:
- Professional domain URL (not workers.dev subdomain)
- Better email deliverability
- Branded emails from `@goldencompasses.org`

---

### 2. Admin Panel Error 1101

**Status**: 🔧 Known issue, not critical

**Description**: Admin panel shows Error 1101 when accessing

**Impact**: 
- Admin can still manage documents via API
- Can still view membership requests via API
- Just the web UI has an issue

**Fix Required**: Debug routing/authentication issue in admin panel

**Priority**: Low - functionality works via API

---

## ✅ Completed Tasks

- [x] Security audit and hardening
- [x] Email notification system (Resend)
- [x] Thank you pages for forms
- [x] Form submission UX improvements
- [x] Rate limiting implementation
- [x] Security logging
- [x] Input sanitization
- [x] Deployment to Cloudflare Workers

---

## 📞 Quick Reference

**Live Site**: https://gcrl-website.lawrence-675.workers.dev

**Contact Form**: https://gcrl-website.lawrence-675.workers.dev/contact

**Membership Form**: https://gcrl-website.lawrence-675.workers.dev/join

**Admin Dashboard**: https://gcrl-website.lawrence-675.workers.dev/admin

**Email Service**: Resend (3,000 emails/month free)

**Database**: Cloudflare D1

**Storage**: Cloudflare R2

---

## 🔄 Regular Maintenance

**Weekly**:
- Check for new form submissions
- Review security logs

**Monthly**:
- Review email deliverability
- Check rate limiting effectiveness

**As Needed**:
- Update content in pages
- Add/remove library documents
- Rotate passwords (optional)

---

*Last Updated: January 1, 2026*
