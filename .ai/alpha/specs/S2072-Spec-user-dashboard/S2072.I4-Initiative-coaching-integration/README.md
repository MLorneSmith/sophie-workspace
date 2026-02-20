# Feature Overview: Coaching Integration

**Parent Initiative**: S2072.I4
**Parent Spec**: S2072
**Created**: 2026-02-12
**Total Features**: 3
**Estimated Duration**: 7 days sequential / 7 days parallel

---

## Directory Structure

```
S2072.I4-Initiative-coaching-integration/
├── initiative.md                              # Initiative document
├── README.md                                  # This file - features overview
├── S2072.I4.F1-Feature-calcom-api-client/     # F1: API client foundation
│   └── feature.md
├── S2072.I4.F2-Feature-fetch-bookings-query/  # F2: Data fetching layer
│   └── feature.md
└── S2072.I4.F3-Feature-coaching-sessions-widget/ # F3: UI widget
    └── feature.md
```

---

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S2072.I4.F1 | Cal.com API Client | 1 | 2 | None | Draft |
| S2072.I4.F2 | Fetch Bookings Query | 2 | 2 | F1 | Draft |
| S2072.I4.F3 | Coaching Sessions Widget | 3 | 3 | F1, F2, I1.F1 | Draft |

---

## Dependency Graph

```
External (I1):
  S2072.I1.F1 (Dashboard Page Shell)
        │
        │
Internal:
  S2072.I4.F1 ──► S2072.I4.F2 ──► S2072.I4.F3
  (API Client)    (Bookings)       (Widget)
        │              │                │
        │              │                ▼
        └──────────────┴───────► S2072.I1.F1 (grid slot)
```

---

## Parallel Execution Groups

### Group 0: Foundation (Days 1-2)
| Feature | Days | Dependencies |
|---------|------|--------------|
| S2072.I4.F1: Cal.com API Client | 2 | None |

### Group 1: Data Layer (Days 3-4)
| Feature | Days | Dependencies |
|---------|------|--------------|
| S2072.I4.F2: Fetch Bookings Query | 2 | F1 |

### Group 2: UI Widget (Days 5-7)
| Feature | Days | Dependencies |
|---------|------|--------------|
| S2072.I4.F3: Coaching Sessions Widget | 3 | F1, F2, I1.F1 |

**Note**: F3 depends on I1.F1 (Dashboard Page Shell from Initiative 1) for the grid slot. If I1 is not complete, F3 can still be developed but cannot be integrated until the dashboard page exists.

---

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 7 days |
| Parallel Duration | 7 days (sequential chain) |
| Time Saved | 0 days (linear dependency) |
| Max Parallelism | 1 feature (hub-spoke) |

---

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V | Notes |
|---------|---|---|---|---|---|---|---|-------|
| S2072.I4.F1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | Infrastructure, not user-visible alone |
| S2072.I4.F2 | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | Data layer, not user-visible alone |
| S2072.I4.F3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Full vertical slice |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

**Notes**:
- F1 and F2 are infrastructure/data layers - they deliver developer value but not direct user value alone
- F3 is the user-visible feature that completes the vertical slice
- All features are under 5 files and 3 days each

---

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Cal.com API Client | Minimal | Single-purpose client, no abstraction needed |
| F2: Fetch Bookings Query | Pragmatic | Simple data fetch with graceful degradation |
| F3: Coaching Sessions Widget | Pragmatic | Conditional UI based on data presence |

---

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | API key misconfiguration | Zod validation at module level |
| F2 | API unavailable | Return null, widget shows CTA |
| F3 | No dashboard grid yet | Depends on I1.F1 completion |

---

## Required Environment Variables

| Variable | Scope | Source |
|----------|-------|--------|
| `CALCOM_API_KEY` | Server-only | Cal.com dashboard (must have `cal_` prefix) |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Client-safe | Cal.com profile |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Client-safe | Cal.com event type |

**Status**: All variables exist in `apps/web/.env` but are currently unused.

---

## Cross-Initiative Dependencies

### Depends On
- **S2072.I1.F1** (Dashboard Page Shell) - Required for F3 integration

### Blocks
- **S2072.I6** (Empty States & Polish) - Needs widget for empty state design

### Parallel With
- S2072.I2 (Progress Visualization)
- S2072.I3 (Activity & Task Widgets)
- S2072.I5 (Presentations Table)

---

## Next Steps

1. Run `/alpha:task-decompose S2072.I4.F1` to decompose the API client feature
2. After F1 completes, decompose F2
3. After F2 completes (and I1.F1 exists), decompose F3
4. Update this overview as features are implemented
