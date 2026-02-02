# Feature Overview: Coaching Integration

**Parent Initiative**: S1890.I6
**Parent Spec**: S1890
**Created**: 2026-02-02
**Total Features**: 3
**Estimated Duration**: 10 days sequential / 10 days parallel

## Directory Structure

```
S1890.I6-Initiative-coaching-integration/
├── initiative.md                             # Initiative document
├── README.md                                 # This file - features overview
├── S1890.I6.F1-Feature-calcom-api-client/    # Priority 1: API client
│   └── feature.md
├── S1890.I6.F2-Feature-coaching-sessions-widget/  # Priority 2: Sessions widget
│   └── feature.md
└── S1890.I6.F3-Feature-booking-embed-fallback/   # Priority 3: Booking fallback
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1890.I6.F1 | Cal.com API Client | 1 | 3 | S1890.I1.F1, S1890.I2.F1 | Draft |
| S1890.I6.F2 | Coaching Sessions Widget | 2 | 4 | F1, S1890.I1.F1, S1890.I2.F2 | Draft |
| S1890.I6.F3 | Booking Embed Fallback | 3 | 3 | F2, S1890.I1.F1 | Draft |

## Dependency Graph

```
External Dependencies (from other initiatives):
┌─────────────────────────────────────────────────┐
│ S1890.I1.F1 (Dashboard Page & Grid)             │
│ S1890.I2.F1 (Dashboard Types)                   │
│ S1890.I2.F2 (Dashboard Data Loader)             │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
               ┌───────────────┐
               │  S1890.I6.F1  │
               │ Cal.com API   │
               │   Client      │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │  S1890.I6.F2  │
               │   Coaching    │
               │Sessions Widget│
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │  S1890.I6.F3  │
               │Booking Embed  │
               │   Fallback    │
               └───────────────┘
                       │
                       ▼
               ┌───────────────┐
               │  S1890.I7.*   │
               │ Empty States  │
               │   & Polish    │
               └───────────────┘
```

## Parallel Execution Groups

**Group 0** (Start immediately - after I1/I2 dependencies):
- S1890.I6.F1: Cal.com API Client (3 days)

**Group 1** (After F1 completes):
- S1890.I6.F2: Coaching Sessions Widget (4 days)

**Group 2** (After F2 completes):
- S1890.I6.F3: Booking Embed Fallback (3 days)

**Note**: This initiative has a strictly linear dependency chain (F1 → F2 → F3), so parallel execution is not possible within I6. However, I6 can run in parallel with I3, I4, and I5 after I1/I2 dependencies are met.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10 days |
| Parallel Duration | 10 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature |

**Note**: Linear dependency chain limits internal parallelism. Cross-initiative parallelism is the optimization opportunity.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1890.I6.F1 Cal.com API Client | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S1890.I6.F2 Coaching Sessions Widget | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S1890.I6.F3 Booking Embed Fallback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### Validation Notes:
- **F1**: Independent data layer, developer-testable via unit tests
- **F2**: User-visible sessions display, E2E testable
- **F3**: User-visible booking flow, E2E testable

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1890.I6.F1 | Pragmatic | Single-purpose API client with Next.js fetch caching |
| S1890.I6.F2 | Pragmatic | Server component pattern following existing widgets |
| S1890.I6.F3 | Pragmatic | Reuse existing iframe pattern (most stable per research) |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1890.I6.F1 | Cal.com API rate limiting/downtime | 5-minute cache, graceful degradation |
| S1890.I6.F2 | API response format changes | TypeScript types, null handling |
| S1890.I6.F3 | iframe embed styling limitations | Accept trade-off, dialog modal for better UX |

## Environment Variables

All required credentials already exist in `.env`:

| Variable | Status |
|----------|--------|
| `CALCOM_API_KEY` | ✅ Exists |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | ✅ Exists |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | ✅ Exists |

## Next Steps

1. Run `/alpha:task-decompose S1890.I6.F1` to decompose the API client feature
2. Begin implementation after S1890.I1 and S1890.I2 dependencies complete
3. This initiative can run in parallel with S1890.I3, I4, I5

## Related Files
- Spec: `../spec.md`
- Initiative: `./initiative.md`
- Research: `../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
