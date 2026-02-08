# Design System 2026 - Variation Experiment

**Created:** 2026-01-28
**Status:** Ready for Decomposition

## Overview

This experiment tests 4 different design system configurations to determine the optimal visual identity for SlideHeroes.

## Variations

All use brand color `#24a9e0` (cyan). Variations differ by accent, typography, shadow, radius, and spacing.

| ID | Spec | Name | Accent | Typography | Shadow | Radius | Spacing |
|----|------|------|--------|------------|--------|--------|---------|
| V1 | S1879 | Modern Vibrant | Orange #f59e0b | Outfit/Nunito Sans | Elevated | 12px | Spacious |
| V2 | S1880 | Clean Professional | Purple #8b5cf6 | Inter/Inter | Balanced | 8px | Standard |
| V3 | S1881 | Soft Approachable | Coral #f97316 | Manrope/Source Sans Pro | Subtle | 16px | Spacious |
| V4 | S1882 | Bold Geometric | Amber #d97706 | Plus Jakarta Sans/DM Sans | Elevated | 4px | Compact |

## Evaluation Focus

All variations evaluated on:
- **Home page** (`/`) - First impression, marketing appeal
- **Dashboard** (`/home/[account]`) - Application usability

## Next Steps

### 1. Decompose Each Variation

Run initiative decomposition for each (can be done in parallel in separate terminals):

```bash
/alpha:initiative-decompose S1879
/alpha:initiative-decompose S1880
/alpha:initiative-decompose S1881
/alpha:initiative-decompose S1882
```

### 2. Continue Decomposition

For each variation:
```bash
/alpha:feature-decompose S1879.I1
/alpha:task-decompose S1879.I1
```

Repeat for S1880, S1881, S1882.

### 3. Implement (Parallel)

Run orchestrator for each variation (each creates its own branch):
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1879
tsx .ai/alpha/scripts/spec-orchestrator.ts 1880
tsx .ai/alpha/scripts/spec-orchestrator.ts 1881
tsx .ai/alpha/scripts/spec-orchestrator.ts 1882
```

### 4. Evaluate

Each variation will be on its own branch (`alpha/S1879`, `alpha/S1880`, etc.). Compare:
- Screenshots of home page and dashboard
- Rate against criteria defined in base-requirements.md
- Create COMPARISON.md with winner selection

## GitHub Issues

| Variation | Issue | URL |
|-----------|-------|-----|
| V1: Modern Vibrant | #1879 | https://github.com/slideheroes/2025slideheroes/issues/1879 |
| V2: Clean Professional | #1880 | https://github.com/slideheroes/2025slideheroes/issues/1880 |
| V3: Soft Approachable | #1881 | https://github.com/slideheroes/2025slideheroes/issues/1881 |
| V4: Bold Geometric | #1882 | https://github.com/slideheroes/2025slideheroes/issues/1882 |

## Files

| File | Purpose |
|------|---------|
| `variations-config.json` | Machine-readable configuration |
| `base-requirements.md` | Shared requirements |
| `COMPARISON.md` | Post-implementation comparison (create after review) |

## Spec Directories

- `.ai/alpha/specs/S1879-Spec-design-system-v1-modern-vibrant/`
- `.ai/alpha/specs/S1880-Spec-design-system-v2-clean-professional/`
- `.ai/alpha/specs/S1881-Spec-design-system-v3-soft-approachable/`
- `.ai/alpha/specs/S1882-Spec-design-system-v4-bold-geometric/`
