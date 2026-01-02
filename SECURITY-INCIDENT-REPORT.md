# 🚨 SECURITY INCIDENT: Resend API Key Exposed

## Date: January 1, 2026
## Severity: 🔴 CRITICAL

### What Happened

GitHub detected that the Resend API key was committed to the repository in `wrangler.toml`.

**Exposed Key**: `re_3JAMDKVZ_4TrWTnkYRcipWtCoyFv68brt`
**Exposed In**: Commit `b577df7` (pushed Jan 2, 2026)
**File**: `wrangler.toml`

---

## ⚡ IMMEDIATE ACTIONS REQUIRED

### 1. REVOKE THE EXPOSED API KEY (DO THIS NOW!)

1. Go to https://resend.com/api-keys
2. Find the API key: `re_3JAMDKVZ_4TrWTnkYRcipWtCoyFv68brt`
3. **Click "Delete" or "Revoke"**
4. Confirm deletion

⚠️ **This will IMMEDIATELY stop email delivery from your website**

---

### 2. CREATE A NEW API KEY

1. At https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name like "GCRL Website Production"
4. Copy the new key (you'll need it in step 3)

---

### 3. UPDATE CLOUDFLARE WORKERS SECRETS

After revoking the old key and creating a new one:

```bash
# Navigate to project directory
cd /Users/lawrencealtomare/Downloads/gcrl-website

# Set the new API key as a Cloudflare secret
npx wrangler secret put RESEND_API_KEY
# When prompted, paste your NEW API key

# Deploy to apply changes
npx wrangler deploy
```

---

### 4. CLEAN GIT HISTORY

The exposed key is in commit `b577df7`. Options to remove it:

**Option A: Use BFG Repo-Cleaner (Recommended)**
```bash
# Install BFG
brew install bfg

# Clean the key from history
cd /Users/lawrencealtomare/Downloads/gcrl-website
bfg --replace-text passwords.txt  # Create passwords.txt with the API key
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Option B: Manual Git History Rewrite**
```bash
cd /Users/lawrencealtomare/Downloads/gcrl-website
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch wrangler.toml" \
  --prune-empty --tag-name-filter cat -- --all
git push --force --all
```

**Option C: Start Fresh (Simplest)**
- If the repository is new/not critical, you can:
  1. Delete the `.git` folder
  2. Reinitialize: `git init`
  3. Add all files WITHOUT the API key
  4. Force push: `git push --force origin main`

---

## ✅ WHAT I'VE ALREADY DONE

1. **Removed the API key from `wrangler.toml`**
   - Added comment: `# RESEND_API_KEY is set via: wrangler secret put RESEND_API_KEY`
   - Added warning: `# Never commit API keys to git!`

2. **Updated local wrangler.toml** (not yet committed)

---

## 🔒 PREVENTING FUTURE EXPOSURE

### Best Practices Implemented:

1. ✅ **API keys stored as Cloudflare secrets** (not in code)
2. ✅ **`.gitignore` configured** to prevent committing sensitive files
3. ✅ **Warning comments added** to wrangler.toml

### Additional Recommendations:

1. **Add a pre-commit hook** to prevent secrets from being committed:
   ```bash
   # Install git-secrets
   brew install git-secrets
   git secrets --install
   git secrets --register-aws
   git secrets --add 're_.*'  # Block Resend keys
   ```

2. **Enable GitHub secret scanning** (already alerted you - working!)

3. **Use environment-specific secrets**:
   - Development: Use test API keys
   - Production: Use production API keys

---

## 📊 IMPACT ASSESSMENT

### Current Status:
- ⚠️ **Email service still WORKING** (old key hasn't been revoked yet)
- ⚠️ **Key is EXPOSED in GitHub repository history**
- ✅ **No other secrets were exposed** (ADMIN_PASSWORD and LIBRARY_PASSWORD are correctly stored as secrets)

### Risks:
- Anyone with access to your GitHub repository can see the API key
- They could send emails using your Resend account
- They could use up your 3,000/month email quota

### Mitigation:
- Revoke the key immediately (stops unauthorized use)
- Create a new key (restores your email functionality)
- Clean git history (removes the key from public view)

---

## 🎯 QUICK START CHECKLIST

Copy and paste these commands after revoking the old key:

```bash
# 1. Navigate to project
cd /Users/lawrencealtomare/Downloads/gcrl-website

# 2. Set new API key as secret (paste when prompted)
npx wrangler secret put RESEND_API_KEY

# 3. Deploy
npx wrangler deploy

# 4. Commit the changes (without the API key)
git add wrangler.toml
git commit -m "security: Move RESEND_API_KEY to secrets

Remove API key from wrangler.toml and store as Cloudflare secret
to prevent exposure in git history."

# 5. Push to GitHub
git push origin main

# 6. Test email delivery
curl -X POST https://gcrl-website.lawrence-675.workers.dev/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Security Test","email":"test@example.com","subject":"Post-Security Fix Test","message":"Testing that email still works after API key rotation"}'
```

---

## 📞 NEED HELP?

If you need assistance with any of these steps:

1. **Resend Support**: https://resend.com/docs/support
2. **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
3. **GitHub Security**: https://docs.github.com/en/code-security

---

## 📝 NOTES

- The API key was ONLY exposed in GitHub (not in logs, error messages, or other places)
- The key was committed by mistake (intention to use Cloudflare secrets was correct)
- No user data was exposed (only API key)
- The fix is straightforward: revoke old key, create new one, update secrets

---

**IMPORTANT**: Complete steps 1-3 immediately to restore security and email functionality!
