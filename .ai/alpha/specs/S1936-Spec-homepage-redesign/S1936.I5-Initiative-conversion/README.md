# Feature Overview: Conversion

**Parent Initiative**: S1936.I5
**Parent Spec**: S1936
**Created**: 2026-02-04
**Total Features**: 3
**Estimated Duration**: 12 days sequential / 12 days parallel

## Directory Structure

```
S1936.I5-Initiative-conversion/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1936.I5.F1-Feature-comparison-section/
│   └── feature.md
├── S1936.I5.F2-Feature-pricing-glass-cards/
│   └── feature.md
└── S1936.I5.F3-Feature-final-cta-section/
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1936.I5.F1 | Comparison Section | 1 | 4 | S1936.I1 | Draft |
| S1936.I5.F2 | Pricing Glass Cards | 2 | 5 | S1936.I1, F1 | Draft |
| S1936.I5.F3 | Final CTA Section | 3 | 3 | S1936.I1, F2 | Draft |

## Dependency Graph

```
                    ┌─────────────────────┐
                    │     S1936.I1        │
                    │  Design System      │
                    │    Foundation       │
                    └──────────┬──────────┘
                               │
                               │ (provides design tokens)
                               │
                    ┌──────────▼──────────┐
                    │    S1936.I5.F1      │
                    │ Comparison Section  │
                    │     (4 days)        │
                    └──────────┬──────────┘
                               │
                               │ (visual flow)
                               │
                    ┌──────────▼──────────┐
                    │    S1936.I5.F2      │
                    │ Pricing Glass Cards │
                    │     (5 days)        │
                    └──────────┬──────────┘
                               │
                               │ (visual flow)
                               │
                    ┌──────────▼──────────┐
                    │    S1936.I5.F3      │
                    │  Final CTA Section  │
                    │     (3 days)        │
                    └─────────────────────┘
```

## Parallel Execution Groups

**Group 0** (Start after S1936.I1 completes):
- S1936.I5.F1: Comparison Section (4 days)

**Group 1** (Start after F1 completes):
- S1936.I5.F2: Pricing Glass Cards (5 days)

**Group 2** (Start after F2 completes):
- S1936.I5.F3: Final CTA Section (3 days)

> **Note**: This initiative has a linear dependency chain - features build upon each other visually and contextually. No parallelization possible within this initiative.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 12 days |
| Parallel Duration | 12 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature |

> **Cross-Initiative Parallelism**: S1936.I5 can execute in parallel with S1936.I2 (Hero), S1936.I3 (Trust Elements), and S1936.I4 (Value Proposition) once S1936.I1 (Design System) completes. Total spec parallelism is high despite internal serialization.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Comparison Section | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F2: Pricing Glass Cards | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F3: Final CTA Section | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Validation Notes

- **F1 (Comparison)**: Independent section, 4 files touched, clear E2E test (render check)
- **F2 (Pricing)**: Wraps existing PricingTable, ~7 files touched, testable toggle behavior
- **F3 (Final CTA)**: Standalone section, 4 files touched, clear visual acceptance

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Comparison Section | Pragmatic | Reuse Framer Motion patterns, create ComparisonCard component |
| F2: Pricing Glass Cards | Pragmatic | Wrap existing PricingTable, CSS glass effects, avoid forking |
| F3: Final CTA Section | Pragmatic | CSS gradients for orb (not canvas), Framer Motion for animation |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Comparison Section | Animation jank on mobile | Test on throttled CPU, use will-change |
| F2: Pricing Glass Cards | backdrop-filter support | Graceful degradation with solid background fallback |
| F3: Final CTA Section | Gradient orb performance | Use CSS, not canvas; respect reduced motion |

## Component Strategy

### Shadcn/UI Components to Use
- `Card` - Base for comparison and pricing cards
- `Button` - CTAs throughout all features
- `Badge` - "Popular" tag on recommended tier

### Existing Aceternity Components
- `CardSpotlight` - Reference pattern for spotlight hover effect
- Animation patterns from Framer Motion research

### New Components to Create
- `ComparisonCard` - Variant-based (without/with) comparison card
- `HomePricingSection` - Enhanced pricing wrapper with glass styling
- `GradientOrb` - Animated CSS gradient orb
- `TrustBadges` - Reusable trust indicator row

## Content Integration

All features add content to `apps/web/config/homepage-content.config.ts`:

```typescript
// F1: Comparison content
comparison: {
  title: "Why SlideHeroes?",
  without: [...], // Pain points
  with: [...],    // Benefits
}

// F3: Final CTA content
finalCta: {
  headline: "Ready to transform your presentations?",
  subheadline: "...",
  primaryCta: { label: "Start Writing Free", href: "/auth/sign-up" },
  secondaryCta: { label: "Book a Demo", href: "/demo" },
  trustBadges: [...]
}
```

## Next Steps

1. Run `/alpha:task-decompose S1936.I5.F1` to decompose the Comparison Section feature
2. Begin implementation with F1 after S1936.I1 (Design System Foundation) completes
3. Continue with F2, then F3 in sequence
