# Contributing to Golden Compasses Research Lodge Website

Thank you for your interest in contributing to this project! This document provides guidelines and standards for contributing to the Golden Compasses Research Lodge website.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Conventions](#commit-conventions)
7. [Pull Request Process](#pull-request-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We respect different viewpoints and experiences.

### Our Standards

- **Be Respectful:** Treat others with respect and professionalism
- **Be Inclusive:** Welcome diverse perspectives and contributions
- **Be Collaborative:** Work together to solve problems
- **Be Constructive:** Focus on what is best for the community
- **Be Accountable:** Take responsibility for mistakes and learn from them

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js v24 or higher installed
- npm or yarn package manager
- Wrangler CLI (`npm install -g wrangler`)
- Git installed and configured
- A Cloudflare account (free tier works)

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/laltomare/gcrl-website.git
cd gcrl-website

# 2. Install dependencies
npm install

# 3. Authenticate with Cloudflare
wrangler login

# 4. Set up environment (see README.md for details)
# Create D1 database, R2 bucket, set secrets

# 5. Start development server
npm run dev
```

### Development Workflow

```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Make your changes
# Edit files in src/ directory

# Test locally
npm run dev

# Build and test
npm run build

# Commit your changes
git add .
git commit -m "Brief description of changes"

# Push to your fork (if applicable)
git push origin feature/your-feature-name
```

---

## Development Workflow

### Branch Naming Conventions

- `feature/` - New features (e.g., `feature/user-authentication`)
- `bugfix/` - Bug fixes (e.g., `bugfix/navigation-artifact`)
- `hotfix/` - Urgent production fixes (e.g., `hotfix/security-patch`)
- `docs/` - Documentation updates (e.g., `docs/api-endpoints`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-module`)

### Making Changes

1. **Check existing issues:** Look for related issues in GitHub
2. **Create issue (if needed):** Describe the bug or feature
3. **Discuss complex changes:** Comment on the issue first
4. **Create branch:** Use appropriate naming convention
5. **Make changes:** Follow coding standards (below)
6. **Test thoroughly:** Test on multiple browsers/devices
7. **Commit:** Use clear commit messages (below)
8. **Pull Request:** Submit PR for review

### Local Testing

Before submitting, ensure:

```bash
# 1. TypeScript compilation passes
npm run build

# 2. Local server runs without errors
npm run dev

# 3. Test common scenarios:
# - Navigate to all pages
# - Test form submissions
# - Test admin login (if applicable)
# - Verify responsive design
# - Check browser console for errors
```

---

## Coding Standards

### TypeScript

- Use **TypeScript strict mode** (enforced in tsconfig.json)
- Define **types explicitly** (no `any` types unless necessary)
- Use **interfaces for object shapes**, `type` for unions/aliases
- Add **JSDoc comments** for exported functions

**Example:**
```typescript
/**
 * Validate password strength
 * @param password - Plain text password to validate
 * @returns Object with {valid: boolean, reason?: string}
 */
export function validatePassword(password: string): {valid: boolean, reason?: string} {
  // Implementation...
}
```

### HTML/CSS

- Use **semantic HTML5** elements (`header`, `nav`, `main`, `footer`)
- Follow **BEM-like naming** for CSS classes (e.g., `.nav-container`, `.site-title`)
- Use **CSS custom properties** (variables) for colors, spacing
- Add **responsive breakpoints** at 768px (tablet) and 480px (mobile)
- Comment **complex CSS** (media queries, flexbox layouts)

**Example:**
```css
/* ============================================================================
   NAVIGATION
   ============================================================================ */

.nav-container {
  display: flex;
  justify-content: space-between;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
  }
}
```

### Security

**ALWAYS:**

- **Sanitize user input** with `sanitizeInput()`
- **Escape HTML** with `escapeHtml()` before rendering
- Use **prepared statements** for SQL queries
- Add **security headers** with `addSecurityHeaders()`
- **Log security events** with `logSecurityEvent()`
- **Never** trust client-side validation

**Example:**
```typescript
// ❌ BAD - Direct rendering
html += `<div>${userInput}</div>`;

// ✅ GOOD - Sanitized
html += `<div>${sanitizeInput(userInput)}</div>`;
```

### Error Handling

```typescript
try {
  // Risky operation
  await env.DB.prepare(query).run();
} catch (error) {
  console.error('Operation failed:', error);
  // Return user-friendly error
  return new Response('Operation failed', { status: 500 });
}
```

---

## Testing Guidelines

### Manual Testing Checklist

**Every PR should include:**

- [ ] All pages load without errors
- [ ] Navigation works (desktop + mobile)
- [ ] Forms submit successfully
- [ ] No console errors (check DevTools)
- [ ] Responsive design works (shrink browser window)
- [ ] Admin features work (if applicable)

### Browser Testing

**Minimum Required:**
- Chrome Desktop
- Safari Desktop
- iPhone (iOS Safari)
- iPad (iPadOS Safari)

**Nice to Have:**
- Firefox Desktop
- Android devices
- Windows devices

### Security Testing

- [ ] Input sanitization working (test XSS: `<script>alert(1)</script>`)
- [ ] Rate limiting enforced (try multiple failed logins)
- [ ] SQL injection prevention (test: `'; DROP TABLE documents;--`)
- [ ] Path traversal prevention (test: `../../etc/passwd`)

---

## Commit Conventions

### Commit Message Format

Follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `security`: Security fixes

### Examples

**Good:**
```
feat(authentication): add user login endpoint

Implement POST /api/auth/login with email/password authentication.
Includes rate limiting and security logging.

Closes #42
```

```
fix(navigation): remove hamburger menu artifacts

Added ::marker CSS override to prevent Chrome from rendering
bullet points next to menu items. Safari "|" also resolved.

Fixes #38
```

```
docs(readme): update setup instructions

Clarified D1 database creation steps and added password examples.
```

**Bad:**
```
update stuff
fixed bug
changes
```

---

## Pull Request Process

### Before Submitting PR

1. **Update documentation** if API endpoints changed
2. **Add comments** to complex code
3. **Remove debugging code** (console.logs, etc.)
4. **Format code** consistently
5. **Test thoroughly** (see Testing Guidelines)

### PR Description Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Chrome Desktop
- [ ] Tested on Safari Desktop
- [ ] Tested on iPhone/iPad
- [ ] Forms tested
- [ ] Console checked for errors

## Screenshots (if applicable)
Attach screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Security considerations addressed

## Related Issues
Closes #issue-number
```

### Review Process

1. **Automated checks:** CI builds TypeScript successfully
2. **Code review:** Maintainer reviews code within 48 hours
3. **Feedback:** Address requested changes
4. **Approval:** PR approved when all checks pass
5. **Merge:** Maintainer merges to `main` branch

---

## Questions?

- **Technical questions:** Open a GitHub Discussion
- **Bug reports:** Open a GitHub Issue
- **Security issues:** Email Lawrence Altomare directly (do NOT open public issue)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (Copyright © 2025 Golden Compasses Research Lodge. All rights reserved).

---

**Last Updated:** December 31, 2025  
**Maintainer:** Lawrence Altomare
