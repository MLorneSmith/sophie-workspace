# Feature Overview: Coaching Integration

**Parent Initiative**: S1823.I4
**Parent Spec**: S1823
**Created**: 2026-01-26
**Total Features**: 3
**Estimated Duration**: 10 days sequential / 7 days parallel

## Directory Structure

```
S1823.I4-Initiative-coaching-integration/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1823.I4.F1-Feature-calcom-foundation/
│   └── feature.md                                   # Cal.com package, types, env config
├── S1823.I4.F2-Feature-coaching-widget/
│   └── feature.md                                   # Server component widget with loader
└── S1823.I4.F3-Feature-booking-modal/
    └── feature.md                                   # Client component for booking modal
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1823.I4.F1 | Cal.com Foundation | 1 | 3 | S1823.I1.F1 | Draft |
| S1823.I4.F2 | Coaching Sessions Widget | 2 | 4 | F1, S1823.I1.F2, S1823.I1.F3 | Draft |
| S1823.I4.F3 | Booking Modal Integration | 3 | 3 | F1, F2 | Draft |

## Dependency Graph

```
                    ┌─────────────────────────┐
                    │    S1823.I1.F1          │
                    │  Dashboard Types        │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    S1823.I4.F1          │
                    │  Cal.com Foundation     │
                    │  (Priority 1 - 3 days)  │
                    └───────────┬─────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               │
    ┌───────────────┐   ┌───────────────┐      │
    │ S1823.I1.F2   │   │ S1823.I1.F3   │      │
    │ Page Shell    │   │ Grid Layout   │      │
    └───────┬───────┘   └───────┬───────┘      │
            │                   │               │
            └─────────┬─────────┘               │
                      │                         │
                      ▼                         │
          ┌─────────────────────────┐          │
          │    S1823.I4.F2          │◄─────────┘
          │  Coaching Widget        │
          │  (Priority 2 - 4 days)  │
          └───────────┬─────────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │    S1823.I4.F3          │
          │  Booking Modal          │
          │  (Priority 3 - 3 days)  │
          └─────────────────────────┘
```

## Cross-Initiative Dependencies

This initiative has feature-level dependencies on I1 (Dashboard Foundation):

| This Feature | Depends On | Reason |
|--------------|------------|--------|
| S1823.I4.F1 | S1823.I1.F1 | Needs base dashboard TypeScript types to extend |
| S1823.I4.F2 | S1823.I1.F2 | Needs dashboard page shell to render widget |
| S1823.I4.F2 | S1823.I1.F3 | Needs responsive grid layout for widget placement |

**Note**: Dependencies are specified at feature-level (not initiative-level) to enable maximum parallelism. F1 can start immediately after I1.F1 completes, without waiting for all of I1.

## Parallel Execution Groups

### Group 0 (Start after I1.F1)
- **S1823.I4.F1** - Cal.com Foundation (3 days)

### Group 1 (Start after F1 + I1.F2 + I1.F3)
- **S1823.I4.F2** - Coaching Sessions Widget (4 days)

### Group 2 (Start after F2)
- **S1823.I4.F3** - Booking Modal Integration (3 days)

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10 days |
| Parallel Duration | 7 days (F2 + F3 overlap possible during F1) |
| Time Saved | 3 days (30%) |
| Max Parallelism | 1 feature (linear dependencies within initiative) |

**Note**: Internal parallelism is limited due to F1→F2→F3 chain, but cross-initiative parallelism with I2 and I3 is high since they only share I1 dependencies.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1823.I4.F1 Cal.com Foundation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌* |
| S1823.I4.F2 Coaching Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S1823.I4.F3 Booking Modal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*F1 is a foundation feature (types/config only) - not a true vertical slice but necessary infrastructure. Validated as acceptable for priority 1 foundation features.

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Cal.com Foundation | Pragmatic | Standard package install + minimal types needed for next features |
| F2: Coaching Widget | Pragmatic | Server component for secure API access, standard Card UI pattern |
| F3: Booking Modal | Minimal | Thin wrapper around `@calcom/embed-react` - package handles complexity |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | Package compatibility | Use stable `@calcom/embed-react` version, test imports |
| F2 | Cal.com API rate limits (120/min) | 5-minute cache revalidation reduces calls to ~12/hour per user |
| F2 | Cal.com API downtime | Graceful degradation with error state UI |
| F3 | Embed styling conflicts | Use Cal.com theming API to match brand colors |

## Environment Variables Summary

Features in this initiative require these credentials:

| Variable | Feature | Server/Client | Description |
|----------|---------|---------------|-------------|
| `CALCOM_API_KEY` | F1, F2 | Server | V2 API key for fetching bookings |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | F1, F3 | Client | Coach username for embed links |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | F1, F3 | Client | Event type slug (e.g., "30min-coaching") |

## Next Steps

1. Run `/alpha:task-decompose S1823.I4.F1` to decompose the Cal.com Foundation feature
2. Begin implementation with Priority 1 feature after I1.F1 completes
3. F2 and F3 can be task-decomposed in parallel after F1 decomposition
