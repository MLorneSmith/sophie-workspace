# Feature Overview: Value Proposition

**Parent Initiative**: S1936.I4
**Parent Spec**: S1936
**Created**: 2026-02-04
**Total Features**: 4
**Estimated Duration**: 15 days sequential / 8 days parallel

## Directory Structure

```
S1936.I4-Initiative-value-proposition/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1936.I4.F1-Feature-sticky-scroll-enhancement/
│   └── feature.md
├── S1936.I4.F2-Feature-how-it-works-stepper/
│   └── feature.md
├── S1936.I4.F3-Feature-bento-grid-layout/
│   └── feature.md
└── S1936.I4.F4-Feature-spotlight-feature-cards/
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1936.I4.F1 | Sticky Scroll Enhancement | 1 | 3 | S1936.I1 (Design System) | Draft |
| S1936.I4.F2 | How It Works Stepper | 2 | 5 | S1936.I1 (Design System) | Draft |
| S1936.I4.F3 | Bento Grid Layout | 3 | 4 | S1936.I1 (Design System) | Draft |
| S1936.I4.F4 | Spotlight Feature Cards | 4 | 3 | F3 (Bento Grid) | Draft |

## Dependency Graph

```
S1936.I1 (Design System Foundation)
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
  F1: Sticky        F2: How It         F3: Bento
  Scroll (3d)       Works (5d)         Grid (4d)
    │                  │                  │
    │                  │                  ▼
    │                  │              F4: Spotlight
    │                  │              Cards (3d)
    │                  │                  │
    └──────────────────┴──────────────────┘
                       │
                       ▼
              S1936.I6 (Content & Polish)
```

## Parallel Execution Groups

### Group 0 (Start Immediately after S1936.I1)
| Feature | Days | Notes |
|---------|------|-------|
| F1: Sticky Scroll Enhancement | 3 | No internal dependencies |
| F2: How It Works Stepper | 5 | No internal dependencies |
| F3: Bento Grid Layout | 4 | No internal dependencies |

### Group 1 (After F3 Completes)
| Feature | Days | Notes |
|---------|------|-------|
| F4: Spotlight Feature Cards | 3 | Blocked by F3 |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 15 days |
| Parallel Duration | 8 days |
| Time Saved | 7 days (47%) |
| Max Parallelism | 3 features |

**Critical Path**: S1936.I1 → F2 (5d) OR (F3 (4d) → F4 (3d)) = **7-8 days**

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Sticky Scroll | ✅ | ✅ | ✅ | ✅ (3d) | ✅ (4 files) | ✅ | ✅ |
| F2: How It Works | ✅ | ✅ | ✅ | ✅ (5d) | ✅ (6 files) | ✅ | ✅ |
| F3: Bento Grid | ✅ | ✅ | ✅ | ✅ (4d) | ✅ (5 files) | ✅ | ✅ |
| F4: Spotlight Cards | ✅ | ✅ | ✅ | ✅ (3d) | ✅ (4 files) | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1 | Extend existing | StickyScrollReveal already tracks scroll state |
| F2 | New component | Form stepper differs from process visualization stepper |
| F3 | Adapt Aceternity | @aceternity/bento-grid provides proven pattern |
| F4 | Extract hook | Reusable spotlight logic for any component |

## Component Strategy

| Feature | Components | Source |
|---------|------------|--------|
| F1 | StickyScrollReveal | Existing Aceternity (modify) |
| F2 | ProcessStepper, StepperStep, AnimatedConnectingLine | New Makerkit components |
| F3 | BentoGrid, BentoGridItem | @aceternity/bento-grid (install) |
| F4 | useSpotlightEffect hook | New hook extracted from CardSpotlight |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | Breaking existing sticky scroll behavior | Backward-compatible optional props |
| F2 | SVG line positioning on responsive | Use relative positioning, test breakpoints |
| F3 | Aceternity component style mismatch | Customize after install |
| F4 | Performance with multiple spotlights | Test 60fps, use requestAnimationFrame |

## Next Steps

1. Run `/alpha:task-decompose S1936.I4.F1` to decompose the first feature
2. Begin implementation with Priority 1 / Group 0 features (F1, F2, F3 in parallel)
3. F4 starts after F3 completes (estimated day 4-5)
