# Initiative: Hero & Product Preview

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2086 |
| **Initiative ID** | S2086.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description
Redesign the above-the-fold Hero section with letter-by-letter text reveal animation, gradient orb background, pill badge, dual CTAs (Start Writing Free + Watch Demo), and a social proof micro-strip. Redesign the Product Preview section with a static screenshot in a browser-style glass card frame with gradient border animation and glow effect beneath.

## Business Value
The hero and product preview are the first two things visitors see. These sections directly impact bounce rate and first-impression quality. A polished above-the-fold experience is the highest-impact change for conversion optimization, as 53% of users abandon unclear pages within seconds.

---

## Scope

### In Scope
- [ ] Hero section: Full-viewport with gradient orb background
- [ ] Letter-by-letter text reveal animation for headline
- [ ] Gradient text effect on key word ("faster")
- [ ] Pill badge component ("AI-Powered Presentation Platform")
- [ ] Dual CTA buttons (primary: Start Writing Free, secondary: Watch Demo)
- [ ] Social proof micro-strip (avatar stack + "Join 2,000+ professionals")
- [ ] Product Preview: Browser-style frame with glass card styling
- [ ] Static screenshot with Next.js Image (AVIF/WEBP, blur placeholder)
- [ ] Gradient border animation on product frame
- [ ] Glow effect beneath product frame
- [ ] Update homepage content config for hero section

### Out of Scope
- [ ] Video or animated product preview (static screenshot only)
- [ ] Header/footer changes (SiteHeader/SiteFooter remain as-is)
- [ ] Mobile responsive adjustments (done in I6)
- [ ] A/B testing infrastructure

---

## Dependencies

### Blocks
- S2086.I6: Responsive & Accessibility Polish

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, MotionProvider, AnimateOnScroll, glass card)

### Parallel With
- S2086.I3: Trust & Credibility Sections
- S2086.I4: Feature Showcase Sections
- S2086.I5: Social Proof & Conversion Sections

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | Letter-by-letter animation with stagger, gradient orb parallax, social proof strip. Current hero is 35 lines - new version 100+. |
| External dependencies | Low | Uses Framer Motion (installed), existing Pill/Hero components can be extended. |
| Unknowns | Low | Animation patterns well-documented in research. Product screenshot placeholder exists. |
| Reuse potential | Medium | Existing Hero, Pill, CtaButton, GradientText components provide starting point. |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Hero Section Redesign**: Full-viewport hero with gradient orb, text reveal, dual CTAs, social proof strip
2. **Product Preview Redesign**: Browser-style frame, glass card, gradient border animation, glow effect

### Suggested Order
1. Hero section first (higher visual impact, establishes above-fold presence)
2. Product preview second (complements hero, uses shared glass card from I1)

---

## Validation Commands
```bash
# Verify hero component exists
ls apps/web/app/\(marketing\)/_components/home-hero-*.tsx

# Verify product preview component exists
ls apps/web/app/\(marketing\)/_components/home-product-preview-*.tsx

# Visual check (dev server)
# Navigate to http://localhost:3000 and verify hero + product preview render

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- Current homepage: `apps/web/app/(marketing)/page.tsx`
- Current hero integration: `apps/web/app/(marketing)/page.tsx` (Hero component usage)
- Current container scroll: `apps/web/app/(marketing)/_components/home-container-scroll-client.tsx`
- Existing Hero: `packages/ui/src/makerkit/marketing/hero.tsx`
- Existing Pill: `packages/ui/src/makerkit/marketing/pill.tsx`
- Existing CtaButton: `packages/ui/src/makerkit/marketing/cta-button.tsx`
- Existing GradientText: `packages/ui/src/makerkit/marketing/gradient-text.tsx`
- Product screenshot: `public/images/video-hero-preview.avif`
- Content config: `apps/web/config/homepage-content.config.ts`
- Features: `./<feature-#>-<slug>/` (created in next phase)
