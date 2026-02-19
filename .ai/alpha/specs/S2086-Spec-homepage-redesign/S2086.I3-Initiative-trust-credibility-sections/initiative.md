# Initiative: Trust & Credibility Sections

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2086 |
| **Initiative ID** | S2086.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 3 |

---

## Description
Redesign the Logo Cloud section with continuous marquee, grayscale logos with hover-to-full-opacity reveal, and gradient edge fades. Implement the new Statistics section with 4 animated stat blocks featuring count-up animation on viewport entry, accent-colored numbers, and staggered fade-in.

## Business Value
Trust signals immediately following the hero are critical for conversion. Customer logos build instant credibility (90%+ of top SaaS use this pattern), and quantitative metrics (2,000+ professionals, 50,000+ presentations) provide concrete evidence of product adoption. Research shows social proof near the top of page drives up to 62% conversion lift.

---

## Scope

### In Scope
- [ ] Logo Cloud: Continuous marquee with `react-fast-marquee`
- [ ] Logo Cloud: Grayscale logos with hover → full opacity transition
- [ ] Logo Cloud: Gradient edge fades on marquee container
- [ ] Logo Cloud: "Trusted by professionals at" heading
- [ ] Statistics Section (NEW): 4 stat blocks in responsive grid
- [ ] Statistics: Count-up animation using `animate(0, target)` on viewport entry
- [ ] Statistics: Accent-colored (#24a9e0) numbers with suffix ("+", "/5", "%")
- [ ] Statistics: Staggered fade-in with whileInView variants
- [ ] Statistics: Label text beneath each number
- [ ] Update homepage content config with statistics data

### Out of Scope
- [ ] Dynamic statistics from database (hardcoded placeholder values)
- [ ] Logo animation beyond hover opacity (no 3D transforms)
- [ ] Mobile responsive adjustments (done in I6)
- [ ] New customer logo acquisition (use existing grayscale logos)

---

## Dependencies

### Blocks
- S2086.I6: Responsive & Accessibility Polish

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, AnimateOnScroll, useCountUp hook, stat card component)

### Parallel With
- S2086.I2: Hero & Product Preview
- S2086.I4: Feature Showcase Sections
- S2086.I5: Social Proof & Conversion Sections

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | LogoMarquee component exists. Statistics is straightforward count-up animation with useInView. |
| External dependencies | Low | react-fast-marquee already installed. Existing greyscale logos in public/images/logos/. |
| Unknowns | Low | Count-up animation pattern fully documented in Context7 research. |
| Reuse potential | High | LogoCloudMarquee (Aceternity) exists and can be restyled. useCountUp hook from I1. |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Logo Cloud Redesign**: Continuous marquee with grayscale/hover styling, gradient edge fades
2. **Statistics Section**: 4 animated stat blocks with count-up, accent colors, stagger reveal

### Suggested Order
1. Logo Cloud first (simpler, restyling existing component)
2. Statistics second (new section, uses useCountUp from I1)

---

## Validation Commands
```bash
# Verify logo cloud renders
ls apps/web/app/\(marketing\)/_components/home-logo-cloud-*.tsx

# Verify statistics section exists
ls apps/web/app/\(marketing\)/_components/home-statistics-*.tsx

# Verify grayscale logos exist
ls public/images/logos/greyscale/

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- Current logo cloud: `apps/web/app/(marketing)/_components/home-logo-cloud-client.tsx`
- Existing LogoMarquee: `packages/ui/src/aceternity/logo-marquee.tsx`
- Grayscale logos: `public/images/logos/greyscale/`
- Content config: `apps/web/config/homepage-content.config.ts`
- Features: `./<feature-#>-<slug>/` (created in next phase)
