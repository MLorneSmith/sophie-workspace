# Feature: Sticky Scroll Features Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I4 |
| **Feature ID** | S2086.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 1 |

## Description
Redesign the existing Sticky Scroll Features section with a two-column layout (40% text / 60% image), numbered overlines (01/03, 02/03, 03/03), a vertical progress indicator synced to scroll position, device-framed images on the right column, and glass card styling with the dark theme. Replaces the current `StickyScrollReveal` usage with a custom scroll-linked implementation.

## User Story
**As a** first-time visitor to the SlideHeroes homepage
**I want to** see a visually engaging, scroll-driven walkthrough of the three core offerings (AI Canvas, Training, Coaching)
**So that** I understand the product's value proposition clearly as I scroll through the page

## Acceptance Criteria

### Must Have
- [ ] Two-column layout: 40% text (left) / 60% image (right) on desktop
- [ ] Numbered overlines showing current position (01 / 03, 02 / 03, 03 / 03)
- [ ] Vertical progress indicator bar that fills based on scroll position within the section
- [ ] Device-framed images on the right column (browser/laptop mockup frame)
- [ ] Glass card styling with dark theme (uses I1 design tokens)
- [ ] Text content sticky on left while images swap on scroll
- [ ] Smooth opacity/position transitions between steps using Framer Motion `useScroll` + `useTransform`
- [ ] Content config updated with new sticky scroll data structure
- [ ] `prefers-reduced-motion` respected (instant swap without animation)
- [ ] Section renders correctly in isolation on the homepage

### Nice to Have
- [ ] Subtle parallax on device frame during scroll
- [ ] "Learn more" link per section that navigates to product page

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `home-sticky-scroll-client.tsx` (rewrite), device-frame wrapper | New |
| **Logic** | Scroll tracking with `useScroll`/`useTransform`, progress calculation | New |
| **Data** | `homepage-content.config.ts` sticky section update | Modified |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic — Custom implementation using Framer Motion `useScroll` + `useTransform` directly, replacing the generic Aceternity `StickyScrollReveal` component.

**Rationale**: The existing `StickyScrollReveal` uses global `scrollYProgress` (not scoped to the section container) and lacks progress indicator, numbered overlines, and device-frame support. A custom implementation using `useScroll({ target: containerRef })` gives us scoped scroll tracking and full control over the two-column layout.

### Key Architectural Choices
1. Use `useScroll({ target: containerRef, offset: ["start start", "end end"] })` for section-scoped progress tracking
2. Map `scrollYProgress` to active step index via `useTransform` with breakpoints at 0.33 and 0.66
3. Progress bar height derived directly from `scrollYProgress` via `useTransform(scrollYProgress, [0, 1], ["0%", "100%"])`
4. Device frame as a reusable wrapper component (CSS-only browser chrome with dots)

### Trade-offs Accepted
- Abandoning the Aceternity `StickyScrollReveal` component means no upstream updates, but the current component has limitations that make it unsuitable for the new design

## Required Credentials
> None required — no external services or API keys needed.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, MotionProvider, AnimateOnScroll, glass card styling)

### Parallel With
- F2: How It Works Stepper
- F3: Bento Features Grid

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-sticky-scroll-client.tsx` — Complete rewrite of sticky scroll section (client component)
- `apps/web/app/(marketing)/_components/device-frame.tsx` — Reusable browser/device frame wrapper component

### Modified Files
- `apps/web/config/homepage-content.config.ts` — Update sticky section content structure (add imageSrc, overline numbering)
- `apps/web/app/(marketing)/page.tsx` — Update sticky scroll section integration (new component props)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Update content config**: Add numbered overlines and device frame metadata to sticky content structure
2. **Create device frame component**: CSS-only browser chrome with traffic light dots, title bar, rounded corners
3. **Build sticky scroll component**: Two-column layout with `useScroll`, `useTransform`, progress indicator, numbered overlines, AnimatePresence image swap
4. **Integrate on homepage**: Replace existing StickyScrollReveal usage in `page.tsx` with new component
5. **Validate and lint**: Run typecheck, lint, format

### Suggested Order
1 → 2 → 3 → 4 → 5 (sequential — each builds on the previous)

## Validation Commands
```bash
# Verify new component exists
ls apps/web/app/\(marketing\)/_components/home-sticky-scroll-client.tsx
ls apps/web/app/\(marketing\)/_components/device-frame.tsx

# Verify content config updated
grep 'overline\|01 / 03\|deviceFrame' apps/web/config/homepage-content.config.ts

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Current component: `apps/web/app/(marketing)/_components/home-sticky-scroll-client.tsx`
- Aceternity original: `packages/ui/src/aceternity/sticky-scroll-reveal.tsx`
- Framer Motion patterns: `../../research-library/context7-framer-motion.md` (Section 8: Sticky Scroll)
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
