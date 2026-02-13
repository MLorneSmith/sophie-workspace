# Feature: Final CTA Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I5 |
| **Feature ID** | S2086.I5.F5 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 5 |

## Description
Implement the new Final CTA section as the last content section before the footer. Features a full-width area with gradient orb background effect, a compelling headline and subtitle, dual CTA buttons (primary "Start Writing Free" + secondary "Book a Demo"), and a trust badges row showing "No credit card required", "Free plan available", and "Cancel anytime".

## User Story
**As a** prospective customer who has scrolled through the entire homepage
**I want to** see a final, clear call-to-action with trust reassurances
**So that** I feel confident to sign up without lingering doubts about commitment

## Acceptance Criteria

### Must Have
- [ ] Full-width section with gradient orb background (accent color at low opacity, blurred)
- [ ] Centered headline with gradient text effect (e.g., "Ready to transform your presentations?")
- [ ] Centered subtitle text below headline
- [ ] Dual CTA buttons: primary (filled) and secondary (outlined/ghost)
- [ ] Trust badges row with checkmark icons: "No credit card", "Free plan", "Cancel anytime"
- [ ] Content defined in `homepage-content.config.ts`
- [ ] Section wrapped with AnimateOnScroll for scroll-triggered fade-in
- [ ] Integrated into homepage `page.tsx` as last section before footer

### Nice to Have
- [ ] Subtle parallax movement on gradient orb during scroll
- [ ] Staggered reveal of trust badges

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `home-final-cta-section.tsx` (client) | New |
| **UI** | Gradient orb background | New (or reuse from I1/Hero) |
| **Logic** | Scroll-triggered animation | I1 AnimateOnScroll |
| **Data** | `homepage-content.config.ts` final CTA section | New (extend) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple section component mirroring the Hero CTA pattern but positioned at the page bottom. The gradient orb is a CSS pseudo-element or absolute-positioned div with radial gradient and blur. CTA buttons reuse the existing `CtaButton` component from makerkit. Trust badges are a simple flex row with Lucide icons.

### Key Architectural Choices
1. Client component for gradient orb animation and AnimateOnScroll wrapper
2. Reuse `CtaButton` and gradient text patterns from Hero/I1 design system
3. Gradient orb as CSS (radial-gradient + blur filter), not canvas/WebGL

### Trade-offs Accepted
- Gradient orb as CSS-only (simpler but less dynamic than a canvas-based approach)
- Trust badge copy is hardcoded in config (not translatable via i18n) - acceptable for marketing homepage

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| CTA buttons | `CtaButton` | packages/ui (existing) | Consistent CTA styling |
| Gradient text | `GradientText` | packages/ui (existing) | Consistent gradient headings |
| Trust badge icons | Lucide React (Check, Shield) | Already installed | Consistent icons |
| Section animation | AnimateOnScroll | I1 Design System | Consistent scroll animation |
| Gradient orb | CSS radial-gradient + blur | New | Lightweight background effect |

## Required Credentials
> None required - static marketing content.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, AnimateOnScroll, GradientText patterns)

### Parallel With
- F1: Comparison Section
- F2: Testimonials Redesign
- F3: Pricing Redesign
- F4: Blog/Essential Reads Redesign

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-final-cta-section.tsx` - Final CTA section component

### Modified Files
- `apps/web/config/homepage-content.config.ts` - Add final CTA section content config
- `apps/web/app/(marketing)/page.tsx` - Add Final CTA section before footer

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add final CTA content config**: Headline, subtitle, CTA labels, trust badges in content config
2. **Create final CTA section component**: Gradient orb background, centered text, dual CTAs, trust badges
3. **Integrate into homepage**: Add Final CTA as last section in page.tsx

### Suggested Order
Config → CTA component → Page integration

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-final-cta-section.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Hero CTA pattern: `packages/ui/src/makerkit/marketing/cta-button.tsx`
- GradientText: `packages/ui/src/makerkit/marketing/gradient-text.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
- Homepage: `apps/web/app/(marketing)/page.tsx`
