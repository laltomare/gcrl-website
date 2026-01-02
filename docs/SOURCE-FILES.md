# Golden Compasses Source Files

## Overview

These folders contain the **clean, uncompromised source files** that were salvaged from the compromised goldencompasses.org website.

## What's Here

### `source-assets/`
Original visual assets from the compromised site:
- **background-image.jpg** - Site background
- **golden-compasses-logo.png** - Main logo
- **hero-banner.jpg** - Hero section banner
- Documentation: ASSET-INVENTORY.md, SITE-TAKEDOWN-RECOMMENDATIONS.md, goldencompasses-analysis.md

### `source-content/`
Content and structure from the compromised site:
- **content/** - Original content files
- **pages/** - Page structure and templates
- **assets/** - Additional assets
- Documentation: FINAL-SITE-STRUCTURE.md, SECURITY-HARDENING.md, START-HERE-PLAIN-WORKERS.md
- Python script: extract_content.py

## Purpose

These files were used to:
1. ✅ Analyze the compromised site structure
2. ✅ Extract clean content for rebuild
3. ✅ Build the new dev.goldencompasses.org site
4. 📋 Serve as reference for future development

## Security Status

✅ **Clean** - These files were verified as uncompromised
✅ **Salvaged** - Downloaded before site takedown
✅ **Reference** - Used for rebuilding the secure version

## Integration

These source files were used to build:
- **Dev site**: dev.goldencompasses.org (Cloudflare Workers)
- **New site structure**: See `src/` and `public/` for current implementation

## Notes

- Keep these folders for historical reference
- Useful for understanding original site structure
- Content may need updates for production use
- See PROJECT_PLAN.md for rebuild details

## Related Files

- `PROJECT_PLAN.md` - Overall project plan
- `DEPLOYMENT-CHECKLIST.md` - Deployment procedures
- `README.md` - Project overview
