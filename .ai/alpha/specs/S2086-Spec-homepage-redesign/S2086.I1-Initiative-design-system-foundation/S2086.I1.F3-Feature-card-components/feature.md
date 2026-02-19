# Feature: Card Components

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I1 |
| **Feature ID** | S2086.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Create three reusable card components for the homepage redesign: a GlassCard (backdrop-filter blur with subtle border and background opacity), a StatCard (accent-colored number with count-up animation and label), and a NoiseOverlay (subtle noise/grid texture overlay for depth). The existing CardSpotlight component already provides cursor-following spotlight behavior and will be reused as-is by section initiatives. These components are the visual building blocks for all 12 homepage sections.

## User Story
**As a** developer building homepage sections
**I want to** have reusable glass card, stat card, and noise overlay components styled with the dark-mode design tokens
**So that** I can compose consistent, premium-looking sections without reimplementing glass morphism, animated statistics, or texture effects

## Acceptance Criteria

### Must Have
- [ ] GlassCard component with `backdrop-filter: blur()`, subtle border (using `--homepage-border-subtle`), semi-transparent background (using `--homepage-surface`)
- [ ] GlassCard accepts `children`, `className`, and optional `glow` prop for accent border glow
- [ ] StatCard component displaying an accent-colored number (using `--homepage-accent`) + descriptive label
- [ ] StatCard integrates useCountUp hook from F2 for viewport-triggered count-up animation
- [ ] StatCard supports `suffix` prop (e.g., "+", "/5", "%") and `prefix` prop (e.g., "$")
- [ ] NoiseOverlay component rendering a subtle noise texture SVG overlay with configurable opacity
- [ ] All components use dark-mode design tokens from F1 (no hardcoded colors)
- [ ] All components are client components (`"use client"`)
- [ ] All components support `className` prop for composition
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### Nice to Have
- [ ] GlassCard supports `variant` prop ("default" | "elevated" | "featured") with different blur/opacity levels
- [ ] NoiseOverlay supports "noise" and "grid" texture modes
- [ ] StatCard supports `decimals` prop for values like "4.9/5"

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | GlassCard, StatCard, NoiseOverlay | New |
| **Logic** | useCountUp integration (from F2) | Existing (consume) |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create focused, composable components that use CSS custom properties from F1 for theming and the useCountUp hook from F2 for animation. Place in marketing `_components` directory alongside existing homepage components. GlassCard uses `backdrop-filter: blur()` with fallback for browsers that don't support it. StatCard wraps useCountUp with visual presentation. NoiseOverlay uses an inline SVG filter for the noise texture pattern.

### Key Architectural Choices
1. GlassCard uses CSS custom properties for all colors/opacities — changing tokens automatically updates all glass cards
2. StatCard is a presentational wrapper around useCountUp — the hook handles animation, the card handles styling
3. NoiseOverlay is a purely decorative component (aria-hidden) with pointer-events-none
4. Existing CardSpotlight is NOT modified — it already works well and will be used directly by section initiatives

### Trade-offs Accepted
- `backdrop-filter: blur()` has known performance issues on some mobile browsers — will need fallback solid bg in I6 (responsive polish)
- NoiseOverlay uses an inline SVG rather than an image file — slightly more markup but zero additional network requests

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Glass morphism card | GlassCard | New (custom) | No suitable registry component matches the specific design tokens integration |
| Stat with count-up | StatCard | New (custom) | Combines useCountUp hook with specific visual design |
| Noise texture | NoiseOverlay | New (custom) | Lightweight inline SVG approach |
| Spotlight card | CardSpotlight | Existing (aceternity) | Already implements cursor-following radial gradient |

## Required Credentials
None required — this feature is purely component work.

## Dependencies

### Blocks
- S2086.I2 (Hero & Product Preview) — uses GlassCard for product preview frame
- S2086.I3 (Trust & Credibility) — uses StatCard for statistics section
- S2086.I4 (Feature Showcase) — uses GlassCard for bento grid cards
- S2086.I5 (Social Proof & Conversion) — uses GlassCard for testimonial/pricing cards

### Blocked By
- F1: Dark-Mode Design Tokens (tokens needed for card styling)
- F2: Animation Infrastructure (useCountUp needed for StatCard)

### Parallel With
- F4: Section Container & Content Config (after F1 completes, F3 and F4 could overlap if F2 finishes quickly)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/glass-card.tsx` — Glass morphism card with backdrop-filter blur
- `apps/web/app/(marketing)/_components/stat-card.tsx` — Stat display with count-up animation and label
- `apps/web/app/(marketing)/_components/noise-overlay.tsx` — Decorative noise/grid texture SVG overlay

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create GlassCard component**: Client component with backdrop-filter blur, semi-transparent bg using design tokens, className support, optional glow prop
2. **Create StatCard component**: Client component integrating useCountUp, displaying accent-colored number with suffix/prefix and descriptive label
3. **Create NoiseOverlay component**: Purely decorative SVG noise texture with configurable opacity, aria-hidden, pointer-events-none
4. **Add GlassCard variant support**: Add "default" | "elevated" | "featured" variants with different blur/opacity levels
5. **Visual validation**: Render all three components in a test page to verify dark-mode styling, animation, and composition

### Suggested Order
1. GlassCard (T1) — foundational card, no animation dependency
2. StatCard (T2) — depends on useCountUp from F2
3. NoiseOverlay (T3) — independent, simple
4. Variant support (T4) — extends GlassCard
5. Visual validation (T5) — verifies all components together

## Validation Commands
```bash
# Verify new components exist
ls apps/web/app/\(marketing\)/_components/glass-card.tsx
ls apps/web/app/\(marketing\)/_components/stat-card.tsx
ls apps/web/app/\(marketing\)/_components/noise-overlay.tsx

# Verify components use design tokens
grep 'homepage-' apps/web/app/\(marketing\)/_components/glass-card.tsx
grep 'homepage-' apps/web/app/\(marketing\)/_components/stat-card.tsx

# Verify StatCard uses useCountUp
grep 'useCountUp' apps/web/app/\(marketing\)/_components/stat-card.tsx

# Type checking passes
pnpm typecheck

# Lint passes
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Design Tokens: `../S2086.I1.F1-Feature-dark-mode-design-tokens/feature.md`
- Animation Infra: `../S2086.I1.F2-Feature-animation-infrastructure/feature.md`
- Existing CardSpotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
- Research: `../../research-library/perplexity-saas-homepage-best-practices.md` (Section 3: Glassmorphism Trends)
