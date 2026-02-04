# Feature: Statistics Counter Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I3 |
| **Feature ID** | S1936.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 2 |

## Description
Create a new statistics section with animated number counters that trigger on scroll into view. The section displays 4 key metrics (users, presentations, rating, time saved) in a responsive 4-column grid. Numbers animate from 0 to target value using spring physics when the section enters the viewport.

## User Story
**As a** potential customer
**I want to** see concrete numbers about SlideHeroes' impact
**So that** I can quantify the value and trust that others have benefited

## Acceptance Criteria

### Must Have
- [ ] 4 statistics displayed in a responsive grid (4 cols desktop, 2 tablet, 1 mobile)
- [ ] Each statistic shows: large animated number, suffix/prefix, descriptive label
- [ ] Numbers count up from 0 when section scrolls into view
- [ ] Animation uses spring physics for natural feel (useSpring)
- [ ] Animation triggers only once per page load
- [ ] Numbers format correctly (e.g., "2,000+" with commas)
- [ ] Section has clear heading and subtle background

### Nice to Have
- [ ] Staggered animation (each counter starts 100ms after previous)
- [ ] Subtle icon for each statistic
- [ ] Reduced motion support (show final value immediately)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `AnimatedCounter` component | New |
| **UI** | `StatisticsSection` wrapper | New |
| **Logic** | `useInView` + `useSpring` scroll trigger | New |
| **Data** | Statistics config in `homepageContentConfig` | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - New Components Following Existing Patterns
**Rationale**: No existing counter component. Create reusable `AnimatedCounter` in `packages/ui/src/aceternity/` following established patterns. Use framer-motion's `useInView` and `useSpring` hooks as documented in Context7 research.

### Key Architectural Choices
1. Create `AnimatedCounter` as reusable component (may be used in pricing section too)
2. Use `useMotionValue` + `useSpring` for smooth animation without re-renders
3. Use `useTransform` for number formatting
4. Follow aceternity component pattern (framer-motion, TypeScript, Tailwind)
5. Configuration-driven content in `homepageContentConfig`

### Trade-offs Accepted
- Custom implementation vs @magicui/number-ticker (more control, follows existing patterns)

## Required Credentials
> Environment variables required for this feature to function.

None required - static display only.

## Dependencies

### Blocks
- None within initiative

### Blocked By
- S1936.I1: Design System Foundation (needs animation timing variables, spacing tokens)

### Parallel With
- F1: Logo Cloud Marquee Enhancement
- F3: Testimonials Grid Enhancement

## Files to Create/Modify

### New Files
- `packages/ui/src/aceternity/animated-counter.tsx` - Reusable counter component
- `packages/ui/src/aceternity/statistics-section.tsx` - Section wrapper component
- `apps/web/app/(marketing)/_components/home-statistics-client.tsx` - Client wrapper with dynamic import

### Modified Files
- `packages/ui/package.json` - Export new components
- `apps/web/config/homepage-content.config.ts` - Add statistics configuration
- `apps/web/app/(marketing)/page.tsx` - Add StatisticsSection between logo cloud and features

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create AnimatedCounter component**: Build reusable counter with useInView + useSpring
2. **Create StatisticsSection wrapper**: Grid layout with responsive columns
3. **Add statistics config**: Define 4 statistics in homepageContentConfig
4. **Create client wrapper**: Dynamic import for code splitting
5. **Integrate in homepage**: Add section after logo cloud
6. **Add stagger animation**: Optional delay between counters
7. **Add reduced motion support**: Respect prefers-reduced-motion
8. **Style refinements**: Background, spacing, typography per design system

### Suggested Order
1. AnimatedCounter component (foundation)
2. StatisticsSection wrapper (uses counter)
3. Statistics config (content)
4. Client wrapper (integration)
5. Homepage integration
6. Reduced motion support
7. Stagger animation (polish)
8. Style refinements

## Validation Commands
```bash
# Verify component created
ls packages/ui/src/aceternity/animated-counter.tsx
ls packages/ui/src/aceternity/statistics-section.tsx

# Check exports
grep "animated-counter" packages/ui/package.json

# Verify config
grep "statistics" apps/web/config/homepage-content.config.ts

# Run dev server and scroll test
pnpm dev

# Typecheck
pnpm typecheck

# Check animation performance
# Use Chrome DevTools Performance tab to verify 60fps
```

## Related Files
- Initiative: `../initiative.md`
- Animation Research: `../../research-library/context7-framer-motion-scroll.md` (Section 2: Counter animations)
- SaaS Patterns: `../../research-library/perplexity-saas-homepage-patterns.md` (Section 3: Statistics)
- Existing Pattern: `packages/ui/src/aceternity/logo-marquee.tsx` (component structure reference)
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Content Config: `apps/web/config/homepage-content.config.ts`

## Implementation Reference

From Context7 research, the counter implementation pattern:

```typescript
import { useRef, useEffect } from "react";
import { useInView, useMotionValue, useSpring, useTransform, motion } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", duration = 2 }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const springCount = useSpring(count, { stiffness: 50, damping: 20 });
  const display = useTransform(springCount, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      count.set(value);
    }
  }, [isInView, value, count]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {prefix}{display}{suffix}
    </motion.span>
  );
}
```
