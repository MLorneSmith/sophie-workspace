# Project Specification: Design System V2 - Clean Professional

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1880 |
| **GitHub Issue** | #1880 |
| **Document Owner** | Claude |
| **Created** | 2026-01-28 |
| **Status** | Draft |
| **Version** | 0.1 |
| **Variation** | V2 of 4 |

---

## 1. Executive Summary

### One-Line Description
Apply the "Clean Professional" design system variation using brand cyan with cool purple accent, Inter typography, balanced shadows, standard corners, and conventional spacing.

### Press Release Headline
> "SlideHeroes delivers polished SaaS experience with refined, professional design"

### Elevator Pitch
This variation tests a classic, reliable visual identity for SlideHeroes. Using the brand cyan with sophisticated purple accents and the versatile Inter typeface creates a trustworthy, familiar SaaS aesthetic that users will immediately understand.

---

## 2. Problem Statement

### Problem Description
The current design system needs to be finalized with a cohesive visual identity that balances professionalism with approachability.

### Who Experiences This Problem?
- Marketing team (needs compelling brand identity)
- Users (need intuitive, pleasant interface)
- Development team (needs consistent design tokens)

### Current Alternatives
Current implementation uses neutral-based colors and Inter font without a defined brand personality.

---

## 3. Vision & Goals

### Product Vision
Establish a trustworthy, professional visual identity that feels familiar to SaaS users.

### Primary Goals

| Goal | Success Metric | Target | Measurement |
|------|---------------|--------|-------------|
| G1: Professional Trust | User perception | Reliable/trustworthy | Review screenshots |
| G2: Accessibility | WCAG compliance | AA level (4.5:1) | Contrast checker |
| G3: Performance | Font loading | No LCP regression | Lighthouse |

---

## 4. Target Users

### Primary Persona
**Name:** Enterprise User
**Role:** Corporate Trainer / Executive
**Goals:** Create polished presentations for business audiences
**Quote:** "I need software that looks as trustworthy as my company"

---

## 5. Solution Overview

### Proposed Solution
Apply design tokens for the "Clean Professional" variation across the application.

### Key Capabilities

1. **CSS Token Configuration**: Update shadcn-ui.css with brand cyan + cool purple accent
2. **Font Configuration**: Keep Inter font (optimized loading)
3. **Shadow System**: Apply balanced shadow scale
4. **Radius System**: Apply 8px base border radius (standard)
5. **Spacing System**: Apply standard density (current spacing)
6. **Accent Color**: Configure cool purple accent for highlights

### Design Token Specification

#### Colors (HSL format for CSS)

```css
/* Primary Palette - Brand Cyan (FIXED) */
--primary: 195 78% 51%;                 /* #24a9e0 */
--primary-foreground: 0 0% 100%;        /* white text */

/* Accent - Cool Purple */
--accent: 258 90% 66%;                  /* #8b5cf6 */
--accent-foreground: 0 0% 100%;         /* white text */
```

#### Typography

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Display/Heading | Inter | 500, 600, 700 | system-ui |
| Body | Inter | 400, 500, 700 | system-ui |

#### Shadows (Balanced)

```css
/* Balanced shadow scale - moderate depth (current default) */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

#### Border Radius

```css
--radius: 0.5rem;  /* 8px base - Balanced (standard) */
```

#### Spacing (Standard)

```css
/* Standard density - conventional SaaS spacing */
--spacing-density: 1.0;
```

### Responsive Behavior

No layout changes - this is a token-only variation.

---

## 6. Scope Definition

### In Scope
- [ ] Update CSS custom properties in shadcn-ui.css
- [ ] Verify/optimize Inter font loading in `apps/web/lib/fonts.ts`
- [ ] Verify contrast ratios meet WCAG AA
- [ ] Test on home page and dashboard

### Out of Scope
- [ ] Component structure changes
- [ ] Layout modifications
- [ ] New features or functionality
- [ ] Database changes

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| apps/web/styles/shadcn-ui.css | CSS Variables | Primary token location |
| apps/web/lib/fonts.ts | Font config | Already using Inter |
| apps/web/app/layout.tsx | Font application | Uses getFontsClassName() |

### Technical Constraints

- **Performance:** Font loading must use next/font for optimization
- **Compatibility:** CSS must work in all modern browsers
- **Dark Mode:** All colors must have dark mode variants

---

## 8. Assumptions & Risks

### Key Assumptions
1. Inter is already optimized in current setup
2. Purple provides sufficient contrast for accessibility

### Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R1 | Too generic/forgettable | Medium | Low | Accent color adds distinction |
| R2 | Purple clashes with cyan | Low | Medium | Test color combinations |

---

## 9. Success Criteria

### Definition of Done
- [ ] All design tokens applied to shadcn-ui.css
- [ ] Inter font optimized
- [ ] WCAG AA contrast verified
- [ ] No visual regressions
- [ ] Dark mode working
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

---

## 10. Decomposition Hints

### Candidate Initiatives
1. **I1: Design Token Application** (single initiative - focused change)

### Candidate Features
1. **F1: CSS Token Configuration** - Update shadcn-ui.css with all color and style tokens
2. **F2: Font Configuration** - Verify/optimize Inter font loading
3. **F3: Verification & Screenshots** - Capture evaluation assets

### Complexity Indicators
| Area | Complexity | Rationale |
|------|------------|-----------|
| CSS Changes | Low | Token updates only |
| Font Loading | Very Low | Already using Inter |
| Testing | Low | Visual verification |

---

## 11. Appendices

### A. Glossary
- **Design Token**: A named value (color, spacing, etc.) that can be changed globally
- **HSL**: Hue, Saturation, Lightness color format

### B. Codebase Exploration Results

| Component/Pattern | File Path | Reusable? |
|-------------------|-----------|-----------|
| CSS Variables | apps/web/styles/shadcn-ui.css | Modify in place |
| Font Config | apps/web/lib/fonts.ts | Minimal changes |
| Layout | apps/web/app/layout.tsx | Uses fonts automatically |

### C. Research Integration

| Research File | Key Findings | Spec Section Affected |
|---------------|--------------|----------------------|
| DesignSystem.md | Experiment options defined | Section 5 tokens |

### D. Full Token Reference

#### Light Mode Colors

```css
:root {
  /* Primary - Brand Cyan */
  --primary: 195 78% 51%;
  --primary-foreground: 0 0% 100%;

  /* Accent - Cool Purple */
  --accent: 258 90% 66%;
  --accent-foreground: 0 0% 100%;

  /* Keep existing neutral system */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;

  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 195 78% 51%;

  --radius: 0.5rem;
}
```

#### Dark Mode Colors

```css
.dark {
  /* Primary - Brand Cyan (adjusted for dark) */
  --primary: 195 78% 55%;
  --primary-foreground: 222 47% 11%;

  /* Accent - Cool Purple (adjusted for dark) */
  --accent: 258 90% 70%;
  --accent-foreground: 222 47% 11%;

  --background: 222 47% 11%;
  --foreground: 210 40% 98%;

  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;

  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;

  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;

  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --ring: 195 78% 55%;
}
```

### E. Visual Assets

**Target Pages for Evaluation:**
- `/` (Home page)
- `/home/[account]` (Dashboard)

Screenshots will be captured after implementation for comparison.

### F. Font Loading Code

```typescript
// apps/web/lib/fonts.ts (minimal changes from current)
import { cn } from "@kit/ui/utils";
import { Inter } from "next/font/google";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
  preload: true,
  weight: ["300", "400", "500", "600", "700"],
});

const heading = sans; // Same font for consistent look

export { sans, heading };
```
