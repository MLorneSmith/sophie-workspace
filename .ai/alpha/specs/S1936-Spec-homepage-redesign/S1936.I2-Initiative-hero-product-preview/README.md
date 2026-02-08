# Feature Overview: Hero & Product Preview

**Parent Initiative**: S1936.I2
**Parent Spec**: S1936
**Created**: 2026-02-04
**Total Features**: 4
**Estimated Duration**: 10 days sequential / 5 days parallel

## Directory Structure

```
S1936.I2-Initiative-hero-product-preview/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1936.I2.F1-Feature-hero-section-foundation/
│   └── feature.md
├── S1936.I2.F2-Feature-animated-headline/
│   └── feature.md
├── S1936.I2.F3-Feature-social-proof-cta/
│   └── feature.md
└── S1936.I2.F4-Feature-product-preview-frame/
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1936.I2.F1 | Hero Section Foundation | 1 | 3 | S1936.I1 (Design System) | Draft |
| S1936.I2.F2 | Animated Headline | 2 | 2 | F1, S1936.I1 | Draft |
| S1936.I2.F3 | Social Proof & CTA | 3 | 2 | F1, S1936.I1 | Draft |
| S1936.I2.F4 | Product Preview Frame | 4 | 3 | F1, S1936.I1 | Draft |

## Dependency Graph

```
S1936.I1 (Design System Foundation) ─────────────────────────────────┐
                                                                      │
                                                                      ▼
                                                    ┌─────────────────────────────┐
                                                    │   S1936.I2.F1               │
                                                    │   Hero Section Foundation   │
                                                    │   (3 days)                  │
                                                    └─────────────────────────────┘
                                                                │
                                ┌───────────────────────────────┼───────────────────────────────┐
                                │                               │                               │
                                ▼                               ▼                               ▼
              ┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
              │   S1936.I2.F2               │ │   S1936.I2.F3               │ │   S1936.I2.F4               │
              │   Animated Headline         │ │   Social Proof & CTA        │ │   Product Preview Frame     │
              │   (2 days)                  │ │   (2 days)                  │ │   (3 days)                  │
              └─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

## Parallel Execution Groups

### Group 0: Foundation (Blocked by S1936.I1)
| Feature | Days | Notes |
|---------|------|-------|
| S1936.I2.F1 | 3 | Hero container, gradient orbs background |

### Group 1: Content Elements (After F1 completes)
| Feature | Days | Notes |
|---------|------|-------|
| S1936.I2.F2 | 2 | Animated headline with gradient text |
| S1936.I2.F3 | 2 | Avatar stack, counter, dual CTAs |
| S1936.I2.F4 | 3 | Browser frame with scroll animation |

**Note**: F2, F3, and F4 can all be developed in parallel after F1 completes.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10 days |
| Parallel Duration | 6 days (F1=3, then max(F2,F3,F4)=3) |
| Time Saved | 4 days (40%) |
| Max Parallelism | 3 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Hero Foundation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Animated Headline | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Social Proof & CTA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Product Preview | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### INVEST-V Validation Details

**F1: Hero Section Foundation**
- **Independent**: Can be deployed alone (shows container with background)
- **Negotiable**: Orb count, colors, animation speed all flexible
- **Valuable**: User sees premium above-fold experience
- **Estimable**: Confident 3 days - straightforward component work
- **Small**: ~5 files, pure UI
- **Testable**: Visual inspection, reduced-motion toggle, Lighthouse LCP
- **Vertical**: UI layer only (appropriate for visual foundation)

**F2: Animated Headline**
- **Independent**: Can deploy with or without animations
- **Negotiable**: Animation timing, stagger delay, gradient colors flexible
- **Valuable**: Core value prop communicated effectively
- **Estimable**: Confident 2 days - known Framer Motion patterns
- **Small**: ~3 files
- **Testable**: Animation timing, reduced-motion, content correctness
- **Vertical**: UI + config layer

**F3: Social Proof & CTA**
- **Independent**: Stand-alone conversion elements
- **Negotiable**: Avatar count, counter target, button text flexible
- **Valuable**: Directly impacts conversion rate
- **Estimable**: Confident 2 days - using MagicUI component
- **Small**: ~4 files
- **Testable**: Button navigation, accessibility, responsive layout
- **Vertical**: UI + routing layer

**F4: Product Preview Frame**
- **Independent**: Can show static or animated
- **Negotiable**: Tilt angle, glow intensity, border style flexible
- **Valuable**: Product visualization drives engagement
- **Estimable**: Confident 3 days - enhancing existing pattern
- **Small**: ~5 files
- **Testable**: Scroll behavior, performance, reduced-motion
- **Vertical**: UI + animation layer

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1 | Pragmatic | Replace BackgroundBoxes with simpler gradient orbs for performance |
| F2 | Pragmatic | Use proven Framer Motion stagger patterns from research |
| F3 | Pragmatic | Leverage MagicUI avatar-circles component |
| F4 | Pragmatic | Enhance existing ContainerScrollAnimation, don't replace |

## Component Strategy

| Feature | New Components | Existing Components | Registry Components |
|---------|----------------|--------------------|--------------------|
| F1 | HeroSectionRedesigned, GradientOrbs | - | - |
| F2 | AnimatedHeadline | GradientText | @magicui/animated-gradient-text (pattern) |
| F3 | SocialProofStrip, HeroCtaBlock | Button | @magicui/avatar-circles |
| F4 | ProductPreviewFrame, BrowserMockup, GlowEffect | ContainerScrollAnimation | @magicui/border-beam |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | Orb animation performance on low-end devices | Use CSS transforms, test with CPU throttling |
| F2 | Animation timing feels off or distracting | A/B test timing, follow research guidelines |
| F3 | Avatar images look unprofessional | Use high-quality placeholder or real user photos |
| F4 | Scroll animation jank on mobile | Disable/reduce animation on mobile, use passive listeners |

## Cross-Initiative Dependencies

This initiative depends on:
- **S1936.I1** (Design System Foundation) - Provides color tokens, typography scale, animation timing utilities

This initiative blocks:
- **S1936.I6** (Content & Polish) - Uses hero as foundation for final refinements

This initiative can run in parallel with:
- **S1936.I3** (Trust Elements)
- **S1936.I4** (Value Proposition)
- **S1936.I5** (Conversion)

## Next Steps

1. Run `/alpha:task-decompose S1936.I2.F1` to decompose the Hero Section Foundation feature
2. After F1 tasks complete, decompose F2, F3, F4 in parallel
3. Begin implementation with Priority 1 / Group 0 features
