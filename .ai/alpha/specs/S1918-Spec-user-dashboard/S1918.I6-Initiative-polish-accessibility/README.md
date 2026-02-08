# Feature Overview: Polish & Accessibility

**Parent Initiative**: S1918.I6
**Parent Spec**: S1918
**Created**: 2026-02-03
**Total Features**: 4
**Estimated Duration**: 13 days sequential / 4 days parallel

## Directory Structure

```
S1918.I6-Initiative-polish-accessibility/
├── initiative.md                              # Initiative document
├── README.md                                  # This file - features overview
├── S1918.I6.F1-Feature-loading-skeletons/     # Priority 1 - Skeleton components
│   └── feature.md
├── S1918.I6.F2-Feature-error-boundaries/      # Priority 2 - Error handling UI
│   └── feature.md
├── S1918.I6.F3-Feature-accessibility-compliance/ # Priority 3 - A11y audit & fixes
│   └── feature.md
└── S1918.I6.F4-Feature-e2e-test-suite/        # Priority 4 - Playwright tests
    └── feature.md
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S1918.I6.F1 | `S1918.I6.F1-Feature-loading-skeletons/` | 1 | 3 | I3.F1, I3.F2, I4.F1-F4, I5.F2 | Draft |
| S1918.I6.F2 | `S1918.I6.F2-Feature-error-boundaries/` | 2 | 3 | I3.F1, I3.F2, I4.F1-F4, I5.F2 | Draft |
| S1918.I6.F3 | `S1918.I6.F3-Feature-accessibility-compliance/` | 3 | 4 | I1.F1, I3.F1-F2, I4.F1-F4, I5.F2 | Draft |
| S1918.I6.F4 | `S1918.I6.F4-Feature-e2e-test-suite/` | 4 | 3 | F1, F2, F3, All I1-I5 features | Draft |

## Dependency Graph

```
                    ┌────────────────────────────────────┐
                    │         WIDGETS FROM I1-I5         │
                    │ (I3.F1, I3.F2, I4.F1-F4, I5.F2)   │
                    └──────────────┬─────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           v                       v                       v
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ F1: Loading      │   │ F2: Error        │   │ F3: Accessibility│
│ Skeletons        │   │ Boundaries       │   │ Compliance       │
│ (3 days)         │   │ (3 days)         │   │ (4 days)         │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                v
                    ┌──────────────────────┐
                    │ F4: E2E Test Suite   │
                    │ (3 days)             │
                    └──────────────────────┘
```

**Key Insight**: F1, F2, and F3 can all run in parallel since they operate on different aspects of the same widgets. F4 depends on all three for complete test coverage.

## Parallel Execution Groups

### Group 0: Widget Dependencies (External)
- S1918.I3.F1: Course Progress Radial widget
- S1918.I3.F2: Skills Spider Diagram widget
- S1918.I4.F1: Quick Actions Panel
- S1918.I4.F2: Kanban Summary widget
- S1918.I4.F3: Presentations Table widget
- S1918.I4.F4: Activity Feed widget
- S1918.I5.F2: Coaching Sessions widget

### Group 1: Polish Features (Parallel)
| Feature | Can Start | Estimated Duration |
|---------|-----------|-------------------|
| F1: Loading Skeletons | After Group 0 | 3 days |
| F2: Error Boundaries | After Group 0 | 3 days |
| F3: Accessibility Compliance | After Group 0 | 4 days |

**Group 1 Duration**: 4 days (constrained by F3)

### Group 2: Testing (Sequential)
| Feature | Can Start | Estimated Duration |
|---------|-----------|-------------------|
| F4: E2E Test Suite | After Group 1 | 3 days |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 13 days |
| Parallel Duration | 7 days (4 days Group 1 + 3 days Group 2) |
| Time Saved | 6 days (46%) |
| Max Parallelism | 3 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Loading Skeletons | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Error Boundaries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Accessibility Compliance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: E2E Test Suite | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### INVEST-V Details

**F1: Loading Skeletons**
- Independent: Can deploy alone (just shows skeletons longer if widgets slow)
- Negotiable: Could simplify to fewer skeleton variants
- Valuable: Users see loading feedback immediately
- Estimable: 3 days confident (7 simple components)
- Small: 9 new files, no complex logic
- Testable: Visual verification + no layout shift
- Vertical: UI layer only (appropriate for polish)

**F2: Error Boundaries**
- Independent: Can deploy alone (errors show friendly UI instead of crash)
- Negotiable: Retry mechanism can be simplified
- Valuable: Prevents entire dashboard crash
- Estimable: 3 days confident (pattern exists in codebase)
- Small: 2 new files + wrapper integration
- Testable: Throw error, verify boundary catches
- Vertical: UI + logic layers

**F3: Accessibility Compliance**
- Independent: A11y fixes don't break functionality
- Negotiable: Scope can be adjusted based on audit
- Valuable: Legal compliance + broader user reach
- Estimable: 4 days (audit-driven, may find more issues)
- Small: Mostly attribute additions, 2 new files
- Testable: Lighthouse audit + keyboard navigation
- Vertical: UI + logic (reduced motion hook)

**F4: E2E Test Suite**
- Independent: Tests don't affect production behavior
- Negotiable: Test coverage can be adjusted
- Valuable: Confidence for future deployments
- Estimable: 3 days (page object + test scenarios)
- Small: 3 new files, standard Playwright patterns
- Testable: Tests test themselves (meta!)
- Vertical: Testing layer spanning all components

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Loading Skeletons | Dedicated components per widget | Accurate layout representation |
| F2: Error Boundaries | Single reusable boundary | Consistent error handling |
| F3: Accessibility | Audit-driven fixes | Prioritize actual violations |
| F4: E2E Tests | Page Object Model | Maintainable test code |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Loading Skeletons | Skeleton/widget layout mismatch | Verify against actual widgets |
| F2: Error Boundaries | Retry not working with all data sources | Test with each widget's fetch |
| F3: Accessibility | Scope creep from audit findings | Time-box fixes, log deferred items |
| F4: E2E Tests | Test flakiness with real data | Use route interception for states |

## Next Steps

1. Run `/alpha:task-decompose S1918.I6.F1` to decompose Loading Skeletons feature
2. Continue with F2, F3 after F1 tasks are decomposed
3. F4 tasks can be decomposed in parallel but should execute after F1-F3
4. Update this overview as features are decomposed and implemented
