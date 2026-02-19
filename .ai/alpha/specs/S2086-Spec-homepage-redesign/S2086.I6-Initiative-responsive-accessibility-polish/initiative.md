# Initiative: Responsive & Accessibility Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2086 |
| **Initiative ID** | S2086.I6 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 6 |

---

## Description
Final quality pass across all 12 homepage sections for responsive behavior (375px mobile, 768px tablet, 1280px desktop), `prefers-reduced-motion` accessibility support, WCAG AA contrast verification, performance optimization (LazyMotion code-splitting, Suspense boundaries, lazy loading below-fold sections), and cross-browser testing.

## Business Value
Ensures the redesigned homepage reaches its full audience regardless of device or accessibility needs. Mobile traffic typically accounts for 50-60% of SaaS marketing page visits. Performance directly impacts Core Web Vitals and SEO rankings. Accessibility compliance is both a legal requirement and a signal of premium quality.

---

## Scope

### In Scope
- [ ] Mobile layout (375px): Single column, stacked sections, reduced animations
- [ ] Tablet layout (768px): 2-column grids, adapted spacing
- [ ] Desktop layout (1280px): Full layout with all animations verified
- [ ] Sticky scroll → stacked layout on mobile
- [ ] How It Works: Horizontal stepper → vertical stepper on mobile
- [ ] Bento grid: Uniform grid on mobile, 2-col on tablet
- [ ] Touch-friendly 44px minimum tap targets
- [ ] `prefers-reduced-motion`: Disable all scroll animations, show static states
- [ ] WCAG AA contrast verification for all text on #0a0a0f backgrounds
- [ ] Focus indicators with 3:1+ contrast (bright outline on dark)
- [ ] Decorative animations marked with `aria-hidden="true"`
- [ ] LazyMotion code-splitting verification (domAnimation bundle)
- [ ] Suspense boundaries around below-fold sections
- [ ] Next.js Image optimization (AVIF/WEBP, responsive sizes, blur placeholders)
- [ ] Lighthouse performance audit (target >= 90)
- [ ] Lighthouse accessibility audit (target >= 95)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Out of Scope
- [ ] New section implementations (all done in I2-I5)
- [ ] Content changes
- [ ] A/B testing infrastructure
- [ ] Server-side performance optimization (ISR, caching)

---

## Dependencies

### Blocks
- None (final initiative)

### Blocked By
- S2086.I1: Design System Foundation
- S2086.I2: Hero & Product Preview
- S2086.I3: Trust & Credibility Sections
- S2086.I4: Feature Showcase Sections
- S2086.I5: Social Proof & Conversion Sections

### Parallel With
- None (must wait for all section implementations)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | 12 sections across 3 breakpoints. Sticky scroll → stacked is trickiest. Glass morphism performance on mobile Safari needs testing. |
| External dependencies | Low | All tools available (Lighthouse, DevTools, browser testing). |
| Unknowns | Medium | backdrop-filter: blur() performance on iOS Safari and older Android varies. May need fallback for low-powered devices. |
| Reuse potential | Low | Cross-cutting polish work, not reusable components. |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Mobile Responsive Layouts**: All 12 sections at 375px breakpoint, stacked layouts, touch targets
2. **Tablet Responsive Layouts**: All 12 sections at 768px breakpoint, 2-column grids
3. **Accessibility Compliance**: prefers-reduced-motion, WCAG contrast, focus indicators, ARIA
4. **Performance Optimization**: LazyMotion, Suspense, lazy loading, image optimization, Lighthouse audit

### Suggested Order
1. Mobile responsive first (most impactful, catches major layout issues)
2. Tablet responsive second (bridging layouts)
3. Accessibility compliance third (can test alongside responsive work)
4. Performance optimization last (final audit and tuning)

---

## Validation Commands
```bash
# Lighthouse performance audit
npx lighthouse http://localhost:3000 --only-categories=performance --output=json

# Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json

# Check reduced motion support
grep -r 'prefers-reduced-motion\|useReducedMotion\|reducedMotion' apps/web/app/\(marketing\)/

# Verify responsive classes
grep -r 'sm:\|md:\|lg:' apps/web/app/\(marketing\)/_components/ | wc -l

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

---

## Related Files
- Spec: `../spec.md` (Section 5: Responsive Behavior table)
- Research: `../research-library/perplexity-saas-homepage-best-practices.md` (Sections 4, 5, 8)
- All section components: `apps/web/app/(marketing)/_components/home-*.tsx`
- Global styles: `apps/web/styles/globals.css`
- Theme styles: `apps/web/styles/theme.css`
- Features: `./<feature-#>-<slug>/` (created in next phase)
