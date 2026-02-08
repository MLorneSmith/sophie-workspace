# Feature: Final CTA Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I5 |
| **Feature ID** | S1936.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Implement a full-width final call-to-action section with a large animated gradient orb, compelling headline, dual CTAs (Start Writing Free / Book a Demo), and trust badges. This section serves as the conversion crescendo before the footer.

## User Story
**As a** visitor who has scrolled through the entire homepage
**I want to** see a final, compelling invitation to get started
**So that** I feel confident and motivated to sign up or request a demo

## Acceptance Criteria

### Must Have
- [ ] Full-width section with dark/gradient background
- [ ] Large animated gradient orb (pulsing/floating effect)
- [ ] Headline: "Ready to transform your presentations?"
- [ ] Subheadline with value reinforcement
- [ ] Dual CTA buttons: "Start Writing Free" (primary) and "Book a Demo" (secondary)
- [ ] Trust badges row: "No credit card", "Free plan available", "Cancel anytime"
- [ ] Mobile responsive: orb scales down, CTAs stack vertically

### Nice to Have
- [ ] Orb follows subtle mouse movement (parallax effect)
- [ ] Scroll-triggered fade-in animation
- [ ] Animated particles around orb

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | FinalCtaSection, GradientOrb, TrustBadges | New |
| **Logic** | Orb animation (Framer Motion), optional mouse parallax | New |
| **Data** | CTA content config | New (static in homepage-content.config.ts) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create a self-contained section component with embedded GradientOrb animation. Use CSS gradients and Framer Motion for the orb effect rather than canvas/WebGL for performance and simplicity.

### Key Architectural Choices
1. Use CSS radial gradient with multiple color stops for orb appearance
2. Apply Framer Motion animate for breathing/floating effect (scale + opacity)
3. TrustBadges as a reusable component with icons
4. CTAs link to existing sign-up and demo booking paths

### Trade-offs Accepted
- CSS gradient orb is less sophisticated than canvas/3D but more performant
- Mouse parallax is nice-to-have, adds complexity for marginal benefit

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required - this is a static UI component with links to existing routes.

## Dependencies

### Blocks
- None (final section before footer)

### Blocked By
- S1936.I1: Design System Foundation (requires gradient tokens, animation variables)
- F2: Pricing Glass Cards (visual flow - final CTA after pricing)

### Parallel With
- None (sequential with F2)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-final-cta-section.tsx` - Main CTA section component
- `apps/web/app/(marketing)/_components/home-gradient-orb.tsx` - Animated gradient orb component
- `apps/web/app/(marketing)/_components/home-trust-badges.tsx` - Trust badges row component

### Modified Files
- `apps/web/config/homepage-content.config.ts` - Add final CTA content configuration
- `apps/web/app/(marketing)/page.tsx` - Import and render FinalCtaSection before footer

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define CTA content schema**: Add TypeScript interface and content to config
2. **Create GradientOrb component**: Animated gradient orb with CSS + Framer Motion
3. **Create TrustBadges component**: Row of trust indicators with icons
4. **Build FinalCtaSection container**: Layout with headline, CTAs, and orb positioning
5. **Integrate into homepage**: Add section after blog posts, before footer
6. **Add scroll animation**: Fade-in on viewport entry
7. **Add reduced motion support**: Respect user preferences for orb animation

### Suggested Order
1. CTA content schema (data contract)
2. TrustBadges component (simple, reusable)
3. GradientOrb component (animation focal point)
4. FinalCtaSection container (assembly)
5. Homepage integration (final wiring)
6. Scroll animation (enhancement)
7. Reduced motion support (accessibility)

## Validation Commands
```bash
# Start dev server
pnpm dev

# Check final CTA section renders
curl -s http://localhost:3000 | grep -c "final-cta"

# Check trust badges render
curl -s http://localhost:3000 | grep -c "No credit card"

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-saas-homepage-patterns.md` (CTA best practices)
- Research: `../../research-library/context7-framer-motion-scroll.md` (whileInView animations)
- Existing pattern: `apps/web/app/(marketing)/_components/book-demo-overlay.tsx` (demo booking path)
