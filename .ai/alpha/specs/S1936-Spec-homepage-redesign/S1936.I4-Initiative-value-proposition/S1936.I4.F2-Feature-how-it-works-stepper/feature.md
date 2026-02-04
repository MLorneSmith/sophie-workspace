# Feature: How It Works Stepper

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I4 |
| **Feature ID** | S1936.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 2 |

## Description
Create a new "How It Works" section with a 4-step horizontal stepper showing the SlideHeroes workflow: Assemble → Outline → Storyboard → Produce. Features icon containers, animated connecting line that draws on scroll, and responsive mobile layout that converts to vertical.

## User Story
**As a** first-time visitor
**I want to** understand the SlideHeroes workflow at a glance
**So that** I can visualize how the product will help me create presentations

## Acceptance Criteria

### Must Have
- [ ] 4-step horizontal stepper renders (Assemble, Outline, Storyboard, Produce)
- [ ] Each step has icon container (circular background with Lucide icon)
- [ ] Each step has title and description text
- [ ] Steps are connected by a horizontal line on desktop
- [ ] Line animates (draws) from left to right when section scrolls into view
- [ ] Mobile responsive: stepper converts to vertical layout below md breakpoint
- [ ] `prefers-reduced-motion` support: line appears instantly without animation

### Nice to Have
- [ ] Staggered fade-in for step content after line draws
- [ ] Icon subtle bounce animation on step activation
- [ ] Progress along line tracks scroll position through section

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ProcessStepper component | New |
| **UI** | StepperStep sub-component | New |
| **UI** | AnimatedConnectingLine sub-component | New |
| **Logic** | useInView scroll trigger | New (Framer Motion) |
| **Data** | Steps content configuration | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic (new component following existing patterns)
**Rationale**: While an existing stepper component exists at `packages/ui/src/makerkit/stepper.tsx`, it's designed for form navigation, not process visualization. A new marketing-focused ProcessStepper component provides:
1. Scroll-triggered animations (not state-driven)
2. Animated SVG connecting line (not static dividers)
3. Mobile-responsive horizontal-to-vertical layout
4. Marketing-appropriate styling (larger icons, more prominent text)

### Key Architectural Choices
1. Create new `ProcessStepper` component in `packages/ui/src/makerkit/` alongside existing stepper
2. Use Framer Motion `useInView` hook for scroll detection (per research docs)
3. SVG `line` element with `pathLength` animation for connecting line
4. Tailwind `flex-col lg:flex-row` for responsive layout flip
5. Content defined in `homepage-content.config.ts` for consistency

### Trade-offs Accepted
- New component rather than extending existing stepper (different use case warrants separation)
- SVG line requires careful positioning calculations for responsive

## Required Credentials
> None required - this is a frontend-only component

## Dependencies

### Blocks
- None directly (section is self-contained)

### Blocked By
- S1936.I1: Design System Foundation (color tokens for icons, animation utilities)

### Parallel With
- F1: Sticky Scroll Enhancement (both are independent sections)
- F3, F4: Bento grid and cards (independent sections)

## Files to Create/Modify

### New Files
- `packages/ui/src/makerkit/process-stepper.tsx` - Main stepper container component
- `packages/ui/src/makerkit/process-stepper-step.tsx` - Individual step sub-component
- `packages/ui/src/makerkit/animated-connecting-line.tsx` - SVG line with path animation

### Modified Files
- `packages/ui/package.json` - Add exports for new components
- `apps/web/config/homepage-content.config.ts` - Add howItWorksSteps content
- `apps/web/app/(marketing)/page.tsx` - Import and render ProcessStepper section

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create StepperStep component**: Icon container, title, description with styling
2. **Create AnimatedConnectingLine**: SVG line with Framer Motion pathLength animation
3. **Create ProcessStepper container**: Layout component handling responsive flex direction
4. **Add scroll trigger logic**: useInView hook triggering line animation
5. **Configure step content**: Add 4 steps to homepage-content.config.ts
6. **Integrate into homepage**: Add section to marketing page with appropriate spacing
7. **Add reduced motion support**: Instant line display when prefers-reduced-motion
8. **Mobile responsive testing**: Verify vertical layout on small screens

### Suggested Order
1. StepperStep component (isolated, testable)
2. AnimatedConnectingLine (SVG animation foundation)
3. ProcessStepper container (combines sub-components)
4. Content configuration
5. Homepage integration
6. Responsive & accessibility polish

## Validation Commands
```bash
# TypeScript compilation
pnpm typecheck

# Check component exports
grep -c "ProcessStepper" packages/ui/package.json

# Section renders
curl -s http://localhost:3000 | grep -c "how-it-works"

# Step content present
curl -s http://localhost:3000 | grep -c "Assemble"
curl -s http://localhost:3000 | grep -c "Outline"
curl -s http://localhost:3000 | grep -c "Storyboard"
curl -s http://localhost:3000 | grep -c "Produce"

# Visual inspection
pnpm dev
# Check: Line draws on scroll, vertical on mobile
```

## Related Files
- Initiative: `../initiative.md`
- Existing stepper: `packages/ui/src/makerkit/stepper.tsx` (reference for patterns)
- Framer Motion research: `../../research-library/context7-framer-motion-scroll.md`
- SaaS patterns research: `../../research-library/perplexity-saas-homepage-patterns.md`
