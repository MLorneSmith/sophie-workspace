# Feature: Logo Cloud Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I3 |
| **Feature ID** | S2086.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Restyle the existing LogoCloudMarquee component to match the new dark-mode design system. Simplify to a single continuous marquee row, update the heading to "Trusted by professionals at", apply design tokens from I1, and ensure grayscale logos with hover-to-full-opacity transitions and gradient edge fades work within the new theme.

## User Story
**As a** first-time visitor to the SlideHeroes homepage
**I want to** see recognizable company logos scrolling in a trust banner
**So that** I immediately feel confident that established organizations use this product

## Acceptance Criteria

### Must Have
- [ ] Single continuous marquee row with `react-fast-marquee`
- [ ] Heading reads "Trusted by professionals at" with design system typography
- [ ] All 15 greyscale logos displayed with hover → full opacity transition
- [ ] Gradient edge fades on left and right edges of marquee container
- [ ] Dark mode styling using I1 design tokens (#0a0a0f background, #24a9e0 accent)
- [ ] AnimateOnScroll wrapper for section entrance animation (fade-in on viewport)
- [ ] Section integrates into homepage between Product Preview and Statistics
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### Nice to Have
- [ ] Smooth spring animation on logo hover (scale 1.05)
- [ ] Configurable marquee speed via content config

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Logo cloud section component + restyled marquee | Existing / Modified |
| **Logic** | Marquee animation, hover transitions | Existing |
| **Data** | Logo array, section content in config | Existing / Modified |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic — restyle existing components rather than rebuild
**Rationale**: The existing `LogoCloudMarquee` in `packages/ui/src/aceternity/logo-marquee.tsx` already provides 80% of the functionality (marquee, grayscale, hover, gradient fades). The primary work is restyling for the new dark design system and simplifying from dual-row to single-row marquee.

### Key Architectural Choices
1. Modify the existing `home-logo-cloud-client.tsx` wrapper to pass new props/config
2. Either modify `LogoCloudMarquee` to support single-row mode or create a new thin wrapper component in `_components/` that uses `react-fast-marquee` directly with the logo array

### Trade-offs Accepted
- Modifying an existing Aceternity component couples it to this homepage redesign, but the component is already customized for this project

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Marquee | `react-fast-marquee` | Already installed | Proven infinite scroll library |
| Hover animation | `motion.div` | motion/react | Consistent with I1 motion system |
| Section wrapper | AnimateOnScroll | I1 (new) | Unified viewport animation pattern |

## Required Credentials
> None required — all logos are static SVGs, no external services.

## Dependencies

### Blocks
- S2086.I6: Responsive & Accessibility Polish

### Blocked By
- S2086.I1: Design System Foundation (design tokens, AnimateOnScroll, MotionProvider in layout)

### Parallel With
- F2: Statistics Section

## Files to Create/Modify

### New Files
- None expected (restyle existing components)

### Modified Files
- `apps/web/app/(marketing)/_components/home-logo-cloud-client.tsx` — Restyle for dark theme, single-row marquee
- `packages/ui/src/aceternity/logo-marquee.tsx` — Possibly add single-row mode prop, update default styling
- `apps/web/config/homepage-content.config.ts` — Add `logoCloud` section config (heading text, marquee speed)
- `apps/web/app/(marketing)/page.tsx` — Update logo cloud section to use new styling/config

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add logoCloud config to content config**: Add heading text and marquee speed settings
2. **Restyle LogoCloudMarquee for dark theme**: Update component to accept single-row mode, apply dark design tokens
3. **Update homepage logo cloud section**: Integrate restyled component with AnimateOnScroll wrapper
4. **Validate logo cloud rendering**: Visual verification, typecheck, lint

### Suggested Order
Config → Component restyle → Homepage integration → Validation

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-logo-cloud-client.tsx

# Verify logos exist
ls public/images/logos/greyscale/ | wc -l  # Should be 15

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Existing component: `packages/ui/src/aceternity/logo-marquee.tsx`
- Existing wrapper: `apps/web/app/(marketing)/_components/home-logo-cloud-client.tsx`
- Greyscale logos: `public/images/logos/greyscale/`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
