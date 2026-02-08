# Feature Overview: Coaching Integration

**Parent Initiative**: S1918.I5
**Parent Spec**: S1918
**Created**: 2026-02-03
**Total Features**: 2
**Estimated Duration**: 5 days sequential / 5 days parallel (no parallelism - linear dependency)

## Directory Structure

```
S1918.I5-Initiative-coaching-integration/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1918.I5.F1-Feature-calcom-api-client/
│   └── feature.md                                   # API client feature spec
└── S1918.I5.F2-Feature-coaching-sessions-widget/
    └── feature.md                                   # Widget feature spec
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S1918.I5.F1 | S1918.I5.F1-Feature-calcom-api-client | 1 | 2 | S1918.I1.F1 (dashboard) | Draft |
| S1918.I5.F2 | S1918.I5.F2-Feature-coaching-sessions-widget | 2 | 3 | F1, S1918.I1.F1 | Draft |

## Dependency Graph

```
                    ┌─────────────────────────────────┐
                    │      S1918.I1.F1                │
                    │  (Dashboard Page & Grid)        │
                    └──────────────┬──────────────────┘
                                   │
                                   │ provides grid slot
                                   ▼
                    ┌─────────────────────────────────┐
                    │      S1918.I5.F1                │
                    │   Cal.com API Client            │
                    │   (2 days)                      │
                    └──────────────┬──────────────────┘
                                   │
                                   │ provides booking data
                                   ▼
                    ┌─────────────────────────────────┐
                    │      S1918.I5.F2                │
                    │   Coaching Sessions Widget      │
                    │   (3 days)                      │
                    └──────────────┬──────────────────┘
                                   │
                                   │ blocks
                                   ▼
                    ┌─────────────────────────────────┐
                    │      S1918.I6                   │
                    │   Polish & Accessibility        │
                    └─────────────────────────────────┘
```

## Parallel Execution Groups

**Group 0**: Features with NO dependencies (within this initiative)
- None (F1 depends on S1918.I1.F1 from Foundation initiative)

**Group 1**: Features dependent on external initiatives
- S1918.I5.F1: Cal.com API Client (blocked by S1918.I1.F1)

**Group 2**: Features dependent on F1
- S1918.I5.F2: Coaching Sessions Widget (blocked by F1)

**Parallelism Note**: This initiative has a linear dependency chain within itself, but can run in parallel with:
- S1918.I2: Data Layer (independent)
- S1918.I3: Progress Widgets (independent)
- S1918.I4: Activity & Task Widgets (independent)

All four initiatives (I2, I3, I4, I5) can proceed in parallel once I1 provides the dashboard foundation.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 5 days |
| Parallel Duration | 5 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature (linear within initiative) |

**Note**: While this initiative cannot be parallelized internally, it CAN run in parallel with I2, I3, and I4 initiatives since they all depend on I1 but not on each other.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1918.I5.F1 Cal.com API Client | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S1918.I5.F2 Coaching Sessions Widget | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Validation Details

**S1918.I5.F1 - Cal.com API Client**
- **I**ndependent: Can deploy API client alone (unused but testable)
- **N**egotiable: Could use different HTTP client or caching approach
- **V**aluable: Enables all coaching session features
- **E**stimable: 2 days - clear scope (single API endpoint)
- **S**mall: ~3 files (schema, client, env docs)
- **T**estable: Can verify with mock API responses
- **V**ertical: Logic + Data layers (no UI)

**S1918.I5.F2 - Coaching Sessions Widget**
- **I**ndependent: Widget can render independently in dashboard
- **N**egotiable: UI layout, number of sessions shown negotiable
- **V**aluable: User sees upcoming sessions on dashboard
- **E**stimable: 3 days - clear UI patterns from research
- **S**mall: ~3 files (widget, optional session card, dashboard integration)
- **T**estable: Visual verification, E2E test for render
- **V**ertical: UI + Logic layers (consumes API client)

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1918.I5.F1 | Pragmatic | Simple server-side fetch with Zod validation, no complex caching |
| S1918.I5.F2 | Pragmatic | Server Component with async fetch, reuses existing Card patterns |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1918.I5.F1 | Cal.com API rate limits or downtime | Graceful error handling; fallback to "check booking page" message |
| S1918.I5.F2 | No sessions to display initially | Well-designed empty state with clear booking CTA |

## Environment Variables Required

| Variable | Feature | Type | Description |
|----------|---------|------|-------------|
| `CALCOM_API_KEY` | F1 | Server | Cal.com V2 API key (prefixed with `cal_`) |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | F2 | Public | Coach username for booking URL |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | F2 | Public | Event type slug (e.g., `60min`) |

## Next Steps

1. Run `/alpha:task-decompose S1918.I5.F1` to decompose the Cal.com API Client feature
2. Begin implementation with F1 once S1918.I1.F1 (Dashboard Foundation) is complete
3. F2 can begin immediately after F1 completes
