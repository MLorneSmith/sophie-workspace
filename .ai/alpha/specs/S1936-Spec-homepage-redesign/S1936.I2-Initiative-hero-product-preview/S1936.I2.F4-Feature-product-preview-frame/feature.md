# Feature: Product Preview Browser Frame

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I2 |
| **Feature ID** | S1936.I2.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Redesign the product preview section with an enhanced browser-frame mockup featuring 3D perspective tilt on scroll, animated gradient border, and a radial glow effect underneath. This creates a premium visual demonstration of the product that responds to user interaction.

## User Story
**As a** visitor exploring SlideHeroes
**I want to** see the product in an immersive, interactive preview
**So that** I can visualize using it and understand its professional quality

## Acceptance Criteria

### Must Have
- [ ] Browser frame mockup with traffic light dots and title bar
- [ ] 3D perspective tilt effect that responds to scroll position
- [ ] Product screenshot/image inside the browser frame
- [ ] Radial gradient glow effect underneath the frame
- [ ] Smooth spring physics for natural-feeling animations
- [ ] Mobile responsive (reduced/no tilt on mobile)
- [ ] `prefers-reduced-motion` support

### Nice to Have
- [ ] Animated gradient border that slowly rotates around the frame
- [ ] Subtle shadow that grows/shrinks with perspective
- [ ] Mouse parallax effect on hover (additional to scroll)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ProductPreviewFrame, BrowserMockup, GlowEffect | New |
| **Logic** | Scroll-linked transforms, spring animations | Enhance existing |
| **Data** | Product screenshot image | Static asset |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Build on existing ContainerScrollAnimation component pattern but enhance with browser frame styling, gradient border, and glow effect. Use Framer Motion's `useScroll` + `useTransform` + `useSpring` per research findings.

### Key Architectural Choices
1. Wrap ContainerScrollAnimation with new browser frame styling
2. Add `@magicui/border-beam` for animated border effect
3. Create separate GlowEffect component using CSS radial gradients
4. Use existing `useScroll` pattern from ContainerScrollAnimation

### Trade-offs Accepted
- More complex than simple image display
- Requires high-quality product screenshot (dependency on design asset)
- Scroll animation may feel different on devices with different scroll behavior

## Required Credentials
> None required - purely frontend component with static assets

## Dependencies

### Blocks
- None (final feature in this initiative)

### Blocked By
- F1: Hero Section Foundation (provides positioning context)
- S1936.I1: Design System Foundation (requires glow color tokens)

### Parallel With
- F2: Animated Headline
- F3: Social Proof & CTA

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-product-preview-frame.tsx` - Enhanced product preview with browser frame
- `apps/web/app/(marketing)/_components/home-browser-mockup.tsx` - Browser window chrome component
- `apps/web/app/(marketing)/_components/home-glow-effect.tsx` - Radial gradient glow beneath frame

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Replace current ContainerScroll implementation
- `apps/web/public/images/` - Add new product screenshot if needed

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Scroll animation | ContainerScrollAnimation | Aceternity (existing) | Proven pattern, enhance don't replace |
| Border animation | border-beam | @magicui | Animated beam effect for premium feel |
| Glow effect | Custom | CSS radial-gradient | Simple, performant, no library needed |
| Browser frame | Custom | New component | Tailored to design requirements |

**Components to Install** (if not already in packages/ui):
- [ ] `cd packages/ui && npx shadcn@latest add @magicui/border-beam`

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create BrowserMockup component**: Traffic lights, title bar, rounded corners
2. **Create GlowEffect component**: Radial gradient positioned below frame
3. **Enhance ContainerScrollAnimation**: Add perspective tilt configuration
4. **Install border-beam component**: Add animated border from MagicUI
5. **Create ProductPreviewFrame component**: Compose all elements together
6. **Add product screenshot**: High-quality image of SlideHeroes canvas
7. **Integrate with homepage**: Replace current ContainerScroll usage
8. **Add reduced-motion support**: Static display without animations

### Suggested Order
1. BrowserMockup component (pure UI)
2. GlowEffect component (pure UI)
3. Install border-beam
4. ProductPreviewFrame composition
5. Product screenshot integration
6. Homepage integration
7. Reduced-motion fallback
8. Responsive polish

## Validation Commands
```bash
# Type check
pnpm typecheck

# Dev server visual inspection
pnpm dev
# Visit http://localhost:3000
# Scroll down slowly - verify:
# - Frame tilts from 15deg to 0deg
# - Scale changes smoothly
# - Glow effect visible beneath
# - Border animates (if implemented)

# Performance check
# Open Performance panel, record scroll interaction
# Verify no jank (dropped frames) during scroll animation

# Mobile check
# Chrome DevTools > Toggle device toolbar
# Verify frame displays without tilt animation (or reduced)

# Reduced motion
# Browser dev tools > Rendering > prefers-reduced-motion: reduce
# Verify frame displays statically without scroll animations
```

## Related Files
- Initiative: `../initiative.md`
- Hero Foundation: `../S1936.I2.F1-Feature-hero-section-foundation/`
- Existing Container Scroll: `packages/ui/src/aceternity/container-scroll-animation.tsx`
- Framer Motion Research: `../../research-library/context7-framer-motion-scroll.md`
