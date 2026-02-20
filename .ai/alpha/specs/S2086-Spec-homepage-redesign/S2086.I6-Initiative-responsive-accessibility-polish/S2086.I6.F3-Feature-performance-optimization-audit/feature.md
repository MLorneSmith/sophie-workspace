# Feature: Performance Optimization & Audit

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I6 |
| **Feature ID** | S2086.I6.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Optimize homepage performance through LazyMotion code-splitting verification, Suspense boundaries around below-fold sections, lazy loading of below-fold components, Next.js Image responsive sizes, and comprehensive Lighthouse audits targeting performance >= 90 and accessibility >= 95. Includes cross-browser testing across Chrome, Firefox, Safari, and Edge.

## User Story
**As a** visitor on any device or browser
**I want to** experience fast page loads and smooth interactions
**So that** I can engage with the homepage content without waiting or experiencing janky animations

## Acceptance Criteria

### Must Have
- [ ] LazyMotion code-splitting verified: `domAnimation` or `domMax` loaded as separate chunk
- [ ] Suspense boundaries wrap all below-fold sections with skeleton fallbacks
- [ ] Below-fold sections use `dynamic()` imports with `ssr: false` where appropriate
- [ ] All Next.js Images have responsive `sizes` attribute matching breakpoints
- [ ] All images serve AVIF/WEBP with blur placeholders
- [ ] Hero image has `priority` flag for LCP optimization
- [ ] Lighthouse performance score >= 90
- [ ] Lighthouse accessibility score >= 95
- [ ] LCP < 2.5s
- [ ] CLS < 0.1 (no layout shifts from lazy-loaded animations)
- [ ] INP < 200ms
- [ ] No console errors in any browser
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge all render correctly
- [ ] `backdrop-filter: blur()` works in Safari (or has fallback)

### Nice to Have
- [ ] Lighthouse performance score >= 95
- [ ] Lighthouse Best Practices score >= 90
- [ ] Bundle analysis showing Motion chunk is code-split
- [ ] Web Vitals monitoring integration (for post-launch tracking)
- [ ] `contain: paint` or `content-visibility: auto` on below-fold sections

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Page structure, Suspense boundaries, loading skeletons | Existing (modify) |
| **Logic** | Dynamic imports, lazy loading strategy | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Progressive loading with Suspense boundaries and dynamic imports for below-fold sections, combined with image optimization and Lighthouse-driven iterative fixes.

**Rationale**: The homepage has 12 sections but only 2-3 are visible above the fold (hero, possibly product preview). Loading all section JavaScript upfront hurts LCP and TTI. Wrapping below-fold sections in Suspense with dynamic imports defers their JavaScript until needed, while skeleton fallbacks prevent CLS.

### Key Architectural Choices
1. **Above-fold eager, below-fold lazy**: Hero and product preview load eagerly; sections 3-12 wrapped in Suspense with dynamic imports
2. **LazyMotion verification**: Confirm I1's MotionProvider correctly code-splits the Motion bundle (domAnimation ~15KB vs full ~34KB)
3. **Responsive image sizes**: Use `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px"` pattern matching actual layout
4. **Safari fallback for backdrop-filter**: Feature detection with CSS `@supports` providing solid background fallback

### Trade-offs Accepted
- Dynamic imports add a brief delay when sections first enter viewport (mitigated by skeleton fallbacks)
- `ssr: false` on some sections means no server-rendered HTML for those sections (acceptable for below-fold marketing content)

## Required Credentials
> None required - no external services needed for performance optimization.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides MotionProvider with LazyMotion)
- S2086.I2: Hero & Product Preview (provides above-fold sections to optimize)
- S2086.I3: Trust & Credibility Sections (provides logo cloud, statistics sections)
- S2086.I4: Feature Showcase Sections (provides sticky scroll, how it works, bento grid)
- S2086.I5: Social Proof & Conversion (provides comparison, testimonials, pricing, blog, final CTA)

### Parallel With
- F1: Responsive Layout Adaptations
- F2: Accessibility Compliance

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/section-skeleton.tsx` - Reusable skeleton fallback for Suspense boundaries (if not already created in I1-I5)

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Add Suspense boundaries, dynamic imports for below-fold sections
- `apps/web/app/(marketing)/_components/home-hero-*.tsx` - Verify hero image has `priority`, responsive `sizes`
- `apps/web/app/(marketing)/_components/home-product-preview-*.tsx` - Responsive image `sizes`, blur placeholder
- `apps/web/app/(marketing)/_components/home-statistics-*.tsx` - Verify animation doesn't cause CLS
- `apps/web/app/(marketing)/_components/home-features-grid-*.tsx` - Verify spotlight effect doesn't spike INP
- `apps/web/app/(marketing)/_components/home-testimonials-*.tsx` - Verify masonry grid doesn't cause CLS
- `apps/web/app/(marketing)/_components/home-pricing-*.tsx` - Verify Suspense boundary on PricingTable
- `apps/web/styles/globals.css` - `@supports` fallback for `backdrop-filter`, `content-visibility` rules

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Suspense boundaries + dynamic imports**: Wrap below-fold sections (3-12) in Suspense with dynamic imports in `page.tsx`
2. **Section skeletons**: Create skeleton loading states for each section type (or reusable generic skeleton)
3. **Image optimization audit**: Add responsive `sizes` to all images, verify `priority` on hero, check blur placeholders
4. **LazyMotion verification**: Analyze bundle to confirm Motion code-splitting, verify domAnimation chunk size
5. **Safari backdrop-filter fallback**: Add `@supports` CSS with solid background fallback for glass cards
6. **Lighthouse performance audit**: Run audit, fix issues iteratively until score >= 90
7. **Lighthouse accessibility audit**: Run audit, fix issues until score >= 95
8. **Cross-browser testing**: Verify all sections in Chrome, Firefox, Safari, Edge; fix any browser-specific issues

### Suggested Order
Suspense/dynamic imports first (biggest perf impact), then images, then LazyMotion verification, then Safari fallback, then Lighthouse audit cycles, finally cross-browser testing.

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Lint
pnpm lint

# Build and check bundle
pnpm --filter web build

# Lighthouse audit (requires running dev server)
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility --output=json

# Check Suspense usage
grep -r 'Suspense' apps/web/app/\(marketing\)/page.tsx

# Check dynamic imports
grep -r 'dynamic(' apps/web/app/\(marketing\)/

# Check image optimization
grep -r 'sizes=' apps/web/app/\(marketing\)/_components/home-*.tsx

# Check LazyMotion
grep -r 'LazyMotion' apps/web/app/\(marketing\)/
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-saas-homepage-best-practices.md` (Section 4: Performance)
- Research: `../../research-library/context7-framer-motion.md` (Section 6: Performance Best Practices)
- Existing pattern: `apps/web/app/(marketing)/_components/home-container-scroll-client.tsx` (dynamic import reference)
- Existing pattern: `apps/web/app/(marketing)/_components/home-optimized-image.tsx` (image optimization reference)
