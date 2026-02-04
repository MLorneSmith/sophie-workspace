# Initiative: Content & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1936 |
| **Initiative ID** | S1936.I6 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 6 |

---

## Description
Complete the homepage redesign with the blog/reads section featuring taller cards with image hover zoom and category badges, plus final polish including loading states, error boundaries, reduced motion support, accessibility compliance, and performance optimization.

## Business Value
The blog section drives organic traffic and establishes thought leadership. Polish items ensure the homepage meets the quality bar for top 0.1% design: Lighthouse performance > 90, accessibility > 95, and zero visual regressions.

---

## Scope

### In Scope
- [ ] Blog/Reads section with taller cards
- [ ] Image hover zoom effect
- [ ] Category badges
- [ ] Read time metadata display
- [ ] Loading states for all sections (Suspense fallbacks)
- [ ] Error boundaries for graceful degradation
- [ ] `prefers-reduced-motion` full support
- [ ] WCAG AA compliance verification (4.5:1 contrast)
- [ ] Keyboard navigation testing
- [ ] Lighthouse performance optimization (target > 90)
- [ ] Image optimization (LCP < 2.5s)
- [ ] Final integration testing
- [ ] Dark mode toggle verification

### Out of Scope
- [ ] New blog post creation
- [ ] CMS integration
- [ ] A/B testing setup
- [ ] Analytics event implementation (existing PostHog covers this)

---

## Dependencies

### Blocks
- None (final initiative)

### Blocked By
- S1936.I1: Design System Foundation
- S1936.I2: Hero & Product Preview
- S1936.I3: Trust Elements
- S1936.I4: Value Proposition
- S1936.I5: Conversion

### Parallel With
- None (sequential after all others)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Extends existing BlogPostCard; polish is systematic |
| External dependencies | Low | Blog posts from existing Payload CMS |
| Unknowns | Low | Accessibility patterns well-documented |
| Reuse potential | Medium | Error boundaries and loading states reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Blog Card Enhancement**: Taller cards with hover zoom
2. **Category Badges**: Styled badge component
3. **Loading States**: Section-specific skeleton loaders
4. **Error Boundaries**: Graceful fallbacks
5. **Accessibility Audit**: WCAG compliance fixes
6. **Performance Optimization**: Image optimization, code splitting

### Suggested Order
1. Blog card enhancement (feature complete)
2. Category badges (content enhancement)
3. Loading states (UX polish)
4. Error boundaries (resilience)
5. Accessibility audit (compliance)
6. Performance optimization (final pass)

---

## Validation Commands
```bash
# Lighthouse full audit
npx lighthouse http://localhost:3000 --output=json | jq '.categories | {performance: .performance.score, accessibility: .accessibility.score}'

# Accessibility audit
npx axe-core http://localhost:3000

# Performance metrics
npx lighthouse http://localhost:3000 --only-categories=performance --output=json | jq '.audits | {"lcp": .["largest-contentful-paint"].numericValue, "cls": .["cumulative-layout-shift"].numericValue}'

# Reduced motion test
# Open DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion

# TypeScript check
pnpm typecheck

# Lint check
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- Existing Blog Card: `packages/ui/src/aceternity/blog-post-card.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Globals CSS: `apps/web/styles/globals.css`
- All previous initiative implementations
