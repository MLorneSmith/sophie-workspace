# Feature: Responsive Layout Adaptations

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I6 |
| **Feature ID** | S2086.I6.F1 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 1 |

## Description
Implement responsive layouts for all 12 homepage sections across mobile (375px), tablet (768px), and desktop (1280px) breakpoints. Includes complex layout transformations (sticky scroll → stacked, horizontal stepper → vertical, bento → uniform grid) and touch-friendly 44px minimum tap targets.

## User Story
**As a** mobile or tablet visitor
**I want to** see a properly adapted homepage layout on my device
**So that** I can read content, navigate sections, and interact with CTAs without horizontal scrolling or broken layouts

## Acceptance Criteria

### Must Have
- [ ] Mobile (375px): All 12 sections render in single-column stacked layout
- [ ] Mobile: Sticky scroll features section converts to vertically stacked cards
- [ ] Mobile: How It Works horizontal stepper converts to vertical stepper
- [ ] Mobile: Bento features grid converts to uniform single-column grid
- [ ] Mobile: Comparison cards stack vertically
- [ ] Mobile: Statistics show 2x2 grid (not 4 across)
- [ ] Mobile: Pricing cards stack vertically with "Most Popular" on top
- [ ] Mobile: Testimonials display as single-column
- [ ] Mobile: Blog cards display as single-column
- [ ] Tablet (768px): 2-column grids for testimonials, blog, features
- [ ] Tablet: How It Works keeps horizontal stepper
- [ ] Tablet: Pricing shows 3 cards in row (or 2+1 if too narrow)
- [ ] Desktop (1280px): Full layout verified with all animations
- [ ] All CTAs and interactive elements have minimum 44px touch targets
- [ ] No horizontal scrolling at any breakpoint
- [ ] Text remains readable without zooming at all breakpoints

### Nice to Have
- [ ] Fluid typography with `clamp()` for smooth scaling between breakpoints
- [ ] Container queries for component-level responsive behavior
- [ ] Reduced gradient orb size on mobile for performance

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 12 section components (home-hero, home-product-preview, home-logo-cloud, home-statistics, home-sticky-scroll, home-how-it-works, home-features-grid, home-comparison, home-testimonials, home-pricing, home-blog, home-final-cta) | Existing (modify) |
| **Logic** | Responsive breakpoint detection for layout switches | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Tailwind-first responsive with CSS-only breakpoints where possible, JavaScript breakpoint detection only for complex layout transformations (sticky → stacked).

**Rationale**: Tailwind's mobile-first responsive utilities (`sm:`, `md:`, `lg:`) handle 90% of cases without JavaScript. Complex transformations like sticky scroll → stacked require conditional rendering via `useMediaQuery` or similar. This avoids layout shift from hydration mismatches.

### Key Architectural Choices
1. **Mobile-first CSS**: All styles default to mobile, progressively enhanced with `md:` and `lg:` prefixes
2. **Conditional rendering for complex transforms**: Use `useMediaQuery` hook for sticky scroll → stacked and bento → uniform grid transformations that require fundamentally different DOM structures
3. **Shared breakpoint constants**: Define breakpoints once and reference across components for consistency

### Trade-offs Accepted
- Some sections may need two DOM structures (mobile vs desktop) for complex transformations, increasing bundle size slightly
- Container queries would be more elegant but have lower browser support than media queries

## Required Credentials
> None required - no external services needed for responsive layout work.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides glass card, stat card components)
- S2086.I2: Hero & Product Preview (provides hero and preview sections)
- S2086.I3: Trust & Credibility Sections (provides logo cloud and statistics)
- S2086.I4: Feature Showcase Sections (provides sticky scroll, how it works, bento grid)
- S2086.I5: Social Proof & Conversion (provides comparison, testimonials, pricing, blog, final CTA)

### Parallel With
- F2: Accessibility Compliance
- F3: Performance Optimization & Audit

## Files to Create/Modify

### New Files
- None expected (responsive handled within existing component files)

### Modified Files
- `apps/web/app/(marketing)/_components/home-hero-*.tsx` - Mobile stacked layout, fluid typography
- `apps/web/app/(marketing)/_components/home-product-preview-*.tsx` - Smaller frame on mobile
- `apps/web/app/(marketing)/_components/home-logo-cloud-*.tsx` - Touch-friendly, adjusted speed
- `apps/web/app/(marketing)/_components/home-statistics-*.tsx` - 2x2 grid on mobile, 4-across on desktop
- `apps/web/app/(marketing)/_components/home-sticky-scroll-*.tsx` - Stacked layout on mobile
- `apps/web/app/(marketing)/_components/home-how-it-works-*.tsx` - Vertical stepper on mobile
- `apps/web/app/(marketing)/_components/home-features-grid-*.tsx` - Uniform grid on mobile, 2-col tablet
- `apps/web/app/(marketing)/_components/home-comparison-*.tsx` - Stacked cards on mobile
- `apps/web/app/(marketing)/_components/home-testimonials-*.tsx` - Single column mobile, 2-col tablet
- `apps/web/app/(marketing)/_components/home-pricing-*.tsx` - Stacked cards on mobile
- `apps/web/app/(marketing)/_components/home-blog-*.tsx` - Single column mobile, 2-col tablet
- `apps/web/app/(marketing)/_components/home-final-cta-*.tsx` - Stacked layout, smaller orb
- `apps/web/styles/globals.css` - Responsive utility classes if needed

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Mobile hero + product preview**: Adapt hero (stacked CTA, fluid text) and product preview (smaller frame) for 375px
2. **Mobile trust sections**: Statistics 2x2 grid, logo cloud touch adjustments
3. **Mobile sticky scroll → stacked**: Most complex - convert 40/60 sticky layout to stacked cards
4. **Mobile stepper + bento grid**: Vertical stepper, uniform grid
5. **Mobile lower sections**: Comparison stacked, testimonials single-col, pricing stacked, blog single-col, final CTA
6. **Tablet adaptations**: 2-column grids, adapted spacing across all sections
7. **Touch target audit**: Verify all interactive elements meet 44px minimum
8. **Cross-breakpoint verification**: Test all 3 breakpoints end-to-end

### Suggested Order
Mobile-first (highest impact), then tablet, then desktop verification, then touch targets.

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Lint
pnpm lint

# Verify responsive classes exist
grep -r 'sm:\|md:\|lg:' apps/web/app/\(marketing\)/_components/ | wc -l

# Check for hardcoded widths that should be responsive
grep -rn 'w-\[.*px\]' apps/web/app/\(marketing\)/_components/home-*.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Spec responsive behavior: `../../spec.md` (Section 5: Responsive Behavior table)
- Research: `../../research-library/perplexity-saas-homepage-best-practices.md` (Section 8: Mobile-First)
