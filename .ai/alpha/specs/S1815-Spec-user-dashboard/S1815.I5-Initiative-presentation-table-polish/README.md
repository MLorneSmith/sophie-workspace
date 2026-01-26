# Feature Overview: Presentation Table & Polish

**Parent Initiative**: S1815.I5
**Parent Spec**: S1815
**Created**: 2026-01-26
**Total Features**: 4
**Estimated Duration**: 12 days sequential / 12 days parallel (sequential initiative)

## Directory Structure

```
S1815.I5-Initiative-presentation-table-polish/
├── initiative.md                             # Initiative document
├── README.md                                 # This file - features overview
├── S1815.I5.F1-Feature-presentation-table-widget/
│   └── feature.md                            # Presentations DataTable with edit links
├── S1815.I5.F2-Feature-empty-states-polish/
│   └── feature.md                            # Consistent empty states across widgets
├── S1815.I5.F3-Feature-accessibility-compliance/
│   └── feature.md                            # WCAG 2.1 AA compliance
└── S1815.I5.F4-Feature-e2e-dashboard-tests/
    └── feature.md                            # Playwright E2E test coverage
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1815.I5.F1 | Presentation Table Widget | 1 | 3 | None (I1 complete) | Draft |
| S1815.I5.F2 | Empty States Polish | 2 | 2 | F1 | Draft |
| S1815.I5.F3 | Accessibility Compliance | 3 | 3 | F1, F2 | Draft |
| S1815.I5.F4 | E2E Dashboard Tests | 4 | 4 | F1, F2, F3 | Draft |

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                   S1815.I5 Feature Dependencies                  │
└─────────────────────────────────────────────────────────────────┘

S1815.I1 (Dashboard Foundation) - PREREQUISITE
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────────────────┐                                       │
│   │                     │                                       │
│   │  F1: Presentation   │                                       │
│   │  Table Widget       │                                       │
│   │  (3 days)           │                                       │
│   │                     │                                       │
│   └─────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│   ┌─────────────────────┐                                       │
│   │                     │                                       │
│   │  F2: Empty States   │                                       │
│   │  Polish             │                                       │
│   │  (2 days)           │                                       │
│   │                     │                                       │
│   └─────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│   ┌─────────────────────┐                                       │
│   │                     │                                       │
│   │  F3: Accessibility  │                                       │
│   │  Compliance         │                                       │
│   │  (3 days)           │                                       │
│   │                     │                                       │
│   └─────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│   ┌─────────────────────┐                                       │
│   │                     │                                       │
│   │  F4: E2E Dashboard  │                                       │
│   │  Tests              │                                       │
│   │  (4 days)           │                                       │
│   │                     │                                       │
│   └─────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Legend:
  ──▶  "blocks" / "depends on"
```

## Parallel Execution Groups

**This initiative is strictly sequential** due to the nature of polish/testing work:

| Group | Features | Days | Notes |
|-------|----------|------|-------|
| Group 0 | F1: Presentation Table | 3 | Root feature, no deps |
| Group 1 | F2: Empty States | 2 | Needs F1 for table empty state |
| Group 2 | F3: Accessibility | 3 | Needs all widgets complete |
| Group 3 | F4: E2E Tests | 4 | Needs all features for test coverage |

**Critical Path**: F1 → F2 → F3 → F4

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 12 days |
| Parallel Duration | 12 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature |

**Note**: This initiative is intentionally sequential. Each feature depends on the previous:
- F2 needs F1's table to standardize empty states
- F3 needs all widgets (F1, F2) to audit accessibility
- F4 needs all features complete to write comprehensive tests

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Presentation Table | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Empty States | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Accessibility | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: E2E Tests | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### Validation Notes
- **F1 (Table)**: Vertical slice from UI → Data → Database. Testable via visual verification and data checks.
- **F2 (Empty States)**: UI-only but spans all 7 widgets. Testable via new user flow.
- **F3 (A11y)**: Spans all widgets + layout. Testable via Lighthouse and manual keyboard testing.
- **F4 (E2E)**: Testing-only feature but provides testable CI validation.

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Presentation Table | Pragmatic | Reuse DataTable, custom columns only |
| F2: Empty States | Minimal | Compose existing EmptyState components |
| F3: Accessibility | Pragmatic | Leverage Radix/shadcn, add skip links |
| F4: E2E Tests | Pragmatic | Follow existing PO pattern, use toPass() |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Presentation Table | DataTable pagination complexity | Use client-side pagination for v1 |
| F2: Empty States | Inconsistent widget APIs | Document content map, apply uniformly |
| F3: Accessibility | Manual testing coverage | Combine Lighthouse + keyboard + screen reader |
| F4: E2E Tests | Test flakiness in CI | Use toPass(), hydration waits, CI timeouts |

## Component Reuse Summary

All features leverage existing components:

| Component | Package | Used By |
|-----------|---------|---------|
| DataTable | @kit/ui/data-table | F1 |
| EmptyState | @kit/ui/empty-state | F1, F2 |
| Button | @kit/ui/button | F1, F2 |
| Badge | @kit/ui/badge | F1 |
| sr-only | Tailwind | F3 |
| focus-visible | Tailwind | F3 |
| Playwright | @playwright/test | F4 |
| toPass() | apps/e2e/utils | F4 |

## Next Steps

1. Run `/alpha:task-decompose S1815.I5.F1` to decompose the first feature (Presentation Table Widget)
2. Begin implementation with F1 after task decomposition
3. Progress sequentially through F2 → F3 → F4
4. Final validation: Lighthouse a11y score 90+, E2E tests passing in CI
