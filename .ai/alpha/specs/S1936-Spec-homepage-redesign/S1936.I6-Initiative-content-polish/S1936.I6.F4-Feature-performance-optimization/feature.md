# Feature: Performance Optimization

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I6 |
| **Feature ID** | S1936.I6.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Optimize homepage performance to achieve Lighthouse score > 90, LCP < 2.5s, and CLS < 0.1. Focus on image optimization, code splitting, lazy loading of below-fold sections, and dark mode toggle verification.

## User Story
**As a** first-time visitor
**I want to** experience fast page load with no visual jank
**So that** I get a premium first impression and don't abandon the page

## Acceptance Criteria

### Must Have
- [ ] Lighthouse performance score > 90
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] FCP (First Contentful Paint) < 1.8s
- [ ] Hero images use `priority` prop for LCP optimization
- [ ] Below-fold sections use dynamic imports with loading states
- [ ] Dark mode toggle works correctly (existing next-themes)

### Nice to Have
- [ ] WebP/AVIF format usage verification
- [ ] Preconnect hints for image CDN
- [ ] Resource hints for critical assets

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | OptimizedImage, dynamic imports | Existing patterns |
| **Logic** | Next.js Image, dynamic() | Existing |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Optimize existing patterns, verify configuration
**Rationale**: Most performance infrastructure exists (Next.js Image, Lighthouse CI). Focus on verification and targeted fixes rather than rebuilding.

### Key Architectural Choices
1. **Priority images for LCP** - Add `priority={true}` to hero and above-fold images
2. **Dynamic imports for heavy sections** - Ensure testimonials, pricing, blog sections use dynamic()
3. **Responsive images** - Add `sizes` prop to images for proper sizing
4. **Preconnect hints** - Add `<link rel="preconnect">` for image CDN in layout

### Trade-offs Accepted
- Dynamic imports add slight complexity but improve initial load
- Priority images increase initial bundle but improve LCP

## Required Credentials
None required.

## Dependencies

### Blocks
- None (final feature)

### Blocked By
- F1: Blog Section (images to optimize)
- F2: Loading States (skeletons prevent CLS)
- F3: Accessibility (accessibility score is part of overall Lighthouse)

### Parallel With
- None (sequential after F1-F3)

## Files to Create/Modify

### New Files
- None expected

### Modified Files
- `apps/web/app/(marketing)/layout.tsx` - Add preconnect hints for image CDN
- `apps/web/app/(marketing)/page.tsx` - Add `priority` to hero images, verify dynamic imports
- `apps/web/app/(marketing)/_components/home-optimized-image.tsx` - Add `sizes` prop support
- `packages/ui/src/aceternity/blog-post-card.tsx` - Optimize image loading

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Run baseline Lighthouse audit**: Capture current scores before optimization
2. **Add priority to hero images**: Set `priority={true}` on above-fold images
3. **Add sizes prop to images**: Configure responsive image sizes
4. **Add preconnect hints**: Add link tags for image CDN in layout head
5. **Verify dynamic imports**: Ensure below-fold sections use dynamic()
6. **Optimize blog post images**: Add priority/sizes to blog card images
7. **Test dark mode toggle**: Verify existing toggle works correctly
8. **Run final Lighthouse audit**: Verify all targets met
9. **Fix any remaining issues**: Address specific Lighthouse recommendations
10. **Document performance baseline**: Record final scores for monitoring

### Suggested Order
1. Run baseline audit (measure before optimizing)
2. Add priority to hero images (biggest LCP impact)
3. Add preconnect hints
4. Verify/add dynamic imports
5. Add sizes props to images
6. Test dark mode
7. Run final audit
8. Fix remaining issues

## Validation Commands
```bash
# Full Lighthouse audit
npx lighthouse http://localhost:3000 --output=json | jq '.categories | {performance: .performance.score, accessibility: .accessibility.score}'

# Performance metrics only
npx lighthouse http://localhost:3000 --only-categories=performance --output=json | jq '.audits | {"lcp": .["largest-contentful-paint"].numericValue, "cls": .["cumulative-layout-shift"].numericValue, "fcp": .["first-contentful-paint"].numericValue}'

# Bundle analysis
ANALYZE=true pnpm --filter web build

# TypeScript check
pnpm typecheck

# Test dark mode
# Open DevTools > Application > Local Storage > Clear theme
# Toggle theme using site toggle button
```

## Related Files
- Initiative: `../initiative.md`
- Lighthouse config: `lighthouserc.json`
- Next.js config: `apps/web/next.config.mjs`
- Optimized image component: `apps/web/app/(marketing)/_components/home-optimized-image.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Marketing layout: `apps/web/app/(marketing)/layout.tsx`
