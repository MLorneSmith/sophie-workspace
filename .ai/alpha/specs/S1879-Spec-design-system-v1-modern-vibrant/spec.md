# Project Specification: Design System V1 - Modern Vibrant

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1879 |
| **GitHub Issue** | #1879 |
| **Document Owner** | Claude |
| **Created** | 2026-01-28 |
| **Status** | Draft |
| **Version** | 0.1 |
| **Variation** | V1 of 4 |

---

## 1. Executive Summary

### One-Line Description
Apply the "Modern Vibrant" design system variation using brand cyan with warm orange accent, Outfit/Nunito Sans typography, elevated shadows, rounded corners, and spacious layout.

### Press Release Headline
> "SlideHeroes unveils bold new visual identity with energetic accents and contemporary typography"

### Elevator Pitch
This variation tests a bold, contemporary visual identity for SlideHeroes. Using the brand cyan with warm orange accents and Outfit/Nunito Sans typography creates an energetic, modern feel with generous spacing that feels premium and approachable.

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
Establish a distinctive visual identity that makes SlideHeroes memorable and professional.

### Primary Goals

| Goal | Success Metric | Target | Measurement |
|------|---------------|--------|-------------|
| G1: Visual Distinctiveness | User recognition | Subjective evaluation | Review screenshots |
| G2: Accessibility | WCAG compliance | AA level (4.5:1) | Contrast checker |
| G3: Performance | Font loading | No LCP regression | Lighthouse |

---

## 4. Target Users

### Primary Persona
**Name:** Business Professional
**Role:** Marketing Manager / Sales Lead
**Goals:** Create impressive presentations efficiently
**Quote:** "I want software that looks as professional as my presentations"

---

## 5. Solution Overview

### Proposed Solution
Apply design tokens for the "Modern Vibrant" variation across the application.

### Key Capabilities

1. **CSS Token Configuration**: Update shadcn-ui.css with brand cyan + warm orange accent
2. **Font Configuration**: Load and apply Outfit and Nunito Sans fonts
3. **Shadow System**: Apply elevated shadow scale
4. **Radius System**: Apply 12px base border radius
5. **Spacing System**: Apply spacious density (25% more breathing room)
6. **Accent Color**: Configure warm orange accent for CTAs and highlights

### Design Token Specification

#### Colors (HSL format for CSS)

```css
/* Primary Palette - Brand Cyan (FIXED) */
--primary: 195 78% 51%;                 /* #24a9e0 */
--primary-foreground: 0 0% 100%;        /* white text */

/* Accent - Warm Orange */
--accent: 38 92% 50%;                   /* #f59e0b */
--accent-foreground: 0 0% 100%;         /* white text */
```

#### Typography

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Display/Heading | Outfit | 500, 600, 700 | system-ui |
| Body | Nunito Sans | 400, 500, 700 | system-ui |

#### Shadows (Elevated)

```css
/* Elevated shadow scale - more pronounced depth */
--shadow-sm: 0 2px 4px -1px rgb(0 0 0 / 0.15), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 6px 10px -2px rgb(0 0 0 / 0.15), 0 3px 6px -3px rgb(0 0 0 / 0.1);
--shadow-lg: 0 15px 20px -4px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

#### Border Radius

```css
--radius: 0.75rem;  /* 12px base - Rounded */
```

#### Spacing (Spacious)

```css
/* Spacious density - 25% more breathing room than standard */
--spacing-density: 1.25;
```

### Responsive Behavior

No layout changes - this is a token-only variation.

---

## 6. Scope Definition

### In Scope
- [ ] Update CSS custom properties in shadcn-ui.css
- [ ] Configure font loading in `apps/web/lib/fonts.ts`
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
| apps/web/lib/fonts.ts | Font config | Font loading with next/font |
| apps/web/app/layout.tsx | Font application | Uses getFontsClassName() |

### Technical Constraints

- **Performance:** Font loading must use next/font for optimization
- **Compatibility:** CSS must work in all modern browsers
- **Dark Mode:** All colors must have dark mode variants

---

## 8. Assumptions & Risks

### Key Assumptions
1. Outfit and Nunito Sans are available via Google Fonts
2. Warm orange provides sufficient contrast for accessibility

### Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R1 | Orange too bold for B2B | Medium | Medium | Test with users |
| R2 | Font loading affects LCP | Low | Medium | Use next/font preload |

---

## 9. Success Criteria

### Definition of Done
- [ ] All design tokens applied to shadcn-ui.css
- [ ] Fonts loading correctly via next/font
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
2. **F2: Font Configuration** - Configure font loading in fonts.ts
3. **F3: Verification & Screenshots** - Capture evaluation assets

### Complexity Indicators
| Area | Complexity | Rationale |
|------|------------|-----------|
| CSS Changes | Low | Token updates only |
| Font Loading | Low | Standard Next.js pattern |
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
| Font Config | apps/web/lib/fonts.ts | Modify in place |
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

  /* Accent - Warm Orange */
  --accent: 38 92% 50%;
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

  --radius: 0.75rem;
}
```

#### Dark Mode Colors

```css
.dark {
  /* Primary - Brand Cyan (adjusted for dark) */
  --primary: 195 78% 55%;
  --primary-foreground: 222 47% 11%;

  /* Accent - Warm Orange (adjusted for dark) */
  --accent: 38 92% 55%;
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
// apps/web/lib/fonts.ts
import { cn } from "@kit/ui/utils";
import { Outfit, Nunito_Sans } from "next/font/google";

const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
  preload: true,
  weight: ["400", "500", "700"],
});

const heading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
  preload: true,
  weight: ["500", "600", "700"],
});

export { sans, heading };
```
