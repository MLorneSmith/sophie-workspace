# Feature: Spotlight Feature Cards

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I4 |
| **Feature ID** | S1936.I4.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Add mouse-following spotlight hover effects to the bento grid feature cards. The spotlight effect creates a radial gradient that tracks cursor position, adding an interactive premium feel. This builds on the existing CardSpotlight component at `packages/ui/src/aceternity/card-spotlight.tsx`.

## User Story
**As a** visitor browsing the features section
**I want to** see responsive visual feedback when hovering over feature cards
**So that** the interface feels premium and interactive

## Acceptance Criteria

### Must Have
- [ ] Mouse-following spotlight gradient appears on card hover
- [ ] Spotlight effect uses primary color gradient (matches design system)
- [ ] Effect activates only on hover (not touch/mobile)
- [ ] Smooth opacity transition on hover enter/leave
- [ ] Works with bento grid cards of varying sizes
- [ ] No performance issues with multiple cards (60fps)

### Nice to Have
- [ ] Subtle border glow enhancement on hover
- [ ] Spotlight radius adjusts based on card size
- [ ] Gradient colors configurable per card

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SpotlightCard wrapper or hook | New or modify existing |
| **Logic** | Mouse position tracking | Exists in CardSpotlight |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic (extract reusable spotlight hook from existing component)
**Rationale**: The existing CardSpotlight component at `packages/ui/src/aceternity/card-spotlight.tsx` implements the exact spotlight effect we need. However, it's a complete card component with specific content structure. We have two options:
1. **Wrap BentoGridItem with CardSpotlight** - Compositional but may have nested styling issues
2. **Extract useSpotlightEffect hook** - More flexible, can apply to any element

Option 2 is preferred for flexibility - extracting the spotlight logic into a reusable hook allows us to apply it to BentoGridItem cards without restructuring the component hierarchy.

### Key Architectural Choices
1. Extract spotlight logic into `useSpotlightEffect` custom hook
2. Hook returns: `{ ref, style, onMouseMove, onMouseEnter, onMouseLeave }`
3. Apply hook to BentoGridItem cards via spread props
4. Keep CardSpotlight component intact for backward compatibility
5. Spotlight uses Framer Motion `useMotionValue` and `useMotionTemplate` (existing pattern)

### Trade-offs Accepted
- Creating abstraction adds complexity vs just using CardSpotlight directly
- Justification: BentoGridItem has its own content structure; wrapping would break layout

## Required Credentials
> None required - this is a frontend-only component

## Dependencies

### Blocks
- None

### Blocked By
- F3: Bento Grid Layout (spotlight applies to bento cards)
- S1936.I1: Design System Foundation (gradient colors from design tokens)

### Parallel With
- F1: Sticky Scroll Enhancement
- F2: How It Works Stepper

## Files to Create/Modify

### New Files
- `packages/ui/src/hooks/use-spotlight-effect.ts` - Custom hook for spotlight behavior

### Modified Files
- `packages/ui/src/aceternity/bento-grid.tsx` - Apply spotlight to BentoGridItem
- `packages/ui/package.json` - Export the new hook
- `packages/ui/src/aceternity/card-spotlight.tsx` - Refactor to use shared hook (optional)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Extract useSpotlightEffect hook**: Move mouse tracking logic from CardSpotlight to hook
2. **Create spotlight overlay component**: Reusable motion.div with gradient mask
3. **Apply spotlight to BentoGridItem**: Integrate hook into bento grid cards
4. **Configure gradient colors**: Use design system colors for spotlight gradient
5. **Performance optimization**: Test with multiple cards, ensure smooth animations
6. **Mobile handling**: Disable spotlight on touch devices (no hover state)
7. **Optional: Refactor CardSpotlight**: Use hook internally for DRY

### Suggested Order
1. Extract hook (foundation)
2. Test hook in isolation
3. Apply to BentoGridItem
4. Color configuration
5. Performance testing
6. Mobile handling
7. Optional CardSpotlight refactor

## Validation Commands
```bash
# Hook created
ls packages/ui/src/hooks/ | grep -c "spotlight"

# TypeScript compilation
pnpm typecheck

# Export present
grep -c "useSpotlightEffect" packages/ui/package.json

# Visual inspection
pnpm dev
# Check: Hover over feature cards, spotlight follows mouse
# Check: Performance is smooth (60fps)
# Check: Works on all card sizes
```

## Related Files
- Initiative: `../initiative.md`
- Existing CardSpotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
- BentoGrid (created in F3): `packages/ui/src/aceternity/bento-grid.tsx`
- Framer Motion patterns: Motion useMotionValue, useMotionTemplate
