# Feature Overview: Coaching Integration

**Parent Initiative**: S1815.I4
**Parent Spec**: S1815
**Created**: 2026-01-26
**Total Features**: 3
**Estimated Duration**: 10 days sequential / 10 days parallel

## Directory Structure

```
S1815.I4-Initiative-coaching-integration/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1815.I4.F1-Feature-calcom-foundation/
│   └── feature.md                                   # Cal.com package & provider setup
├── S1815.I4.F2-Feature-dashboard-widget/
│   └── feature.md                                   # Widget with booking display
└── S1815.I4.F3-Feature-session-actions/
    └── feature.md                                   # Join & reschedule functionality
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1815.I4.F1 | Cal.com Foundation | 1 | 3 | None | Draft |
| S1815.I4.F2 | Dashboard Widget | 2 | 4 | F1 | Draft |
| S1815.I4.F3 | Session Actions | 3 | 3 | F1, F2 | Draft |

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    S1815.I4 Feature Dependencies            │
└─────────────────────────────────────────────────────────────┘

   ┌────────────────────────┐
   │  F1: Cal.com Foundation │
   │  (3 days)               │
   │  Priority: 1            │
   └───────────┬────────────┘
               │
               │ blocks
               ▼
   ┌────────────────────────┐
   │  F2: Dashboard Widget   │
   │  (4 days)               │
   │  Priority: 2            │
   └───────────┬────────────┘
               │
               │ blocks
               ▼
   ┌────────────────────────┐
   │  F3: Session Actions    │
   │  (3 days)               │
   │  Priority: 3            │
   └────────────────────────┘

Legend:
  │ blocks = Must complete before dependent feature can start
```

## Parallel Execution Groups

**Group 0** (Start immediately):
- F1: Cal.com Foundation (3 days) - No dependencies

**Group 1** (After Group 0):
- F2: Dashboard Widget (4 days) - Blocked by F1

**Group 2** (After Group 1):
- F3: Session Actions (3 days) - Blocked by F1, F2

**Note**: This initiative has a purely sequential dependency chain, so parallel execution provides no time savings. Each feature must complete before the next can begin.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10 days |
| Parallel Duration | 10 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature |

**Critical Path**: F1 → F2 → F3 (10 days total)

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Cal.com Foundation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F2: Dashboard Widget | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F3: Session Actions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### INVEST-V Validation Details

**F1: Cal.com Foundation**
- **I**ndependent: Can deploy foundation without other features ✓
- **N**egotiable: Package placement and config approach flexible ✓
- **V**aluable: Enables all Cal.com functionality ✓
- **E**stimable: Clear scope - 3 days confident ✓
- **S**mall: ~8 files, focused scope ✓
- **T**estable: Unit tests for config validation ✓
- **V**ertical: UI (Provider) → Logic (Config) → Types ✓

**F2: Dashboard Widget**
- **I**ndependent: Widget can display without actions feature ✓
- **N**egotiable: Layout and booking modal approach flexible ✓
- **V**aluable: Users see upcoming sessions at a glance ✓
- **E**stimable: Clear components - 4 days confident ✓
- **S**mall: ~7 files, focused on display ✓
- **T**estable: Visual testing of states (loading, empty, data) ✓
- **V**ertical: UI (Widget) → Logic (Hook) → External API ✓

**F3: Session Actions**
- **I**ndependent: Actions enhance widget but are separable ✓
- **N**egotiable: Join timing and reschedule UX flexible ✓
- **V**aluable: Users can join and reschedule sessions ✓
- **E**stimable: Clear interactions - 3 days confident ✓
- **S**mall: ~6 files, focused on actions ✓
- **T**estable: E2E test for join and reschedule flows ✓
- **V**ertical: UI (Buttons) → Logic (Hooks) → External API ✓

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Cal.com Foundation | Pragmatic | Use official `@calcom/atoms` package with thin wrapper for config |
| F2: Dashboard Widget | Pragmatic | Client-side `useBookings` hook with Dialog for booking flow |
| F3: Session Actions | Pragmatic | Native Cal.com reschedule via `rescheduleUid` prop |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | Package version incompatibility | Pin version, test in isolation first |
| F2 | Cal.com API downtime | Graceful error state, cache last known bookings |
| F3 | Missing meetingUrl on bookings | Validate and disable Join button when unavailable |

## Environment Variables Required

From research (`context7-calcom.md`), the following credentials are needed:

| Variable | Required By | Description |
|----------|-------------|-------------|
| `CAL_OAUTH_CLIENT_ID` | F1, F2, F3 | OAuth client ID for Cal.com API |
| `CAL_API_KEY` | F1 | Server-side API key (if needed) |
| `NEXT_PUBLIC_CAL_COACH_USERNAME` | F2, F3 | Coach username for Booker component |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | F2, F3 | Event type slug (e.g., "60min") |

## Next Steps

1. Run `/alpha:task-decompose S1815.I4.F1` to decompose the first feature (Cal.com Foundation)
2. Begin implementation with F1 to establish Cal.com infrastructure
3. After F1 completes, decompose and implement F2 (Dashboard Widget)
4. Finally, decompose and implement F3 (Session Actions)
