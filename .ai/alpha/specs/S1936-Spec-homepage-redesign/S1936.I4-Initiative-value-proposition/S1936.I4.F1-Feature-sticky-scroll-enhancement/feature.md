# Feature: Sticky Scroll Enhancement

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I4 |
| **Feature ID** | S1936.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Enhance the existing StickyScrollReveal component with numbered overlines (01/03, 02/03, 03/03), a scroll progress indicator, and parallax images. This builds on the existing Aceternity component at `packages/ui/src/aceternity/sticky-scroll-reveal.tsx` which already tracks scroll position and active card state.

## User Story
**As a** first-time visitor
**I want to** see clear progress through the feature explanation sections
**So that** I understand how much content remains and can track my reading position

## Acceptance Criteria

### Must Have
- [ ] Numbered overlines appear above each feature title (01/03, 02/03, 03/03)
- [ ] Progress indicator shows current scroll position through the section
- [ ] Active overline uses primary color, inactive uses muted-foreground
- [ ] Progress animates smoothly with scroll (no jank)
- [ ] Overline transitions with same timing as existing text transitions

### Nice to Have
- [ ] Parallax effect on sticky images (subtle Y-offset based on scroll)
- [ ] Micro-animation on overline number change

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | StickyScrollReveal enhancement | Modify existing |
| **Logic** | Scroll progress calculation | Extend existing |
| **Data** | Content config with overlines | Extend existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic (extend existing component)
**Rationale**: The StickyScrollReveal component already tracks `scrollYProgress` and `activeCard` state. We can add numbered overlines and progress indicator with minimal changes by:
1. Adding `overline` prop to content items
2. Creating a progress indicator sub-component
3. Using existing scroll values for progress calculation

### Key Architectural Choices
1. Extend content interface to include optional `overline: string` field
2. Add progress indicator as absolute-positioned element within the component
3. Use existing `springConfig` for animation consistency

### Trade-offs Accepted
- Modifying a shared UI component (acceptable since it's backward-compatible with optional props)

## Required Credentials
> None required - this is a frontend-only enhancement

## Dependencies

### Blocks
- F3, F4: Features bento grid depends on this establishing scroll animation patterns

### Blocked By
- S1936.I1: Design System Foundation (color tokens, animation utilities)

### Parallel With
- F2: How It Works Stepper (both are independent sections)

## Files to Create/Modify

### New Files
- None - all modifications to existing files

### Modified Files
- `packages/ui/src/aceternity/sticky-scroll-reveal.tsx` - Add overline rendering, progress indicator
- `apps/web/config/homepage-content.config.ts` - Add overline strings to content items
- `apps/web/app/(marketing)/_components/home-sticky-scroll-client.tsx` - Pass overlines if needed

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add overline to content interface**: Extend StickyContentItem with optional overline field
2. **Render overlines in component**: Add overline display above title with appropriate styling
3. **Create progress indicator**: Add vertical progress bar showing scroll position
4. **Update homepage content**: Add numbered overlines to sticky scroll content config
5. **Add parallax to images**: Apply subtle Y-transform based on scroll progress (if time permits)

### Suggested Order
1. Interface extension (types first)
2. Overline rendering (visual first)
3. Progress indicator (new sub-component)
4. Content config update
5. Parallax enhancement (polish)

## Validation Commands
```bash
# TypeScript compilation
pnpm typecheck

# Component renders
curl -s http://localhost:3000 | grep -c "01 / 03"

# Progress indicator present
curl -s http://localhost:3000 | grep -c "progress"

# Visual inspection
pnpm dev
# Check: Overlines visible, progress animates on scroll
```

## Related Files
- Initiative: `../initiative.md`
- Existing component: `packages/ui/src/aceternity/sticky-scroll-reveal.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
- Client wrapper: `apps/web/app/(marketing)/_components/home-sticky-scroll-client.tsx`
- Framer Motion research: `../../research-library/context7-framer-motion-scroll.md`
