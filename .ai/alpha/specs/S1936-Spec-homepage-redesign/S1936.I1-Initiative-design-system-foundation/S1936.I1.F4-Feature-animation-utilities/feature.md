# Feature: Animation Utilities

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I1 |
| **Feature ID** | S1936.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Implement CSS custom properties for animation timing functions, duration scales, and keyframe animations that define the homepage's motion language. This includes signature animations like glow pulse, text reveal, and border rotation that will be used across all homepage sections.

## User Story
**As a** developer adding animations to homepage sections
**I want to** use consistent timing functions and pre-built keyframe animations
**So that** all motion feels cohesive and follows the premium aesthetic inspired by Linear, Cargo, and OrbitAI

## Acceptance Criteria

### Must Have
- [ ] Timing function tokens (`--homepage-ease-out-expo`, `--homepage-ease-out-quart`, `--homepage-ease-in-out`, `--homepage-ease-spring`)
- [ ] Duration scale tokens (`--homepage-duration-instant` through `--homepage-duration-slowest`)
- [ ] Keyframe: `@keyframes homepage-glow-pulse` for CTA buttons
- [ ] Keyframe: `@keyframes homepage-fade-up` for scroll-triggered reveals
- [ ] Keyframe: `@keyframes homepage-border-rotate` for gradient border animation
- [ ] Prefers-reduced-motion media query support for all animations

### Nice to Have
- [ ] Keyframe: `@keyframes homepage-reveal-letter` for character-by-character text animation
- [ ] Animation utility classes (`.animate-homepage-glow-pulse`, etc.)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (CSS only) | N/A |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Define CSS keyframes and timing tokens that complement Framer Motion. The CSS animations handle simple, repetitive animations (glow pulse, border rotation) while Framer Motion handles complex scroll-triggered and interaction-based animations. This hybrid approach leverages each tool's strengths.

### Key Architectural Choices
1. Use CSS custom properties for timing functions to enable Framer Motion integration
2. Create keyframes that can be composed via Tailwind's animation utilities
3. Always include `@media (prefers-reduced-motion: reduce)` overrides
4. Use GPU-accelerated properties (transform, opacity) for smooth 60fps

### Trade-offs Accepted
- Duplicates some easing functions that Framer Motion also provides, but CSS fallbacks ensure graceful degradation

## Required Credentials
None required - this is a CSS-only feature.

## Dependencies

### Blocks
- All downstream initiatives will use these animation utilities
- Specifically: I2 hero animations, I3 statistics counters, I5 comparison animations

### Blocked By
- F1: Color Token System (glow-pulse uses accent-glow color)

### Parallel With
- F2: Typography Scale (independent)
- F3: Spacing & Layout Tokens (independent)
- F5: Glass Effect Utilities (shares glow colors)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/theme.css` - Add timing and duration tokens in `@theme inline` block
- `apps/web/styles/globals.css` - Add keyframe definitions and animation utility classes

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add timing function tokens**: Define 4 easing curves as CSS variables
2. **Add duration scale tokens**: Define 7 duration levels (instant through slowest)
3. **Create glow-pulse keyframe**: Implement pulsing box-shadow animation
4. **Create fade-up keyframe**: Implement scroll reveal animation
5. **Create border-rotate keyframe**: Implement gradient border rotation with CSS Houdini @property
6. **Add reduced-motion support**: Wrap all animations in prefers-reduced-motion media query
7. **Create animation utility classes**: Add Tailwind-compatible animation classes

### Suggested Order
1. Timing functions → 2. Durations → 3. Glow-pulse → 4. Fade-up → 5. Border-rotate → 6. Reduced motion → 7. Utility classes

## Validation Commands
```bash
# Verify tokens are defined
grep -c "homepage-ease" apps/web/styles/theme.css
grep -c "homepage-duration" apps/web/styles/theme.css

# Verify keyframes
grep -c "@keyframes homepage" apps/web/styles/globals.css

# Verify reduced-motion support
grep -c "prefers-reduced-motion" apps/web/styles/globals.css

# Typecheck
pnpm typecheck

# Visual validation
pnpm dev
```

## Related Files
- Initiative: `../initiative.md`
- Design Reference: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md` (Section D: Animation Principles)
- Research: `../research-library/context7-framer-motion-scroll.md` (Framer Motion patterns)
