# Initiative: Value Proposition

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1936 |
| **Initiative ID** | S1936.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 3-4 |
| **Priority** | 4 |

---

## Description
Implement the core content sections that communicate SlideHeroes' value proposition: an enhanced sticky scroll features section with numbered overlines and progress indicators, a new "How It Works" 4-step horizontal stepper with animated connecting line, and a features bento grid with asymmetric cards and spotlight hover effects.

## Business Value
These sections answer the critical visitor questions: "What does it do?" and "How does it work?" The sticky scroll keeps visitors engaged while scrolling, the stepper simplifies the user journey, and the bento grid differentiates SlideHeroes from competitors. Per research, interactive demonstrations yield 20-40% conversion lifts.

---

## Scope

### In Scope
- [ ] Sticky scroll features section with enhanced styling
- [ ] Numbered overlines (01/03, 02/03, 03/03)
- [ ] Progress indicator for scroll position
- [ ] Parallax images in sticky scroll
- [ ] "How It Works" section with 4 steps (Assemble, Outline, Storyboard, Produce)
- [ ] Horizontal stepper with icon containers
- [ ] Animated connecting line that draws on scroll
- [ ] Features bento grid with asymmetric layout
- [ ] Spotlight hover effects on feature cards
- [ ] Mobile responsive (stepper becomes vertical on mobile)
- [ ] `prefers-reduced-motion` support

### Out of Scope
- [ ] Interactive product demos
- [ ] Video walkthroughs
- [ ] Detailed feature documentation
- [ ] Feature comparison tables (handled in I5)

---

## Dependencies

### Blocks
- S1936.I6: Content & Polish

### Blocked By
- S1936.I1: Design System Foundation (requires color tokens, animation utilities)

### Parallel With
- S1936.I2: Hero & Product Preview
- S1936.I3: Trust Elements
- S1936.I5: Conversion

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | Bento grid requires careful CSS grid work; stepper animation is custom |
| External dependencies | Low | Extends existing StickyScrollReveal component |
| Unknowns | Medium | Bento grid asymmetric layout needs prototyping |
| Reuse potential | High | Stepper and bento grid components reusable for features pages |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Sticky Scroll Enhancement**: Progress indicator, numbered overlines
2. **Stepper Container**: Horizontal timeline with responsive vertical fallback
3. **Stepper Step Component**: Icon container, title, description
4. **Animated Connecting Line**: SVG path animation on scroll
5. **Bento Grid Layout**: CSS grid with span configurations
6. **Spotlight Feature Card**: Card with mouse-following gradient

### Suggested Order
1. Sticky scroll enhancement (extends existing)
2. Bento grid layout (foundation for features)
3. Spotlight feature card (grid content)
4. Stepper container (layout first)
5. Stepper step component (content)
6. Animated connecting line (polish)

---

## Validation Commands
```bash
# Check sticky scroll renders
curl -s http://localhost:3000 | grep -c "sticky"

# Check stepper renders
curl -s http://localhost:3000 | grep -c "how-it-works"

# Check bento grid renders
curl -s http://localhost:3000 | grep -c "bento"

# Visual inspection on mobile
pnpm dev
# Open DevTools > Responsive mode
```

---

## Related Files
- Spec: `../spec.md`
- Existing Sticky Scroll: `packages/ui/src/aceternity/sticky-scroll-reveal.tsx`
- Card Spotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Content Config: `apps/web/config/homepage-content.config.ts`
- Framer Motion Research: `../research-library/context7-framer-motion-scroll.md`
