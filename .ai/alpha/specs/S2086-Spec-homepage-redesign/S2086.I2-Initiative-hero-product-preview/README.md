# Feature Overview: Hero & Product Preview

**Parent Initiative**: S2086.I2
**Parent Spec**: S2086
**Created**: 2026-02-13
**Total Features**: 2
**Estimated Duration**: 9 days sequential / 5 days parallel

## Directory Structure

```
S2086.I2-Initiative-hero-product-preview/
├── initiative.md                                        # Initiative document
├── README.md                                            # This file - features overview
├── S2086.I2.F1-Feature-hero-section-redesign/
│   └── feature.md                                       # Hero section with letter reveal, gradient orb, dual CTAs, social proof
└── S2086.I2.F2-Feature-product-preview-redesign/
    └── feature.md                                       # Browser-frame product preview with glass card, gradient border, glow
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S2086.I2.F1 | `S2086.I2.F1-Feature-hero-section-redesign/` | 1 | 5 | S2086.I1 | Draft |
| S2086.I2.F2 | `S2086.I2.F2-Feature-product-preview-redesign/` | 2 | 4 | S2086.I1 | Draft |

## Dependency Graph

```
S2086.I1 (Design System Foundation)
    │
    ├──► S2086.I2.F1 (Hero Section Redesign)
    │
    └──► S2086.I2.F2 (Product Preview Redesign)

F1 and F2 are independent — no dependency between them.
```

## Parallel Execution Groups

### Group 0: Both features (start after S2086.I1 completes)
| Feature | Days | Dependencies |
|---------|------|--------------|
| S2086.I2.F1: Hero Section Redesign | 5 | S2086.I1 |
| S2086.I2.F2: Product Preview Redesign | 4 | S2086.I1 |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 9 days |
| Parallel Duration | 5 days |
| Time Saved | 4 days (44%) |
| Max Parallelism | 2 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S2086.I2.F1 Hero Section | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S2086.I2.F2 Product Preview | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S2086.I2.F1 | Pragmatic — New `home-hero-section.tsx` composing existing Pill, CtaButton, GradientText with new letter-reveal and gradient orb sub-components | Current Hero + BackgroundBoxes fundamentally different from redesign; new component is cleaner |
| S2086.I2.F2 | Pragmatic — New `home-product-preview-section.tsx` with `home-browser-frame.tsx` sub-component replacing ContainerScroll | Browser frame with glass card is fundamentally different from 3D scroll effect; browser frame is reusable |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S2086.I2.F1 | Letter-by-letter animation on long headlines could feel slow | Fast stagger delay (0.03s/char), fallback to word-by-word on reduced-motion |
| S2086.I2.F2 | Gradient border animation may cause CLS on initial render | Use CSS-only animation (no JS), define dimensions upfront to prevent layout shift |

## Next Steps

1. Run `/alpha:task-decompose S2086.I2.F1` to decompose the Hero Section Redesign feature
2. Run `/alpha:task-decompose S2086.I2.F2` to decompose the Product Preview Redesign feature
3. Both features can be task-decomposed in parallel
