# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I6 |
| **Feature ID** | S2086.I6.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement comprehensive accessibility support across all 12 homepage sections: `prefers-reduced-motion` to disable scroll animations and show static states, WCAG AA contrast verification for all text on dark backgrounds, keyboard-navigable focus indicators with 3:1+ contrast, and proper ARIA attributes on decorative animations.

## User Story
**As a** visitor with accessibility needs (reduced motion preference, screen reader, keyboard navigation)
**I want to** experience the homepage with appropriate accommodations
**So that** I can understand the content, navigate the page, and interact with CTAs regardless of my abilities

## Acceptance Criteria

### Must Have
- [ ] `prefers-reduced-motion`: All Framer Motion scroll animations disabled, static states shown
- [ ] `prefers-reduced-motion`: Count-up animations show final values immediately
- [ ] `prefers-reduced-motion`: Marquee logo cloud stops or shows static grid
- [ ] `prefers-reduced-motion`: Letter-by-letter hero text shows complete text immediately
- [ ] `prefers-reduced-motion`: Gradient orb parallax disabled
- [ ] WCAG AA: All body text on `#0a0a0f` backgrounds meets 4.5:1 contrast ratio
- [ ] WCAG AA: All large text (>=18pt) meets 3:1 contrast ratio
- [ ] WCAG AA: UI components and graphics meet 3:1 contrast ratio
- [ ] Focus indicators: `:focus-visible` with bright outline (2px+) on all interactive elements
- [ ] Focus indicators: 3:1+ contrast against both background and adjacent colors
- [ ] All decorative animations (gradient orbs, grid overlays, glow effects) have `aria-hidden="true"`
- [ ] All sections use semantic HTML (`<section>`, `<article>`, `<nav>`, `<h2>`-`<h3>` hierarchy)
- [ ] Keyboard navigation: Tab through all interactive elements in logical order
- [ ] No auto-playing content without pause controls
- [ ] Lighthouse accessibility score >= 95

### Nice to Have
- [ ] `@media (prefers-contrast: more)` enhanced contrast mode
- [ ] Skip navigation link at top of page
- [ ] `aria-live` regions for dynamic content (stat count-ups)
- [ ] WCAG AAA contrast ratios (7:1) for primary text

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 12 section components + global styles | Existing (modify) |
| **Logic** | Reduced motion detection, contrast utilities | Existing (extend - MotionProvider already has `reducedMotion: "user"`) |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Leverage existing MotionProvider `reducedMotion: "user"` from I1, add CSS-level fallbacks via `@media (prefers-reduced-motion: reduce)`, and systematically audit each section for contrast and ARIA compliance.

**Rationale**: The MotionProvider from I1 already handles Framer Motion's built-in reduced motion support. However, CSS animations, transitions, and non-Motion effects (marquee, CSS keyframes) need additional `@media` query overrides. A global CSS approach plus per-component ARIA attributes provides comprehensive coverage.

### Key Architectural Choices
1. **Global reduced-motion CSS fallback**: Add `@media (prefers-reduced-motion: reduce)` in `globals.css` to catch any animations not handled by MotionProvider
2. **Per-component ARIA audit**: Each section gets `aria-hidden="true"` on decorative elements and semantic HTML verification
3. **Centralized focus styles**: Define `:focus-visible` styles once in `globals.css`, override per-component only where needed
4. **Contrast verification via tooling**: Use Lighthouse + axe-core for automated checking, manual verification for glass card overlays where automated tools fail

### Trade-offs Accepted
- Glass card `backdrop-filter: blur()` contrast is hard to verify automatically - requires manual visual inspection
- `prefers-reduced-motion` completely disables animations rather than providing reduced alternatives (simpler implementation, clearer behavior)

## Required Credentials
> None required - no external services needed for accessibility work.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides MotionProvider, animation components)
- S2086.I2: Hero & Product Preview (provides hero text reveal, gradient orb)
- S2086.I3: Trust & Credibility Sections (provides logo marquee, stat counters)
- S2086.I4: Feature Showcase Sections (provides sticky scroll, stepper animations)
- S2086.I5: Social Proof & Conversion (provides comparison animations, testimonial grid)

### Parallel With
- F1: Responsive Layout Adaptations
- F3: Performance Optimization & Audit

## Files to Create/Modify

### New Files
- None expected

### Modified Files
- `apps/web/styles/globals.css` - Global `:focus-visible` styles, `@media (prefers-reduced-motion: reduce)` overrides
- `apps/web/app/(marketing)/_components/home-hero-*.tsx` - `aria-hidden` on gradient orb/grid, static text for reduced motion
- `apps/web/app/(marketing)/_components/home-product-preview-*.tsx` - `aria-hidden` on glow/border animation
- `apps/web/app/(marketing)/_components/home-logo-cloud-*.tsx` - Static grid fallback for reduced motion, `aria-hidden` on marquee decorations
- `apps/web/app/(marketing)/_components/home-statistics-*.tsx` - Immediate final values for reduced motion, `aria-hidden` on decorative elements
- `apps/web/app/(marketing)/_components/home-sticky-scroll-*.tsx` - Static state for reduced motion
- `apps/web/app/(marketing)/_components/home-how-it-works-*.tsx` - Static connecting line for reduced motion
- `apps/web/app/(marketing)/_components/home-features-grid-*.tsx` - `aria-hidden` on spotlight glow, static cursor effect
- `apps/web/app/(marketing)/_components/home-comparison-*.tsx` - Static checkmark/cross icons for reduced motion
- `apps/web/app/(marketing)/_components/home-testimonials-*.tsx` - `aria-hidden` on decorative quotation marks
- `apps/web/app/(marketing)/_components/home-pricing-*.tsx` - Static highlight for reduced motion
- `apps/web/app/(marketing)/_components/home-final-cta-*.tsx` - `aria-hidden` on gradient orb

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Global a11y styles**: Add `:focus-visible`, `prefers-reduced-motion` CSS overrides in `globals.css`
2. **Hero + product preview a11y**: ARIA attributes, static text reveal, disabled parallax
3. **Trust sections a11y**: Static logo grid, immediate stat values, ARIA on decorations
4. **Feature showcase a11y**: Static sticky scroll, static stepper line, disabled spotlight glow
5. **Conversion sections a11y**: Static comparison animations, testimonial ARIA, pricing focus states
6. **Contrast audit**: Systematic verification of all text/background combinations with tools
7. **Keyboard navigation test**: Tab through entire page, verify logical order and visible focus

### Suggested Order
Global styles first, then section-by-section ARIA/reduced-motion, then contrast audit, then keyboard test.

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Lint
pnpm lint

# Check reduced motion support
grep -r 'prefers-reduced-motion\|useReducedMotion\|reducedMotion' apps/web/app/\(marketing\)/

# Check aria-hidden usage
grep -r 'aria-hidden' apps/web/app/\(marketing\)/_components/home-*.tsx

# Check focus-visible styles
grep -r 'focus-visible' apps/web/styles/ apps/web/app/\(marketing\)/

# Check semantic HTML
grep -r '<section\|<article\|<nav\|<main\|<header\|<footer' apps/web/app/\(marketing\)/
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-saas-homepage-best-practices.md` (Section 5: Accessibility)
- Research: `../../research-library/context7-framer-motion.md` (Section 5F: useReducedMotion)
- Existing pattern: `apps/web/app/home/(user)/_components/dashboard/widget-skeleton-card.tsx` (usePrefersReducedMotion reference)
