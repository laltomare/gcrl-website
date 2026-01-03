# GCRL Website - Quick Start Guide

**For New Conversation Sessions**

---

## 🚀 Start Here!

This document helps you quickly get up to speed with the GCRL Website project in a new Goose conversation.

---

## 📋 Project Overview

**What**: Golden Compasses Research Lodge (GCRL) Website
**Where**: Cloudflare Workers (serverless edge computing)
**Tech Stack**: TypeScript, Cloudflare D1 (SQLite), Cloudflare R2
**Repository**: https://github.com/laltomare/gcrl-website.git
**Dev URL**: `https://gcrl-website.lawrence-675.workers.dev` ⭐ **USE THIS FOR TESTING**

---

## 📁 Context Documents

All context is stored in the `context/` directory:

1. **SESSION_SUMMARY.md** - What was done in previous sessions
2. **TECHNICAL_ARCHITECTURE.md** - Complete technical reference
3. **NEXT_STEPS.md** - Detailed implementation plan for next tasks
4. **schema_users.sql** - Database schema for user management
5. **QUICK_START.md** - This file

**Start by reading**: `context/SESSION_SUMMARY.md` then `context/NEXT_STEPS.md`

---

## ⚡ Quick Commands

### Navigate to Project
```bash
cd /Users/lawrencealtomare/Downloads/gcrl-website
```

### Check Git Status
```bash
git status
git log --oneline -10
```

### Deploy to Cloudflare
```bash
npx wrangler deploy
```

### Database Operations
```bash
# List tables
npx wrangler d1 execute gcrl-documents --command=".schema"

# Query users
npx wrangler d1 execute gcrl-documents --command="SELECT * FROM users LIMIT 10"

# Apply schema
npx wrangler d1 execute gcrl-documents --file=context/schema_users.sql
```

---

## 🎯 Current Status

### ✅ Recently Completed (Jan 3, 2026)
- Phase 1 Refactor: Route Organization (100% complete)
- Extracted page components to `src/lib/pages/`
- Created route documentation in `src/routes/`
- Removed dead links from Links page
- All tested and deployed

### 🔄 Next Priority
**User CRUD System** - See `context/NEXT_STEPS.md` for full details

---

## 🏗️ Project Structure

```
gcrl-website/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript types
│   ├── lib/
│   │   ├── pages/            # Modular page components ⭐ NEW
│   │   ├── db.ts             # Database utilities
│   │   ├── email.ts          # Email utilities
│   │   └── auth.ts           # Authentication
│   └── routes/               # Route documentation ⭐ NEW
├── context/                  # Session context documents ⭐ NEW
├── wrangler.toml             # Cloudflare config
└── package.json
```

---

## 🔑 Important Notes

### ⚠️ Critical: Use Development URL
- **ALWAYS test on**: `https://gcrl-website.lawrence-675.workers.dev`
- **NEVER test on**: `https://goldencompasses.org` (compromised site)

### 📦 Dependencies
```json
{
  "otpauth": "^9.4.1"
}
```
**Note**: Hono framework is intentionally NOT installed.

### 🔐 Authentication
- Uses OTP-based authentication (via email)
- Two-factor authentication (2FA) enabled
- Session management with expiration

---

## 🗄️ Database Tables (Current)

### Existing Tables
- `documents` - Document management
- `events` - Events system ✨ (recently completed)
- `membership_requests` - Membership applications
- `admin_sessions` - Admin authentication
- `two_factor_tokens` - 2FA support

### To Be Created (Next Task)
- `users` - User management
- `sessions` - User sessions

---

## 🎨 What the Code Does

### Public Pages
- Home, About, Library, Links, Contact, Join
- Contact form → Email via Resend API
- Membership form → Stored in database

### Admin Panel
- OTP-based login
- 2FA verification
- Document management
- Events CRUD
- Membership request management

### Next: User Management
- Create, Read, Update, Delete users
- Role-based permissions (admin, secretary, member, guest)
- Session management

---

## 🧪 Testing Checklist

### Manual Testing (Completed ✅)
- [x] All public pages render correctly
- [x] Contact form works
- [x] Membership form works
- [x] Admin login works
- [x] 2FA verification works
- [x] Document downloads work
- [x] Events display correctly
- [x] Links page (dead links removed)

### Next Testing (User CRUD)
- [ ] Create user
- [ ] List users
- [ ] Edit user
- [ ] Delete user
- [ ] Change roles
- [ ] Session management

---

## 📊 Session History

### Previous Session (Before This One)
- Completed: Admin Panel
- Completed: Events System
- Completed: Routing fixes

### This Session (Jan 3, 2026)
- Completed: Phase 1 Refactor (Route Organization)
- Completed: Removed dead links
- Status: Ready for User CRUD implementation

---

## 🔄 Git Workflow

1. **Make changes**
2. **Commit**: `git add -A && git commit -m "description"`
3. **Push**: `git push origin main`
4. **Deploy**: `npx wrangler deploy`
5. **Test**: On `https://gcrl-website.lawrence-675.workers.dev`

---

## 💡 Common Tasks

### View a File
```bash
# Use text_editor tool to view
view /path/to/file
```

### Search Code
```bash
grep -r "search term" src/
```

### Check Deployment
```bash
npx wrangler deployments list
```

### View Logs
```bash
npx wrangler tail
```

---

## 🚨 Troubleshooting

### Build Fails
```bash
npx tsc --noEmit  # Check TypeScript errors
```

### Database Errors
```bash
npx wrangler d1 execute gcrl-documents --command=".schema"
```

### Deploy Fails
```bash
npx wrangler whoami  # Check authentication
```

---

## 📞 Key Information

### Repository
- **URL**: https://github.com/laltomare/gcrl-website.git
- **Branch**: `main`
- **Status**: Clean (all commits pushed)

### Cloudflare
- **Worker**: `gcrl-website`
- **Database**: `gcrl-documents` (D1)
- **Storage**: `gcrl-documents` (R2)

### Developer
- **Name**: Lawrence Altomare
- **Email**: lawrence@altomare.org
- **Role**: Admin/Secretary

---

## 🎓 Learning Resources

### Cloudflare Workers
- https://developers.cloudflare.com/workers/

### D1 Database
- https://developers.cloudflare.com/d1/

### Wrangler CLI
- https://developers.cloudflare.com/workers/wrangler/

---

## ✅ Ready to Start!

1. Read `context/SESSION_SUMMARY.md` (5 minutes)
2. Read `context/TECHNICAL_ARCHITECTURE.md` (10 minutes)
3. Read `context/NEXT_STEPS.md` (5 minutes)
4. Ask questions or start working!

**Total time to get up to speed: ~20 minutes**

---

## 🎯 Current Goal

Implement the **User CRUD System** as detailed in `context/NEXT_STEPS.md`

This includes:
- Creating `users` and `sessions` tables
- Building user management UI
- Implementing role-based permissions
- Testing and deployment

**Estimated time**: 2-3 hours

---

## 💬 How to Reference Context in New Session

When starting a new conversation, say:

> "I'm working on the GCRL website project. Please read the context documents in the context/ directory to understand the current state and next steps."

Then reference specific files as needed:
- "See context/SESSION_SUMMARY.md for what we've completed"
- "See context/NEXT_STEPS.md for the implementation plan"
- "See context/TECHNICAL_ARCHITECTURE.md for technical details"

---

**Good luck! 🚀**
