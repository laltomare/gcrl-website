# 🚀 Deployment Checklist for Golden Compasses Website

**Status**: Code Complete ✅ | **Next Steps**: Cloudflare Setup

---

## ✅ Completed So Far

- [x] Project structure created
- [x] TypeScript configuration set up
- [x] All source code written (pages, auth, security, styling)
- [x] Database schema created
- [x] Assets (logo, images) added
- [x] Committed to Git
- [x] Pushed to GitHub (https://github.com/laltomare/gcrl-website)

---

## 📋 Remaining Setup Steps

### Step 1: Create Cloudflare D1 Database

```bash
cd /Users/lawrencealtomare/gcrl-website
npm run d1:create
```

**Expected output:**
```
✅ Successfully created D1 database 'gcrl-documents'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Action Required:**
1. Copy the database_id
2. Open `wrangler.toml`
3. Replace `YOUR_D1_DATABASE_ID` with the actual ID

```toml
[[d1_databases]]
binding = "DB"
database_name = "gcrl-documents"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Paste here
```

---

### Step 2: Initialize Database Tables

```bash
npm run d1:execute
```

**Expected output:**
```
🌀 Executing on remote database gcrl-documents:
✅ Successfully executed 12 commands
```

---

### Step 3: Create R2 Storage Bucket

```bash
wrangler r2 bucket create gcrl-documents
```

**Expected output:**
```
✅ Created bucket gcrl-documents
```

---

### Step 4: Upload Assets to R2

```bash
# Upload CSS
wrangler r2 object put gcrl-documents/styles.css --file=src/styles.css

# Upload logo
wrangler r2 object put gcrl-documents/logo.png --file=public/logo.png

# Upload background images
wrangler r2 object put gcrl-documents/hero.jpg --file=public/hero.jpg
wrangler r2 object put gcrl-documents/background.jpg --file=public/background.jpg
```

**Expected output:**
```
✅ Uploaded object styles.css
✅ Uploaded object logo.png
✅ Uploaded object hero.jpg
✅ Uploaded object background.jpg
```

---

### Step 5: Set Environment Secrets

This is CRITICAL for security. Set two passwords:

#### 5a. Set Admin Password

```bash
wrangler secret put ADMIN_PASSWORD
```

**When prompted, enter a password (minimum 14 characters):**

Example strong passwords:
- `Golden$Compass2024` (18 chars)
- `NorthStar7!Research` (18 chars)
- `Lodge#Square7` (14 chars)

**Password Requirements:**
- Minimum 14 characters
- At least 3 of: uppercase, lowercase, numbers, symbols
- Avoid common words (password, lodge, compass, etc.)

#### 5b. Set Library Password

```bash
wrangler secret put LIBRARY_PASSWORD
```

**When prompted, enter a DIFFERENT password:**

Example:
- `Ashlar9!Stone` (14 chars)
- `CarpenterLevel2025!` (18 chars)

**⚠️ IMPORTANT:** 
- Save these passwords securely (password manager recommended)
- Share LIBRARY_PASSWORD with lodge members for document access
- Keep ADMIN_PASSWORD for lodge secretary/webmaster only

---

### Step 6: Deploy to Cloudflare Workers

```bash
npm run deploy
```

**Expected output:**
```
✅ Successfully published your Worker to
  https://gcrl-website.YOUR_SUBDOMAIN.workers.dev
```

**Action Required:**
1. Copy the Workers.dev URL
2. Test it in your browser: https://gcrl-website.YOUR_SUBDOMAIN.workers.dev
3. Verify all pages load correctly

---

### Step 7: Configure Custom Domain

#### Option A: New Domain (recommended for testing)

Skip this step if you want to test with the Workers.dev URL first.

#### Option B: Point goldencompasses.org to Workers

**⚠️ CRITICAL WARNING:** The current goldencompasses.org site is compromised with spam. Only do this when ready for production.

**Steps:**

1. **Log into Cloudflare Dashboard** → Select goldencompasses.org

2. **Go to DNS → Records**

3. **Update A Record:**
   - Name: `@` (root)
   - IPv4 address: Delete current, point to your Worker
   - Proxy status: **Proxied** (orange cloud) ✅

4. **Alternative: Use CNAME Flattening:**
   - Delete A record for `@`
   - Add CNAME: `@` → `gcrl-website.YOUR_SUBDOMAIN.workers.dev`
   - Proxy status: **Proxied** (orange cloud) ✅

5. **Update www:**
   - CNAME: `www` → `@` (or your Workers.dev URL)
   - Proxy status: **Proxied** (orange cloud) ✅

6. **Wait for DNS propagation** (5-30 minutes)

7. **Test:**
   - Go to https://goldencompasses.org
   - Verify new site loads
   - Check all pages work

---

### Step 8: Configure Cloudflare Security

**Go to:** Cloudflare Dashboard → goldencompasses.org → Security

#### 8a. Security Settings
```
Security Level: Medium
Bot Fight Mode: ON (Free)
```

#### 8b. WAF (Web Application Firewall)

**Go to:** Security → WAF → Custom rules

**Add these rules:**

**Rule 1: Block SQL Injection**
```
Field: URI Path
Operator: contains
Value: "union select"
Action: Block
```

**Rule 2: Block Common Attack Patterns**
```
Field: URI Path
Operator: contains regex
Value: "(\.\./|http:\/\/|https:\/\/).*\.php"
Action: Block
```

**Rule 3: Rate Limit Admin Login** (if available in free tier)
```
When: requests to /admin
Rate limit: 3 per 15 minutes
Action: Challenge
```

---

### Step 9: Test Admin Dashboard

1. **Go to:** `https://your-domain.com/admin/login`

2. **Enter admin password** (from Step 5a)

3. **Verify you can access:**
   - Dashboard overview
   - Document list
   - Membership requests

---

### Step 10: Upload Sample Documents (Optional)

1. **Login to admin dashboard**

2. **Click "Upload Document"**

3. **Fill in:**
   - Upload a PDF file
   - Title
   - Description
   - Category

4. **Test:**
   - Go to `/library` - verify document shows
   - Try downloading - verify password prompt

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Home page loads correctly
- [ ] All navigation links work
- [ ] About page displays
- [ ] Library page shows (even if empty)
- [ ] Links page works
- [ ] Contact page displays meeting schedule
- [ ] Join page form submits
- [ ] Admin login works with admin password
- [ ] Admin dashboard loads
- [ ] Security headers present (check browser DevTools)
- [ ] Site is responsive on mobile
- [ ] DNS records are proxied (orange cloud)

---

## 🛡️ Security Monitoring

### Week 1: Daily Checks

1. **Cloudflare Dashboard** → Analytics
   - Check for traffic spikes
   - Review threats blocked

2. **Security Logs:**
   ```bash
   wrangler d1 execute gcrl-documents --command "SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 20"
   ```

3. **Monitor:**
   - Failed login attempts
   - Unusual download attempts
   - High-frequency requests from single IPs

### Week 2+: Weekly Checks

- Review security logs
- Check for new membership requests
- Verify rate limiting is working
- Update passwords (monthly)

---

## 📞 Troubleshooting

### Issue: Site won't load

**Check:**
```bash
wrangler tail
```
This shows real-time logs from your Worker.

### Issue: Images/CSS not loading

**Verify R2 objects:**
```bash
wrangler r2 object list gcrl-documents
```

**Expected output:**
```
styles.css
logo.png
hero.jpg
background.jpg
```

### Issue: Database errors

**Verify D1:**
```bash
wrangler d1 info gcrl-documents
```

**Check tables:**
```bash
wrangler d1 execute gcrl-documents --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Issue: Password not working

**Reset secrets:**
```bash
wrangler secret put ADMIN_PASSWORD
# Enter new password

wrangler secret put LIBRARY_PASSWORD
# Enter new password
```

Then redeploy:
```bash
npm run deploy
```

---

## 📚 Important Links

- **GitHub Repository:** https://github.com/laltomare/gcrl-website
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Wrangler Documentation:** https://developers.cloudflare.com/workers/wrangler/

---

## ✨ Success Criteria

You'll know everything is working when:

✅ Home page displays with hero banner
✅ Navigation menu works on all pages
✅ Library page shows documents (even if empty)
✅ Admin login works with your password
✅ Admin dashboard displays
✅ Forms submit successfully
✅ No console errors in browser
✅ Mobile version looks good
✅ Security headers are present

---

## 🎉 Next Steps After Launch

1. **Populate Library** - Upload Masonic research papers
2. **Share with Members** - Distribute LIBRARY_PASSWORD
3. **Monitor Activity** - Check security logs weekly
4. **Collect Feedback** - Ask members to test downloads
5. **Iterate** - Add features based on feedback

---

## 📱 Future Enhancements

### Progressive Web App (PWA) - Deferred
**Status:** Ready for future deployment when user requests testing
**Decision:** Removed during mobile navigation troubleshooting (Dec 30, 2025)

**To Deploy PWA Later:**
- [ ] Re-add PWA manifest.json to public/
- [ ] Re-add service worker registration to pages.ts
- [ ] Re-add PWA icons (icon-192.png, icon-512.png)
- [ ] Test PWA installation on mobile devices
- [ ] Verify offline functionality
- [ ] Test caching behavior
- [ ] Deploy and monitor for any navigation artifacts

**Current State:** Site uses simple, clean navigation without mobile menu toggle. Responsive design works naturally for all sections.

**Note:** PWA was temporarily removed to troubleshoot mobile navigation artifacts. The functionality is preserved in source files and can be re-added when ready for testing.

---

**Created:** December 28, 2025  
**Last Updated:** December 30, 2025  
**Status:** ✅ **LIVE** - Deployed to Cloudflare Workers
**Version:** v18 (Clean navigation, no hamburger menu)
