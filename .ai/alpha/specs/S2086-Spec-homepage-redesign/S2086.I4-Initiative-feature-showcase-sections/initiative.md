# Initiative: Feature Showcase Sections

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2086 |
| **Initiative ID** | S2086.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 3 |
| **Priority** | 4 |

---

## Description
Redesign the Sticky Scroll Features section with a two-column layout (40/60 split), numbered overlines, vertical progress indicator, and device-framed images. Implement the new How It Works 4-step horizontal stepper with connecting line animation. Redesign the Features Grid as a bento layout with 2 large + 4 standard glass/spotlight cards with cursor-following glow.

## Business Value
These three sections form the core of the product's value communication. The sticky scroll showcases the three main offerings (AI Canvas, Training, Coaching), the How It Works stepper demystifies the user workflow, and the bento grid highlights differentiating features. Together they answer "What does this product do?" and "How does it work?" — the two most critical questions for mid-funnel visitors.

---

## Scope

### In Scope
- [ ] Sticky Scroll: Two-column layout (40% text / 60% image)
- [ ] Sticky Scroll: Numbered overlines (01 / 03, 02 / 03, 03 / 03)
- [ ] Sticky Scroll: Vertical progress indicator synced to scroll position
- [ ] Sticky Scroll: Device-framed images on the right column
- [ ] Sticky Scroll: Glass card styling with dark theme
- [ ] How It Works (NEW): 4-step horizontal stepper
- [ ] How It Works: Steps - Assemble → Outline → Storyboard → Produce
- [ ] How It Works: Animated connecting line between steps
- [ ] How It Works: Icon + title + description per step
- [ ] How It Works: Staggered step reveal on scroll
- [ ] Features Grid: Bento layout (2 large + 4 standard cards)
- [ ] Features Grid: Glass card + spotlight card hybrid styling
- [ ] Features Grid: Cursor-following radial glow effect
- [ ] Features Grid: 6 feature cards with icons, titles, descriptions
- [ ] Update homepage content config for How It Works section

### Out of Scope
- [ ] New product screenshots for sticky scroll (use existing or placeholder)
- [ ] Interactive demos within feature cards
- [ ] Mobile layout adaptations (done in I6)
- [ ] Animated feature card illustrations

---

## Dependencies

### Blocks
- S2086.I6: Responsive & Accessibility Polish

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, glass card, spotlight card, AnimateOnScroll)

### Parallel With
- S2086.I2: Hero & Product Preview
- S2086.I3: Trust & Credibility Sections
- S2086.I5: Social Proof & Conversion Sections

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | Bento grid with asymmetric layout + cursor-following glow is complex. Sticky scroll with progress bar needs useScroll + useTransform. How It Works stepper with animated line is moderately complex. |
| External dependencies | Low | All dependencies already installed. Existing StickyScrollReveal and CardSpotlight provide starting points. |
| Unknowns | Medium | Bento grid breakpoint behavior needs careful testing. Cursor glow performance on many cards needs validation. |
| Reuse potential | High | StickyScrollReveal (Aceternity) can be extended. CardSpotlight provides cursor-tracking pattern. |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Sticky Scroll Features Redesign**: Two-column layout with progress indicator, numbered overlines, device frames
2. **How It Works Section**: 4-step horizontal stepper with animated connecting line
3. **Features Grid (Bento)**: Asymmetric grid with glass/spotlight cards and cursor glow

### Suggested Order
1. Sticky Scroll first (extends existing component, establishes scroll-linked animation patterns)
2. How It Works second (new but self-contained, uses animation infrastructure from I1)
3. Features Grid last (most complex, needs glass + spotlight cards from I1)

---

## Validation Commands
```bash
# Verify sticky scroll component
ls apps/web/app/\(marketing\)/_components/home-sticky-scroll-*.tsx

# Verify how it works component
ls apps/web/app/\(marketing\)/_components/home-how-it-works-*.tsx

# Verify features grid component
ls apps/web/app/\(marketing\)/_components/home-features-grid-*.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- Current sticky scroll: `apps/web/app/(marketing)/_components/home-sticky-scroll-client.tsx`
- Existing StickyScrollReveal: `packages/ui/src/aceternity/sticky-scroll-reveal.tsx`
- Existing CardSpotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
- Features: `./<feature-#>-<slug>/` (created in next phase)
