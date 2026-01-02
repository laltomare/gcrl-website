# 📋 Testing Checklist - Print Version
## Golden Compasses Research Lodge Website

**Date:** _______________  
**Tester:** _______________  
**Environment:** Development (gcrl-website.lawrence-675.workers.dev)

**Instructions:** Print this document and use it as a guide while testing. Check off each item as you complete it.

---

## SECTION 1: PUBLIC PAGES - NAVIGATION

### 1.1 Homepage Loads ☐
- Go to: https://gcrl-website.lawrence-675.workers.dev
- **PASS:** Page loads within 3 seconds
- **PASS:** You see the Golden Compasses logo at top
- **PASS:** Hero section with background image shows
- **FAIL:** Page slow, broken layout, or missing images
- **Notes:** _______________

---

### 1.2 Navigation Menu - Home Link ☐
- Click "Home" in the navigation menu
- **PASS:** You return to the homepage
- **PASS:** "Home" link is highlighted (shows it's active)
- **FAIL:** Nothing happens or wrong page loads
- **Notes:** _______________

---

### 1.3 Navigation Menu - About Link ☐
- Click "About" in the navigation menu
- **PASS:** About page loads
- **PASS:** You see "About Us" heading
- **PASS:** "About" link is highlighted
- **FAIL:** Page not found or navigation broken
- **Notes:** _______________

---

### 1.4 Navigation Menu - Library Link ☐
- Click "Library" in the navigation menu
- **PASS:** Library page loads
- **PASS:** You see "Document Library" heading
- **PASS:** "Library" link is highlighted
- **FAIL:** Page not found or navigation broken
- **Notes:** _______________

---

### 1.5 Navigation Menu - Links Link ☐
- Click "Links" in the navigation menu
- **PASS:** Links page loads
- **PASS:** You see "External Resources" heading
- **PASS:** "Links" link is highlighted
- **FAIL:** Page not found or navigation broken
- **Notes:** _______________

---

### 1.6 Navigation Menu - Contact Link ☐
- Click "Contact" in the navigation menu
- **PASS:** Contact page loads
- **PASS:** You see the contact form
- **PASS:** "Contact" link is highlighted
- **FAIL:** Page not found or navigation broken
- **Notes:** _______________

---

### 1.7 Navigation Menu - Join Link ☐
- Click "Join" in the navigation menu
- **PASS:** Membership page loads
- **PASS:** You see "Membership" heading
- **PASS:** "Join" link is highlighted
- **FAIL:** Page not found or navigation broken
- **Notes:** _______________

---

## SECTION 2: PUBLIC PAGES - CONTENT

### 2.1 Homepage Content ☐
- Look at the homepage
- **PASS:** Hero section has headline and text
- **PASS:** No strange symbols (like | or •) appear
- **PASS:** Text is readable and properly formatted
- **FAIL:** Missing content or strange artifacts
- **Notes:** _______________

---

### 2.2 About Page Content ☐
- Read the About page
- **PASS:** Information about the lodge displays
- **PASS:** No spelling errors you can see
- **PASS:** Layout looks professional
- **FAIL:** Missing content or layout broken
- **Notes:** _______________

---

### 2.3 Library Page - Document List ☐
- Go to Library page
- **PASS:** You see a list of documents
- **PASS:** Each document shows title and description
- **PASS:** Download buttons appear next to each document
- **FAIL:** No documents show or layout broken
- **Notes:** _______________

---

### 2.4 Library Page - Download Protection ☐
- On Library page, click a download button
- **PASS:** You're asked for a password
- **PASS:** Password box shows (bullets •••••• when typing)
- **FAIL:** File downloads without password (security issue!)
- **Notes:** _______________

---

### 2.5 Links Page - External Links ☐
- Go to Links page
- **PASS:** You see links to external websites
- **PASS:** Each link has a description
- **FAIL:** No links show or page broken
- **Notes:** _______________

---

### 2.6 Links Page - Links Work ☐
- Click one of the external links
- **PASS:** Link opens in new tab
- **PASS:** External website loads
- **FAIL:** Link doesn't work or error
- **Notes:** _______________

---

## SECTION 3: FORMS - CONTACT FORM

### 3.1 Contact Form Displays ☐
- Go to Contact page
- **PASS:** You see form fields for Name, Email, Message
- **PASS:** Submit button shows
- **FAIL:** Form missing or broken
- **Notes:** _______________

---

### 3.2 Contact Form - Empty Fields ☐
- Leave all fields blank
- Click "Send Message"
- **PASS:** Browser shows validation error
- **PASS:** Form doesn't submit
- **FAIL:** Form submits empty (bad!)
- **Notes:** _______________

---

### 3.3 Contact Form - Valid Submission ☐
- Fill in: Name, Email, Message
- Click "Send Message"
- **PASS:** Success message appears
- **PASS:** Message says "Thank you for contacting us"
- **FAIL:** Error message or no response
- **Notes:** _______________

---

## SECTION 4: FORMS - MEMBERSHIP FORM

### 4.1 Membership Form Displays ☐
- Go to Join page
- **PASS:** You see membership form fields
- **PASS:** Submit button shows
- **FAIL:** Form missing or broken
- **Notes:** _______________

---

### 4.2 Membership Form - Valid Submission ☐
- Fill in the membership form
- Click "Submit Application"
- **PASS:** Success message appears
- **PASS:** Confirmation message shows
- **FAIL:** Error or no response
- **Notes:** _______________

---

## SECTION 5: ADMIN - LOGIN

### 5.1 Admin Login Page ☐
- Go to: https://gcrl-website.lawrence-675.workers.dev/admin
- **PASS:** Login page loads
- **PASS:** You see password field
- **FAIL:** Page not found or broken
- **Notes:** _______________

---

### 5.2 Admin Login - Wrong Password ☐
- Enter wrong password
- Click "Login"
- **PASS:** Error message shows
- **PASS:** You stay on login page
- **FAIL:** You get logged in anyway (security issue!)
- **Notes:** _______________

---

### 5.3 Admin Login - Correct Password ☐
- Enter correct admin password
- Click "Login"
- **PASS:** You see admin dashboard
- **PASS:** You can see documents and requests
- **FAIL:** Error or can't log in
- **Notes:** _______________

---

### 5.4 Admin Logout ☐
- From admin dashboard, click "Logout"
- **PASS:** You return to login page
- **FAIL:** Nothing happens or error
- **Notes:** _______________

---

### 5.5 Admin - Can't Access Without Login ☐
- Open browser in incognito/private mode
- Go directly to: https://gcrl-website.lawrence-675.workers.dev/admin/dashboard
- **PASS:** You're redirected to login page
- **FAIL:** You can see dashboard without logging in (SECURITY ISSUE!)
- **Notes:** _______________

---

## SECTION 6: ADMIN - DOCUMENT MANAGEMENT

### 6.1 View All Documents ☐
- Log into admin dashboard
- **PASS:** You see a list of documents
- **PASS:** Each document shows title, category, date
- **FAIL:** No documents show or table broken
- **Notes:** _______________

---

### 6.2 Upload a Document ☐
- Click "Upload Document" button
- Fill in title, description, category
- Choose a PDF file
- Click "Upload"
- **PASS:** Success message appears
- **PASS:** Document appears in list
- **FAIL:** Error or document not added
- **Notes:** _______________

---

### 6.3 Delete a Document ☐
- Click delete button next to a document
- Confirm deletion
- **PASS:** Success message appears
- **PASS:** Document removed from list
- **FAIL:** Error or document still shows
- **Notes:** _______________

---

### 6.4 View Membership Requests ☐
- In admin dashboard, find "Membership Requests" section
- **PASS:** You see list of membership requests
- **PASS:** Each request shows name, email, date
- **FAIL:** No requests show or section broken
- **Notes:** _______________

---

## SECTION 7: MOBILE TESTING

### 7.1 Homepage on iPhone ☐
- Open site on iPhone
- **PASS:** Homepage loads correctly
- **PASS:** Navigation menu works
- **PASS:** No horizontal scrolling needed
- **FAIL:** Layout broken or hard to use
- **Notes:** _______________

---

### 7.2 Library Page on iPhone ☐
- On iPhone, go to Library page
- **PASS:** Document list is readable
- **PASS:** Download buttons work
- **FAIL:** Layout broken or unusable
- **Notes:** _______________

---

### 7.3 Forms on iPhone ☐
- On iPhone, try Contact form
- **PASS:** Form fields are tappable
- **PASS:** You can type in fields
- **PASS:** Submit button works
- **FAIL:** Can't use form on mobile
- **Notes:** _______________

---

### 7.4 Admin Dashboard on iPad ☐
- On iPad, log into admin
- **PASS:** Dashboard displays correctly
- **PASS:** You can manage documents
- **FAIL:** Layout broken or unusable
- **Notes:** _______________

---

## SECTION 8: BROWSER COMPATIBILITY

### 8.1 Safari on Mac ☐
- Open site in Safari (Mac)
- Test navigation, forms, library
- **PASS:** Everything works correctly
- **FAIL:** Features broken or errors
- **Notes:** _______________

---

### 8.2 Chrome on Mac ☐
- Open site in Google Chrome (Mac)
- Test navigation, forms, library
- **PASS:** Everything works correctly
- **FAIL:** Features broken or errors
- **Notes:** _______________

---

### 8.3 Chrome on Windows (If Available) ☐
- Open site in Chrome (Windows)
- Test navigation, forms, library
- **PASS:** Everything works correctly
- **FAIL:** Features broken or errors
- **Notes:** _______________

---

## SECTION 9: APPEARANCE & DESIGN

### 9.1 Colors Look Good ☐
- Look at the site overall
- **PASS:** Colors are professional (navy, gold, cream)
- **PASS:** Text is easy to read
- **FAIL:** Colors look wrong or text hard to read
- **Notes:** _______________

---

### 9.2 No Navigation Artifacts ☐
- Look closely at the navigation menu
- **PASS:** No strange symbols (|, •, etc.) appear
- **PASS:** Menu looks clean
- **FAIL:** You see strange characters or artifacts
- **Notes:** _______________

---

### 9.3 Logo and Images Load ☐
- Look at the homepage
- **PASS:** Golden Compasses logo shows
- **PASS:** Hero background image shows
- **FAIL:** Images missing or broken
- **Notes:** _______________

---

### 9.4 Text Is Readable ☐
- Read text on various pages
- **PASS:** Font size is comfortable
- **PASS:** Text has good contrast (not too light)
- **FAIL:** Text too small or hard to read
- **Notes:** _______________

---

## SECTION 10: PERFORMANCE

### 10.1 Page Load Speed ☐
- Count how long homepage takes to load
- **PASS:** Loads in under 3 seconds
- **FAIL:** Takes longer than 3 seconds
- **Notes:** _______________

---

### 10.2 Form Submission Speed ☐
- Submit contact form
- Count how long response takes
- **PASS:** Response within 2 seconds
- **FAIL:** Takes longer than 2 seconds
- **Notes:** _______________

---

## SECTION 11: SECURITY CHECKS

### 11.1 Passwords Are Hidden ☐
- Type password in login or form fields
- **PASS:** Shows as bullets (••••••)
- **FAIL:** Characters are visible (security issue)
- **Notes:** _______________

---

### 11.2 No Strange URLs ☐
- Look at the browser address bar
- **PASS:** URL looks normal
- **FAIL:** Strange characters or suspicious-looking URL
- **Notes:** _______________

---

### 11.3 Error Messages Don't Reveal Info ☐
- Try entering wrong password
- Read the error message
- **PASS:** Message is generic ("Invalid password")
- **FAIL:** Message reveals technical details (bad!)
- **Notes:** _______________

---

## SECTION 12: ACCESSIBILITY

### 12.1 Can Navigate with Keyboard ☐
- Use Tab key to move through page
- **PASS:** You can Tab through links and buttons
- **FAIL:** Can't navigate without mouse
- **Notes:** _______________

---

### 12.2 Text Can Be Made Larger ☐
- Try zooming in (Cmd + on Mac, Ctrl + on Windows)
- **PASS:** Page scales correctly
- **PASS:** Text gets larger
- **FAIL:** Layout breaks when zoomed
- **Notes:** _______________

---

## SUMMARY

### Total Tests Passed: _____ / 50

### Critical Issues Found (Must Fix):
1. _______________
2. _______________
3. _______________

### Minor Issues Found (Nice to Fix):
1. _______________
2. _______________
3. _______________

### Overall Assessment:
- [ ] Ready for production
- [ ] Needs fixes before production
- [ ] Major rework needed

### Testing Completed By: _______________
**Date:** _______________
**Time Spent:** _____ hours

---

## 📞 If You Find Problems

1. **Write down what you were doing** when the problem happened
2. **Note the error message** (if any appeared)
3. **Say which page** you were on
4. **Tell the AI:** "I found a problem testing Golden Compasses. Here's what happened..."

---

## ✅ Testing Tips

- **Take breaks** - Rest your eyes every 20-30 minutes
- **Test systematically** - Go in order through sections
- **Write notes** - Even small things are worth noting
- **Trust your instincts** - If something feels wrong, it probably is
- **Ask questions** - If you're not sure what to test, ask the AI
- **Be thorough** - You're checking if it's ready for real users

---

## 🎯 Testing Order Recommendation

**Session 1 (30-45 minutes):**
- Sections 1-3: Navigation, public pages, contact form

**Session 2 (30-45 minutes):**
- Sections 4-6: Membership form, admin login, document management

**Session 3 (30-45 minutes):**
- Sections 7-9: Mobile testing, browsers, appearance

**Session 4 (30-45 minutes):**
- Sections 10-12: Performance, security, accessibility

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Project:** Golden Compasses Research Lodge Website  
**Environment:** Development (gcrl-website.lawrence-675.workers.dev)
