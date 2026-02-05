# Feature: Glass Effect Utilities

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I1 |
| **Feature ID** | S1936.I1.F5 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 5 |

## Description
Create CSS utility classes and custom properties for glassmorphism effects including backdrop blur, translucent backgrounds, subtle borders, and spotlight gradients. These utilities enable the premium card aesthetics inspired by Linear and Cargo for testimonials, features, and pricing sections.

## User Story
**As a** developer building glass-styled cards and surfaces
**I want to** use pre-defined glass effect utilities
**So that** I can quickly apply consistent glassmorphism styling without recreating the effect for each component

## Acceptance Criteria

### Must Have
- [ ] Glass card utility class (`.homepage-glass-card`) with backdrop-blur, background opacity, and border
- [ ] Spotlight card utility (`.homepage-spotlight-card`) base styles for cursor-following effects
- [ ] Stat card utility (`.homepage-stat-card`) optimized for large numbers with accent glow
- [ ] Glass effect tokens (`--homepage-glass-blur`, `--homepage-glass-bg-opacity`, `--homepage-glass-border`)
- [ ] Visual garnish utilities (gradient orb, grid pattern overlay, noise texture)

### Nice to Have
- [ ] Dark mode adjustments for glass effects (different blur/opacity values)
- [ ] Performance-optimized versions that skip backdrop-blur on low-powered devices

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (CSS only) | N/A |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create reusable CSS utility classes that can be applied to any element, complementing existing CardSpotlight component. The utilities handle visual styling while components handle interactivity (mouse tracking, animations).

### Key Architectural Choices
1. Use `@layer utilities` for proper Tailwind CSS 4 integration
2. Combine backdrop-filter, background-color with alpha, and border in single utility
3. Provide CSS custom properties for fine-tuning (blur amount, opacity)
4. Include gradient orb and noise texture as background-image utilities

### Trade-offs Accepted
- Backdrop-filter has performance cost; documented for developers to use judiciously
- Noise texture increases asset size slightly but adds premium tactile quality

## Required Credentials
None required - this is a CSS-only feature.

## Dependencies

### Blocks
- I3: Trust Elements (testimonials use glass cards)
- I4: Value Proposition (features grid uses spotlight cards)
- I5: Conversion (pricing uses glass cards)

### Blocked By
- F1: Color Token System (glass effects use background and accent colors)
- F4: Animation Utilities (spotlight effects use glow-pulse)

### Parallel With
- None (last in sequence due to dependencies)

## Files to Create/Modify

### New Files
- `apps/web/public/textures/noise.svg` - SVG noise texture for tactile quality (optional)

### Modified Files
- `apps/web/styles/theme.css` - Add glass effect tokens in `@theme inline` block
- `apps/web/styles/globals.css` - Add utility classes in `@layer utilities`

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add glass effect tokens**: Define blur, bg-opacity, and border variables
2. **Create glass-card utility**: Implement primary glass card class with all effects
3. **Create spotlight-card base utility**: Implement base styles for spotlight cards
4. **Create stat-card utility**: Implement card optimized for statistics display
5. **Create gradient-orb utility**: Add background gradient orb for section decoration
6. **Create noise-texture utility**: Add subtle grain overlay (optional)
7. **Add performance documentation**: Comment which effects are GPU-intensive

### Suggested Order
1. Glass effect tokens → 2. Glass-card utility → 3. Spotlight-card utility → 4. Stat-card utility → 5. Gradient-orb → 6. Noise texture → 7. Documentation

## Validation Commands
```bash
# Verify tokens are defined
grep -c "homepage-glass" apps/web/styles/theme.css

# Verify utility classes
grep -c "homepage-glass-card" apps/web/styles/globals.css
grep -c "homepage-spotlight-card" apps/web/styles/globals.css
grep -c "homepage-stat-card" apps/web/styles/globals.css

# Typecheck
pnpm typecheck

# Visual validation
pnpm dev
```

## Related Files
- Initiative: `../initiative.md`
- Design Reference: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md` (Section E: Component Patterns)
- Existing component: `packages/ui/src/aceternity/card-spotlight.tsx`
