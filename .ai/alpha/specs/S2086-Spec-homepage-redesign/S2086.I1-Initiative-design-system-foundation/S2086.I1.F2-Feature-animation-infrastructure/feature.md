# Feature: Animation Infrastructure

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I1 |
| **Feature ID** | S2086.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Create the Motion animation infrastructure for the homepage redesign: a MotionProvider (LazyMotion + MotionConfig with reducedMotion: "user"), a reusable AnimateOnScroll wrapper (whileInView + viewport once), and a useCountUp hook (animate 0 to target on viewport entry). This provides the animation primitives that all section implementations in I2-I5 depend on.

## User Story
**As a** developer building animated homepage sections
**I want to** have a centralized motion provider, reusable scroll animation wrapper, and count-up hook
**So that** I can add consistent, accessible, performant animations to any section without duplicating animation boilerplate

## Acceptance Criteria

### Must Have
- [ ] MotionProvider component wrapping LazyMotion (domMax features, lazy-loaded) + MotionConfig (reducedMotion: "user")
- [ ] motion-features.ts file exporting domMax for dynamic import
- [ ] Marketing layout.tsx updated to wrap children with MotionProvider
- [ ] AnimateOnScroll component with configurable variants, delay, and viewport options (default: fade-up, once: true, amount: 0.2)
- [ ] useCountUp hook that animates from 0 to target number on viewport entry using Motion's `animate()` function
- [ ] All components use `"use client"` directive
- [ ] All components import from `"motion/react"` (NOT `"framer-motion"`)
- [ ] MotionProvider respects `prefers-reduced-motion` via MotionConfig
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### Nice to Have
- [ ] AnimateOnScroll supports `as` prop for rendering as different HTML elements (section, div, article)
- [ ] useCountUp supports custom formatters (e.g., "2,000+" suffix, "4.9/5" decimals)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | MotionProvider, AnimateOnScroll | New |
| **Logic** | useCountUp hook, motion-features.ts | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow the recommended patterns from Context7 research (research-library/context7-framer-motion.md). Use LazyMotion for code-splitting (~34KB savings), MotionConfig for global reducedMotion, and `animate()` from `motion` (not `motion/react`) for the count-up hook to avoid React re-renders. Place all components in the marketing `_components` directory since they are marketing-page-specific.

### Key Architectural Choices
1. Use `motion/react` import path (not `framer-motion`) per research findings — the package is now "Motion"
2. Use LazyMotion with `domMax` (not `domAnimation`) to support layout animations needed by card components
3. Place MotionProvider in marketing layout to scope animations to marketing pages only
4. useCountUp uses `animate()` from `"motion"` (imperative API) + `useInView` from `"motion/react"` for zero-rerender counting

### Trade-offs Accepted
- Using `domMax` instead of `domAnimation` increases bundle slightly but avoids feature-missing errors when layout animations are needed in I2-I5
- MotionProvider wraps entire marketing layout (not individual sections) for simplicity — slight overhead but enables cross-section animation coordination

## Required Credentials
None required — this feature uses the already-installed `framer-motion` / `motion` package.

## Dependencies

### Blocks
- F3: Card Components (stat card uses useCountUp; all cards use AnimateOnScroll)

### Blocked By
- None (independent of F1 — animation infrastructure doesn't need design tokens)

### Parallel With
- F1: Dark-Mode Design Tokens (can run in parallel)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/motion-provider.tsx` — LazyMotion + MotionConfig wrapper
- `apps/web/app/(marketing)/_components/motion-features.ts` — domMax export for lazy import
- `apps/web/app/(marketing)/_components/animate-on-scroll.tsx` — Reusable whileInView animation wrapper
- `apps/web/app/(marketing)/_hooks/use-count-up.ts` — Hook: animate 0→target on viewport entry

### Modified Files
- `apps/web/app/(marketing)/layout.tsx` — Wrap children with MotionProvider

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create motion-features.ts**: Single file exporting domMax for dynamic import by LazyMotion
2. **Create MotionProvider component**: LazyMotion wrapping MotionConfig with reducedMotion: "user", lazy-loading motion-features
3. **Create AnimateOnScroll component**: Configurable whileInView wrapper with default fade-up variants, once: true viewport
4. **Create useCountUp hook**: Uses `animate()` from `"motion"` + `useInView` from `"motion/react"` to count from 0 to target
5. **Update marketing layout**: Import and wrap children with MotionProvider
6. **Verify animation bundle**: Check that LazyMotion code-splits correctly (no full motion bundle in initial load)

### Suggested Order
1. motion-features.ts (T1) — dependency for MotionProvider
2. MotionProvider (T2) — needs motion-features
3. Update layout (T3) — needs MotionProvider
4. AnimateOnScroll (T4) — independent but needs provider in layout
5. useCountUp (T5) — independent
6. Bundle verification (T6) — validates all the above

## Validation Commands
```bash
# Verify new components exist
ls apps/web/app/\(marketing\)/_components/motion-provider.tsx
ls apps/web/app/\(marketing\)/_components/motion-features.ts
ls apps/web/app/\(marketing\)/_components/animate-on-scroll.tsx
ls apps/web/app/\(marketing\)/_hooks/use-count-up.ts

# Verify MotionProvider in layout
grep 'MotionProvider' apps/web/app/\(marketing\)/layout.tsx

# Verify correct import path
grep "motion/react" apps/web/app/\(marketing\)/_components/motion-provider.tsx
grep "motion/react" apps/web/app/\(marketing\)/_components/animate-on-scroll.tsx

# Type checking passes
pnpm typecheck

# Lint passes
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-framer-motion.md` (Sections 1, 3, 6, 7)
- Marketing layout: `apps/web/app/(marketing)/layout.tsx`
- Existing framer-motion usage: `packages/ui/src/aceternity/` (7 components use framer-motion)
