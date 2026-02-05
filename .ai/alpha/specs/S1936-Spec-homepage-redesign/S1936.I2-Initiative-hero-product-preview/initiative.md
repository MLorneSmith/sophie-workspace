# Initiative: Hero & Product Preview

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1936 |
| **Initiative ID** | S1936.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 2 |

---

## Description
Redesign the above-the-fold experience with a full-viewport hero section featuring animated text reveal, gradient background orbs, social proof micro-strip, and prominent dual CTAs. The product preview section follows with a browser-frame mockup using perspective tilt, gradient border animation, and glow effects.

## Business Value
The hero section is the first touchpoint for visitors and directly impacts bounce rate and engagement. A compelling above-the-fold experience sets the tone for the entire page and drives initial CTA clicks. Per research, hero must load under 3 seconds and communicate the UVP instantly.

---

## Scope

### In Scope
- [ ] Full-viewport hero section (90vh minimum)
- [ ] Animated headline with gradient text reveal
- [ ] Background gradient orbs with subtle animation
- [ ] Social proof micro-strip (avatar stack + "Join 2,000+ professionals")
- [ ] Dual CTA buttons (Start Writing Free + Watch Demo)
- [ ] Pill badge component ("AI-Powered Presentation Platform")
- [ ] Product preview browser-frame mockup
- [ ] 3D perspective tilt effect on scroll
- [ ] Gradient border animation on product frame
- [ ] Glow effect underneath the product preview
- [ ] Mobile responsive design for both sections
- [ ] `prefers-reduced-motion` support

### Out of Scope
- [ ] Logo cloud section (I3)
- [ ] Video demo implementation
- [ ] Form functionality for email capture
- [ ] Authentication integration

---

## Dependencies

### Blocks
- S1936.I6: Content & Polish (uses hero as foundation)

### Blocked By
- S1936.I1: Design System Foundation (requires color tokens, typography, animation utilities)

### Parallel With
- S1936.I3: Trust Elements
- S1936.I4: Value Proposition
- S1936.I5: Conversion

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | 3D transforms, scroll animations require Framer Motion expertise |
| External dependencies | Low | Reuses existing BackgroundBoxes, ContainerScrollAnimation components |
| Unknowns | Low | Design fully specified; Framer Motion research complete |
| Reuse potential | Medium | Hero pattern reusable, but highly customized |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Hero Section Container**: Full-viewport container with gradient orbs background
2. **Animated Headline**: Text reveal animation with gradient effect
3. **Social Proof Strip**: Avatar stack with user count
4. **Dual CTA Block**: Primary and secondary action buttons
5. **Product Preview Frame**: Browser mockup with perspective tilt
6. **Glow Effect Layer**: Radial gradient glow beneath preview

### Suggested Order
1. Hero container (establishes viewport)
2. Animated headline (core message)
3. Dual CTA block (conversion focus)
4. Social proof strip (trust element)
5. Product preview frame (visual demonstration)
6. Glow effect layer (polish)

---

## Validation Commands
```bash
# Check hero section renders
curl -s http://localhost:3000 | grep -c "hero"

# Performance audit (LCP < 2.5s)
npx lighthouse http://localhost:3000 --only-categories=performance --output=json | jq '.audits["largest-contentful-paint"].numericValue'

# Visual inspection
pnpm dev
```

---

## Related Files
- Spec: `../spec.md`
- Existing Hero: `packages/ui/src/makerkit/marketing/hero.tsx`
- Background Component: `packages/ui/src/aceternity/background-boxes.tsx`
- Container Scroll: `packages/ui/src/aceternity/container-scroll-animation.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Framer Motion Research: `../research-library/context7-framer-motion-scroll.md`
