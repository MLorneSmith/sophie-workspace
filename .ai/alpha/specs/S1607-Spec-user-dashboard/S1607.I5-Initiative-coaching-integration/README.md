# Feature Overview: Coaching Integration

**Parent Initiative**: S1607.I5
**Parent Spec**: S1607
**Created**: 2026-01-20
**Total Features**: 3
**Estimated Duration**: 9 days sequential / 9 days parallel

## Directory Structure

```
S1607.I5-Initiative-coaching-integration/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1607.I5.F1-Feature-coaching-widget-foundation/
│   └── feature.md                                   # Foundation: card, types, skeleton
├── S1607.I5.F2-Feature-session-booking-cta/
│   └── feature.md                                   # Booking CTA integration
└── S1607.I5.F3-Feature-upcoming-sessions-display/
    └── feature.md                                   # Cal.com API fetch & display
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1607.I5.F1 | Coaching Widget Foundation | 1 | 3 | S1607.I1 | Draft |
| S1607.I5.F2 | Session Booking CTA | 2 | 2 | F1 | Draft |
| S1607.I5.F3 | Upcoming Sessions Display | 3 | 4 | F1, F2 | Draft |

## Dependency Graph

```
S1607.I1 (Dashboard Foundation)
     │
     ▼
┌─────────────────────────────────────────┐
│  S1607.I5.F1: Coaching Widget Foundation │
│  (card, types, skeleton, empty state)    │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  S1607.I5.F2: Session Booking CTA        │
│  (Cal.com booking link/embed)            │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  S1607.I5.F3: Upcoming Sessions Display  │
│  (Cal.com API, session list, actions)    │
└─────────────────────────────────────────┘
```

## Parallel Execution Groups

**Group 0** (Can start immediately after S1607.I1):
- S1607.I5.F1: Coaching Widget Foundation (3 days)

**Group 1** (After Group 0 completes):
- S1607.I5.F2: Session Booking CTA (2 days)

**Group 2** (After Group 1 completes):
- S1607.I5.F3: Upcoming Sessions Display (4 days)

**Note**: This initiative has a linear dependency chain with no parallelization opportunities within itself. However, it can run in parallel with S1607.I2, S1607.I3, and S1607.I4 after S1607.I1 completes.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 9 days |
| Parallel Duration | 9 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature (linear chain) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Widget Foundation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Booking CTA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Sessions Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Widget Foundation | Pragmatic | Follow existing dashboard patterns, prepare types for Cal.com |
| F2: Booking CTA | Pragmatic | Simple external link first, embed as enhancement |
| F3: Sessions Display | Pragmatic | Server-side API calls with service pattern, cached |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Widget Foundation | Integration with dashboard layout | Follow existing patterns from team dashboard |
| F2: Booking CTA | Cal.com embed loading issues | Fallback to external link if embed fails |
| F3: Sessions Display | Cal.com API availability/rate limits | Cache responses, graceful error fallback UI |

## Research Leveraged

This initiative benefits from existing Cal.com API research conducted during S1606:

- **File**: `.ai/alpha/specs/S1606-Spec-user-dashboard/research-library/context7-calcom-api.md`
- **Key Findings**:
  - API v2 endpoints for fetching bookings (`GET /v2/bookings`)
  - Bearer token authentication with `cal-api-version` header
  - Response structure with booking details (id, title, start, end, meetingUrl)
  - Rate limiting headers and caching recommendations
  - Webhook events for real-time updates (future enhancement)

This eliminates the need for a separate research spike feature.

## External Dependencies

| Dependency | Purpose | Criticality |
|------------|---------|-------------|
| Cal.com API v2 | Fetch upcoming bookings | High - Core functionality |
| Cal.com booking page | User booking flow | High - Booking CTA |
| Cal.com API key | API authentication | High - Required for API calls |

## Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `CALCOM_API_KEY` | Cal.com API authentication | `cal_live_xxxx` or `cal_test_xxxx` |
| `CALCOM_BOOKING_URL` | Cal.com booking page URL | `https://cal.com/your-org/coaching` |
| `CALCOM_API_VERSION` | API version header | `2024-08-13` |

## Next Steps

1. Run `/alpha:task-decompose S1607.I5.F1` to decompose the first feature into atomic tasks
2. Ensure S1607.I1 (Dashboard Foundation) is complete before starting implementation
3. Obtain Cal.com API credentials for development environment
