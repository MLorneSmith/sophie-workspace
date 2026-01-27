# Feature Overview: Coaching Integration

**Parent Initiative**: S1864.I4
**Parent Spec**: S1864
**Created**: 2026-01-27
**Total Features**: 4
**Estimated Duration**: 13-17 days sequential / 8-10 days parallel

## Directory Structure

```
S1864.I4-Initiative-coaching-integration/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1864.I4.F1-Feature-calcom-foundation/          # Priority 1 - API infrastructure
│   └── feature.md
├── S1864.I4.F2-Feature-dashboard-widget/           # Priority 2 - Display sessions
│   └── feature.md
├── S1864.I4.F3-Feature-session-actions/            # Priority 3 - Join/reschedule
│   └── feature.md
└── S1864.I4.F4-Feature-booking-modal/              # Priority 4 - Book new sessions
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1864.I4.F1 | Cal.com Foundation | 1 | 3-4 | None | Draft |
| S1864.I4.F2 | Dashboard Widget | 2 | 4-5 | F1 | Draft |
| S1864.I4.F3 | Session Actions | 3 | 3-4 | F1, F2 | Draft |
| S1864.I4.F4 | Booking Modal | 4 | 3-4 | F1 | Draft |

## Dependency Graph

```
                    ┌─────────────────────┐
                    │  S1864.I4.F1        │
                    │  Cal.com Foundation │
                    │  Priority: 1        │
                    │  Days: 3-4          │
                    └─────────┬───────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  S1864.I4.F2        │         │  S1864.I4.F4        │
│  Dashboard Widget   │         │  Booking Modal      │
│  Priority: 2        │         │  Priority: 4        │
│  Days: 4-5          │         │  Days: 3-4          │
└─────────┬───────────┘         └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  S1864.I4.F3        │
│  Session Actions    │
│  Priority: 3        │
│  Days: 3-4          │
└─────────────────────┘
```

## Parallel Execution Groups

### Group 0 (Start Immediately)
| Feature | Days | Notes |
|---------|------|-------|
| F1: Cal.com Foundation | 3-4 | Root feature, no blockers |

### Group 1 (After F1 Complete)
| Feature | Days | Notes |
|---------|------|-------|
| F2: Dashboard Widget | 4-5 | Needs types and API client from F1 |
| F4: Booking Modal | 3-4 | Needs env config from F1, can run in parallel with F2 |

### Group 2 (After F1, F2 Complete)
| Feature | Days | Notes |
|---------|------|-------|
| F3: Session Actions | 3-4 | Needs widget container from F2 |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 13-17 days |
| Parallel Duration | 8-10 days |
| Time Saved | 5-7 days (~38%) |
| Max Parallelism | 2 features (F2 + F4 in Group 1) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V | Notes |
|---------|---|---|---|---|---|---|---|-------|
| F1: Cal.com Foundation | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | Infrastructure, limited user value |
| F2: Dashboard Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Full vertical slice |
| F3: Session Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Full vertical slice |
| F4: Booking Modal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Full vertical slice |

**Legend**: ✅ Pass | ⚠️ Acceptable | ❌ Fail

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Cal.com Foundation | Pragmatic | Server-only API client, factory pattern |
| F2: Dashboard Widget | Pragmatic | Server data fetch, client interactivity |
| F3: Session Actions | Pragmatic | Cal.com embed script, dynamic loading |
| F4: Booking Modal | Pragmatic | Shared script loader, event-driven |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Cal.com Foundation | API key exposure | Server-only access, Zod validation |
| F2: Dashboard Widget | Empty data scenarios | Graceful degradation, empty state |
| F3: Session Actions | Embed script loading | Lazy load, fallback error state |
| F4: Booking Modal | Cal.com availability | Timeout handling, error boundary |

## Required Environment Variables

All features require the following environment variables (configured in F1):

| Variable | Server/Client | Description |
|----------|---------------|-------------|
| `CAL_API_KEY` | Server | Cal.com V2 API key |
| `CAL_WEBHOOK_SECRET` | Server | Webhook signature secret |
| `NEXT_PUBLIC_CAL_USERNAME` | Client | Cal.com username for embeds |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Client | Event type slug for embeds |

## Cross-Initiative Dependencies

This initiative depends on:
- **S1864.I1**: Dashboard Foundation (provides grid layout, page shell)
  - Specifically needs: S1864.I1.F1 (types), S1864.I1.F2 (page shell), S1864.I1.F3 (grid layout)

This initiative is parallel with:
- **S1864.I2**: Progress & Assessment Widgets
- **S1864.I3**: Activity & Task Widgets

This initiative blocks:
- **S1864.I5**: Presentation Table & Polish (needs all widgets for final integration)

## Next Steps

1. Run `/alpha:task-decompose S1864.I4.F1` for Priority 1 feature (Cal.com Foundation)
2. After F1 tasks complete, decompose F2 and F4 in parallel
3. After F2 tasks complete, decompose F3
4. Update this overview as features are decomposed and completed

---

## Commands Reference

```bash
# View specific feature
cat .ai/alpha/specs/S1864-Spec-user-dashboard/S1864.I4-Initiative-coaching-integration/S1864.I4.F1-Feature-calcom-foundation/feature.md

# Decompose next feature
/alpha:task-decompose S1864.I4.F1

# List all feature directories
ls -la .ai/alpha/specs/S1864-Spec-user-dashboard/S1864.I4-Initiative-coaching-integration/S1864.I4.F*-Feature-*/
```
