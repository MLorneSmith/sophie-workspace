# Design System Variations - Base Requirements

**Created:** 2026-01-28
**Variation Type:** Theme (Design Tokens)
**Number of Variations:** 4

## Overview

This experiment tests 4 different design system configurations to determine the optimal visual identity for SlideHeroes. All variations implement the same functional requirements but with different visual styling.

## Evaluation Pages

All variations will be evaluated on:
1. **Home page** (`/`) - Marketing site first impression
2. **Dashboard** (`/home/[account]`) - Application experience

## Shared Functional Requirements

All variations MUST:
- [ ] Apply design tokens to shadcn-ui.css
- [ ] Configure fonts in Next.js via `apps/web/lib/fonts.ts`
- [ ] Maintain WCAG AA color contrast (4.5:1 for text)
- [ ] Support dark mode
- [ ] Pass `pnpm typecheck` and `pnpm lint`
- [ ] Not break any existing functionality

## Non-Functional Requirements

- **Performance:** No increase in LCP from font loading
- **Accessibility:** Maintain WCAG 2.1 AA compliance
- **Compatibility:** Work in Chrome, Firefox, Safari, Edge

## Variation Comparison Matrix

| Dimension | V1: Modern Vibrant | V2: Clean Professional | V3: Soft Approachable | V4: Bold Geometric |
|-----------|-------------------|----------------------|---------------------|-------------------|
| Primary Color | #24a9e0 (brand) | #24a9e0 (brand) | #24a9e0 (brand) | #24a9e0 (brand) |
| Accent Color | Orange #f59e0b | Purple #8b5cf6 | Coral #f97316 | Amber #d97706 |
| Heading Font | Outfit | Inter | Manrope | Plus Jakarta Sans |
| Body Font | Nunito Sans | Inter | Source Sans Pro | DM Sans |
| Shadow | Elevated | Balanced | Subtle | Elevated |
| Border Radius | 12px | 8px | 16px | 4px |
| Spacing | Spacious | Standard | Spacious | Compact |
| Personality | Bold, energetic | Classic, reliable | Friendly, warm | Modern, precise |

## Out of Scope (All Variations)

- New components or features
- Layout changes
- Data model changes
- API changes

## Implementation Notes

### Files to Modify

1. **`apps/web/styles/shadcn-ui.css`** - CSS custom properties
2. **`apps/web/lib/fonts.ts`** - Font loading configuration
3. **`apps/web/styles/globals.css`** - May need spacing adjustments

### Font Loading Pattern

All variations use Next.js `next/font/google` for optimized font loading:

```typescript
import { FontName as SansFont, FontName as HeadingFont } from "next/font/google";

const sans = SansFont({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
  preload: true,
  weight: ["300", "400", "500", "600", "700"],
});

const heading = HeadingFont({
  subsets: ["latin"],
  variable: "--font-heading",
  fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
  preload: true,
  weight: ["400", "500", "600", "700"],
});
```

### CSS Variable Pattern

```css
:root {
  /* Primary - Brand Cyan (fixed across all variations) */
  --primary: 195 78% 51%;  /* #24a9e0 in HSL */

  /* Accent - Varies by variation */
  --accent: [HSL values];

  /* Radius - Varies by variation */
  --radius: [value]rem;
}
```
