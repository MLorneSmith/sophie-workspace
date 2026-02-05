# Feature: Hero Section Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I2 |
| **Feature ID** | S1936.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create the full-viewport hero container with redesigned background featuring animated gradient orbs instead of the current grid-based BackgroundBoxes. This establishes the visual foundation for all hero content elements including the animated headline, social proof strip, and dual CTAs.

## User Story
**As a** first-time visitor to SlideHeroes
**I want to** see an immersive, premium above-the-fold experience
**So that** I immediately understand this is a professional, high-quality product

## Acceptance Criteria

### Must Have
- [ ] Full-viewport hero container (90vh minimum height)
- [ ] Animated gradient orbs background with subtle floating animation
- [ ] Dark mode default with light mode support
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] `prefers-reduced-motion` support for accessibility

### Nice to Have
- [ ] Parallax effect on orbs responding to scroll
- [ ] Subtle grid overlay behind orbs for depth

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | HeroSection container, GradientOrbs background | New |
| **Logic** | Animation configuration, motion variants | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Replace BackgroundBoxes with simpler gradient orbs that perform better and align with modern SaaS aesthetics (Linear, Cargo style). Use Framer Motion for smooth animations while keeping component structure simple.

### Key Architectural Choices
1. Create new `HeroSectionRedesigned` component to avoid disrupting existing Hero usage
2. Use CSS radial gradients with Framer Motion for orb animation instead of complex grid calculations
3. Maintain existing container width patterns (max-w-5xl for focused content)

### Trade-offs Accepted
- Breaking change from BackgroundBoxes visual style to gradient orbs
- Requires updating homepage to use new component

## Required Credentials
> None required - purely frontend component with no external service dependencies

## Dependencies

### Blocks
- F2: Animated Headline (needs hero container)
- F3: Social Proof & CTA (needs hero container)

### Blocked By
- S1936.I1: Design System Foundation (requires color tokens, animation utilities)

### Parallel With
- None (foundation feature)

## Files to Create/Modify

### New Files
- `packages/ui/src/makerkit/marketing/hero-section-redesigned.tsx` - Main hero container
- `packages/ui/src/makerkit/marketing/gradient-orbs.tsx` - Animated background orbs

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Replace current hero implementation
- `apps/web/styles/shadcn-ui.css` - Add hero-specific CSS variables if needed

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create GradientOrbs component**: Animated floating orbs using Framer Motion and radial gradients
2. **Create HeroSectionRedesigned container**: Full-viewport wrapper with proper z-index layering
3. **Add reduced-motion support**: Respect user accessibility preferences
4. **Update homepage**: Replace BackgroundBoxes + Hero with new implementation
5. **Add responsive breakpoints**: Adjust orb size/position for mobile

### Suggested Order
1. GradientOrbs component (pure visual)
2. HeroSectionRedesigned container
3. Reduced motion support
4. Homepage integration
5. Responsive polish

## Validation Commands
```bash
# Type check
pnpm typecheck

# Dev server and visual inspection
pnpm dev
# Visit http://localhost:3000 - verify hero is 90vh, orbs animate

# Check reduced motion
# In browser dev tools, enable "Reduce motion" and verify animations are disabled

# Lighthouse audit
npx lighthouse http://localhost:3000 --only-categories=performance --output=json | jq '.audits["largest-contentful-paint"].numericValue'
```

## Related Files
- Initiative: `../initiative.md`
- Existing Hero: `packages/ui/src/makerkit/marketing/hero.tsx`
- Existing Background: `packages/ui/src/aceternity/background-boxes.tsx`
- Design System Foundation: `../../../S1936.I1-Initiative-design-system-foundation/`
