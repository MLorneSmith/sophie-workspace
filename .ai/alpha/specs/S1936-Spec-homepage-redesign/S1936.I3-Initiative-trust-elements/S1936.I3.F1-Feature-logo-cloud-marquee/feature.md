# Feature: Logo Cloud Marquee Enhancement

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I3 |
| **Feature ID** | S1936.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Enhance the existing logo cloud marquee component with grayscale-to-color hover effects, gradient edge fades for seamless looping, and verify dual-row opposite direction animation. The component already exists at `packages/ui/src/aceternity/logo-marquee.tsx` with basic functionality.

## User Story
**As a** first-time visitor
**I want to** see recognizable company logos from trusted brands
**So that** I feel confident that SlideHeroes is used by reputable organizations

## Acceptance Criteria

### Must Have
- [ ] Logos display in grayscale by default
- [ ] Logos colorize on hover with smooth transition
- [ ] Dual-row marquee with opposite scroll directions
- [ ] Gradient fade on left/right edges for seamless loop effect
- [ ] Hover pauses the marquee animation
- [ ] Mobile responsive (single row on small screens)

### Nice to Have
- [ ] Subtle glow effect on hover
- [ ] Accessibility: pause button for reduced motion preference

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `LogoCloudMarquee` in `packages/ui/src/aceternity/logo-marquee.tsx` | Existing - Enhance |
| **Logic** | Hover state management | Existing - Enhance |
| **Data** | Logo array from `homepageContentConfig` | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal Enhancement
**Rationale**: The component already implements dual-row marquee with pause-on-hover. Only CSS enhancements needed for grayscale filter and gradient masks.

### Key Architectural Choices
1. Use CSS `filter: grayscale(1)` with `transition` for hover colorization
2. Use CSS gradient masks (`mask-image`) for edge fades instead of overlay divs
3. Keep existing react-fast-marquee implementation

### Trade-offs Accepted
- Gradient masks have limited browser support in very old browsers (acceptable for marketing page)

## Required Credentials
> Environment variables required for this feature to function.

None required - static assets only.

## Dependencies

### Blocks
- None within initiative

### Blocked By
- S1936.I1: Design System Foundation (needs color tokens for hover effects, grayscale CSS utilities)

### Parallel With
- F2: Statistics Counter Section
- F3: Testimonials Grid Enhancement

## Files to Create/Modify

### New Files
- None

### Modified Files
- `packages/ui/src/aceternity/logo-marquee.tsx` - Add grayscale filter, hover colorization, gradient masks
- `apps/web/styles/shadcn-ui.css` - Add `.logo-grayscale` utility if not in I1

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add grayscale filter CSS**: Add `filter: grayscale(1)` default state with `filter: grayscale(0)` on hover
2. **Add gradient edge masks**: Implement `mask-image: linear-gradient(...)` for seamless left/right fades
3. **Verify dual-row opposite direction**: Ensure second row uses `direction="right"` (may already work)
4. **Add reduced motion support**: Check `prefers-reduced-motion` and disable animation
5. **Update logo assets**: Verify all logos have proper contrast for both modes

### Suggested Order
1. Grayscale filter (foundation)
2. Hover colorization transition
3. Gradient edge masks
4. Responsive adjustments
5. Reduced motion support

## Validation Commands
```bash
# Check component exists
ls packages/ui/src/aceternity/logo-marquee.tsx

# Verify logo assets
ls -la apps/web/public/images/logos/

# Run dev server and visually inspect
pnpm dev

# Check for CSS filter support
grep -r "grayscale" packages/ui/src/

# Typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Existing Component: `packages/ui/src/aceternity/logo-marquee.tsx`
- Client Wrapper: `apps/web/app/(marketing)/_components/home-logo-cloud-client.tsx`
- Logo Assets: `apps/web/public/images/logos/`
- Research: `../../research-library/perplexity-saas-homepage-patterns.md` (Section 3: Logo Bars)
