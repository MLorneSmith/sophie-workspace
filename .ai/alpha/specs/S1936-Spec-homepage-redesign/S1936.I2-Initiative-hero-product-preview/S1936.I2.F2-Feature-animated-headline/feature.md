# Feature: Animated Headline with Gradient Text

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I2 |
| **Feature ID** | S1936.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Implement the animated headline system featuring staggered text reveal animation, gradient text effects, and the pill badge component. The headline "Write more impactful presentations faster" will use a gradient reveal animation on "faster" with an animated underline accent.

## User Story
**As a** visitor landing on the homepage
**I want to** see the headline animate in with visual emphasis on key words
**So that** I immediately understand and remember the core value proposition

## Acceptance Criteria

### Must Have
- [ ] Pill badge: "AI-Powered Presentation Platform" with subtle animation on load
- [ ] Headline with staggered word reveal animation (fade in + slide up)
- [ ] "faster" word with animated gradient text effect
- [ ] Animated underline/highlight on "faster" that draws in after text appears
- [ ] Subtitle text with delayed fade-in animation
- [ ] `prefers-reduced-motion` support - shows content without animation

### Nice to Have
- [ ] Subtle continuous shimmer effect on gradient text
- [ ] Mouse parallax on headline text for depth

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | AnimatedHeadline, PillBadge, GradientTextAnimated | New |
| **Logic** | Stagger animation variants, useInView trigger | New |
| **Data** | homepageContentConfig.hero | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Framer Motion's `whileInView` with `stagger()` for text reveal per research findings. Leverage existing GradientText component pattern but enhance with animation. Keep animations tasteful per Perplexity research - functional, not decorative.

### Key Architectural Choices
1. Use `whileInView` with `viewport: { once: true }` for one-time animation on scroll into view
2. Implement text splitting at word level for staggered reveal
3. Use `@magicui/animated-gradient-text` pattern for the gradient effect
4. Animate underline separately with delay to create "drawing" effect

### Trade-offs Accepted
- More complex than simple static text
- Requires careful timing coordination between elements

## Required Credentials
> None required - purely frontend animation component

## Dependencies

### Blocks
- None

### Blocked By
- F1: Hero Section Foundation (provides container and positioning)
- S1936.I1: Design System Foundation (requires animation timing tokens)

### Parallel With
- F3: Social Proof & CTA (can be developed simultaneously after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-animated-headline.tsx` - Main headline component with animations

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Integrate animated headline into hero section
- `apps/web/config/homepage-content.config.ts` - Update hero content structure if needed

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create AnimatedHeadline component**: Container with motion variants for staggered reveal
2. **Implement PillBadge animation**: Fade in with bounce on load
3. **Create animated gradient text**: "faster" with gradient background-clip animation
4. **Add animated underline**: SVG or CSS underline that draws from left to right
5. **Integrate with homepage**: Replace existing hero title implementation
6. **Add reduced-motion fallback**: Static display when prefers-reduced-motion

### Suggested Order
1. AnimatedHeadline shell with static content
2. Word-level stagger animation
3. Gradient text for "faster"
4. Animated underline
5. PillBadge animation
6. Accessibility fallback

## Validation Commands
```bash
# Type check
pnpm typecheck

# Dev server visual inspection
pnpm dev
# Visit http://localhost:3000
# Verify: Pill fades in first, then headline words stagger, then "faster" gets gradient

# Test reduced motion
# Browser dev tools > Rendering > Emulate CSS media feature > prefers-reduced-motion: reduce
# Verify all content appears without animation

# Animation timing
# Open Performance panel, record page load, verify animations complete within 1.5s
```

## Related Files
- Initiative: `../initiative.md`
- Hero Foundation: `../S1936.I2.F1-Feature-hero-section-foundation/`
- Existing GradientText: `packages/ui/src/makerkit/marketing/gradient-text.tsx`
- Framer Motion Research: `../../research-library/context7-framer-motion-scroll.md`
