# Feature Overview: Dashboard Interactive Widgets

**Parent Initiative**: S2045.I3
**Parent Spec**: S2045
**Created**: 2026-02-09
**Total Features**: 4
**Estimated Duration**: 15 days sequential / 5 days parallel

## Directory Structure

```
S2045.I3-Initiative-interactive-widgets/
├── initiative.md                                           # Initiative document
├── README.md                                               # This file - features overview
├── S2045.I3.F1-Feature-presentation-outlines-table/
│   └── feature.md
├── S2045.I3.F2-Feature-coaching-sessions-card/
│   └── feature.md
├── S2045.I3.F3-Feature-quick-actions-panel/
│   └── feature.md
└── S2045.I3.F4-Feature-recent-activity-feed/
    └── feature.md
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S2045.I3.F1 | `S2045.I3.F1-Feature-presentation-outlines-table/` | 1 | 3 | S2045.I1.F1, S2045.I1.F3 | Draft |
| S2045.I3.F2 | `S2045.I3.F2-Feature-coaching-sessions-card/` | 2 | 3 | S2045.I1.F1 | Draft |
| S2045.I3.F3 | `S2045.I3.F3-Feature-quick-actions-panel/` | 3 | 4 | S2045.I1.F1, S2045.I1.F3 | Draft |
| S2045.I3.F4 | `S2045.I3.F4-Feature-recent-activity-feed/` | 4 | 5 | S2045.I1.F1, S2045.I1.F2, S2045.I1.F3 | Draft |

## Dependency Graph

```
S2045.I1.F1 (Page Shell) ──────┬──> S2045.I3.F1 (Presentations Table)
                                ├──> S2045.I3.F2 (Coaching Sessions Card)
S2045.I1.F3 (Data Loader) ─────┤
                                ├──> S2045.I3.F3 (Quick Actions Panel)
S2045.I1.F2 (Activity Events DB)┤
                                └──> S2045.I3.F4 (Activity Feed)

Within I3: All 4 features are independent of each other (full parallelism)
```

## Parallel Execution Groups

### Group 0: All Features (after I1 completes)
All 4 features can run in parallel once their I1 dependencies complete:
- **S2045.I3.F1** - Presentation Outlines Table (3 days)
- **S2045.I3.F2** - Coaching Sessions Card (3 days)
- **S2045.I3.F3** - Quick Actions Panel (4 days)
- **S2045.I3.F4** - Recent Activity Feed (5 days)

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 15 days |
| Parallel Duration | 5 days |
| Time Saved | 10 days (67%) |
| Max Parallelism | 4 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S2045.I3.F1 Presentations Table | Y | Y | Y | Y | Y | Y | Y |
| S2045.I3.F2 Coaching Sessions Card | Y | Y | Y | Y | Y | Y | Y |
| S2045.I3.F3 Quick Actions Panel | Y | Y | Y | Y | Y | Y | Y |
| S2045.I3.F4 Activity Feed | Y | Y | Y | Y | Y | Y | Y |

**All features pass INVEST-V criteria.**

### INVEST-V Details

- **Independent**: All features can be deployed alone (each renders in its own grid slot)
- **Negotiable**: Approach is flexible (e.g., timeline styling, CTA ordering)
- **Valuable**: Each widget provides distinct user value (table access, booking, navigation, progress tracking)
- **Estimable**: 3-5 day range, well-understood patterns
- **Small**: Each touches 3-5 files
- **Testable**: Each has clear acceptance criteria and renders visible UI
- **Vertical**: Each spans UI → Logic → Data layers

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S2045.I3.F1 Presentations Table | Pragmatic | Reuse existing DataTable + Card; TanStack column defs |
| S2045.I3.F2 Coaching Sessions Card | Minimal | Iframe is self-contained; just needs Card wrapper |
| S2045.I3.F3 Quick Actions Panel | Pragmatic | Simple conditional rendering with boolean flags from loader |
| S2045.I3.F4 Activity Feed | Pragmatic | Custom CSS timeline (no library); Tailwind border-left pattern |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S2045.I3.F1 Presentations Table | DataTable empty state may conflict with I4 empty states | Use basic fallback text; I4 will replace with full EmptyState |
| S2045.I3.F2 Coaching Sessions Card | Cal.com iframe may clip in compact 350px height | Fallback to "Book Session" link if embed renders poorly |
| S2045.I3.F3 Quick Actions Panel | Conditional logic depends on 3+ table queries being in loader | Verify loader has all needed queries from I1.F3 |
| S2045.I3.F4 Activity Feed | Depends on activity_events table + triggers from I1.F2 | Hard dependency; cannot start until I1.F2 is complete |

## Next Steps

1. Run `/alpha:task-decompose S2045.I3.F1` to decompose the first feature
2. Begin implementation with all 4 features in parallel after I1 completes
