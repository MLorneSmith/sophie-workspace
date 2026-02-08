# Feature: Loading States & Error Boundaries

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I6 |
| **Feature ID** | S1936.I6.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Implement comprehensive loading states with Suspense fallbacks and error boundaries for all homepage sections. Create section-specific skeleton loaders that match content structure and add graceful error fallbacks for resilient user experience.

## User Story
**As a** visitor on a slow connection
**I want to** see meaningful loading indicators that match the content structure
**So that** I understand the page is loading and don't experience layout shifts

## Acceptance Criteria

### Must Have
- [ ] Section-specific skeleton loaders for all 12 homepage sections
- [ ] Skeletons match final content dimensions (prevent CLS)
- [ ] Error boundary wrapping for each major section
- [ ] Graceful fallback UI when sections fail to load
- [ ] Loading states use `animate-pulse` for consistency
- [ ] Dark mode compatible skeleton colors (`bg-muted`)

### Nice to Have
- [ ] Staggered skeleton reveal for grid sections
- [ ] Retry button in error fallback UI

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SectionSkeleton, SectionErrorBoundary | New |
| **Logic** | Suspense boundaries, ErrorBoundary class | Existing patterns |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Centralized skeleton components with section-specific variants
**Rationale**: Create a `HomepageSectionSkeleton` component that accepts `variant` prop (hero, stats, features, testimonials, blog, etc.) to generate appropriate skeleton structure.

### Key Architectural Choices
1. **Variant-based skeleton component** - Single component with switch statement for different section layouts
2. **Reuse existing ErrorBoundary** - Import from `@kit/ui/error-boundary`, customize fallback per section
3. **Server component error handling** - Use try/catch with fallback data (testimonials pattern)

### Trade-offs Accepted
- Section-specific skeletons add code but prevent CLS
- Error boundaries at section level (not page level) add complexity but improve UX

## Required Credentials
None required.

## Dependencies

### Blocks
- F4: Performance (validates loading performance metrics)

### Blocked By
- F1: Blog Section (must have final layout dimensions for skeleton)
- S1936.I1-I5: All previous initiatives (sections must be complete)

### Parallel With
- F3: Accessibility (can work in parallel)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/homepage-section-skeleton.tsx` - Variant-based skeleton component
- `apps/web/app/(marketing)/_components/homepage-section-error-boundary.tsx` - Section error boundary wrapper

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Wrap sections in Suspense and ErrorBoundary
- `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx` - Ensure error fallback exists

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create HomepageSectionSkeleton component**: Variant-based skeleton with hero, stats, features, testimonials, blog, pricing, cta variants
2. **Create hero skeleton**: Full-viewport skeleton with headline, subtitle, CTA placeholders
3. **Create stats skeleton**: 4-column grid of stat card skeletons
4. **Create features skeleton**: Bento grid layout skeleton
5. **Create testimonials skeleton**: Masonry grid skeleton
6. **Create blog skeleton**: 3-column card grid skeleton
7. **Create SectionErrorBoundary wrapper**: ErrorBoundary with section-aware fallback
8. **Wrap hero section**: Add Suspense + ErrorBoundary
9. **Wrap stats section**: Add Suspense + ErrorBoundary
10. **Wrap features section**: Add Suspense + ErrorBoundary
11. **Wrap testimonials section**: Verify existing error handling, add boundary
12. **Wrap blog section**: Add Suspense + ErrorBoundary
13. **Wrap pricing section**: Add Suspense + ErrorBoundary
14. **Test loading states**: Use React DevTools Suspense debugging

### Suggested Order
1. Create skeleton component with all variants
2. Create error boundary wrapper
3. Wrap each section progressively (top to bottom)
4. Test with slow network throttling
5. Verify no CLS in Lighthouse

## Validation Commands
```bash
# TypeScript check
pnpm typecheck

# Lint check
pnpm lint

# CLS check via Lighthouse
npx lighthouse http://localhost:3000 --only-categories=performance --output=json | jq '.audits["cumulative-layout-shift"].numericValue'

# Visual check with network throttling
# Open DevTools > Network > Slow 3G
pnpm dev
```

## Related Files
- Initiative: `../initiative.md`
- Existing skeleton: `packages/ui/src/shadcn/skeleton.tsx`
- Existing ErrorBoundary: `packages/ui/src/makerkit/error-boundary.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Testimonials server component: `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx`
