# Feature Overview: Coaching Integration

**Parent Initiative**: S1692.I4
**Parent Spec**: S1692
**Created**: 2026-01-21
**Total Features**: 3
**Estimated Duration**: 12 days sequential / 12 days parallel

## Directory Structure

```
S1692.I4-Initiative-coaching-integration/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1692.I4.F1-Feature-calcom-foundation/
│   └── feature.md                                   # Cal.com setup and provider
├── S1692.I4.F2-Feature-dashboard-widget/
│   └── feature.md                                   # Coaching sessions widget
└── S1692.I4.F3-Feature-session-actions/
    └── feature.md                                   # Join, reschedule, book actions
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1692.I4.F1 | Cal.com Foundation & Provider Setup | 1 | 3 | None | Draft |
| S1692.I4.F2 | Coaching Sessions Dashboard Widget | 2 | 5 | F1 | Draft |
| S1692.I4.F3 | Session Actions & Interactions | 3 | 4 | F2 | Draft |

## Dependency Graph

```
S1692.I4.F1 (Cal.com Foundation - 3 days)
      │
      │ blocks
      ▼
S1692.I4.F2 (Dashboard Widget - 5 days)
      │
      │ blocks
      ▼
S1692.I4.F3 (Session Actions - 4 days)
```

## Parallel Execution Groups

**Group 0** (Start immediately):
- S1692.I4.F1: Cal.com Foundation & Provider Setup (3 days)

**Group 1** (After F1 completes):
- S1692.I4.F2: Coaching Sessions Dashboard Widget (5 days)

**Group 2** (After F2 completes):
- S1692.I4.F3: Session Actions & Interactions (4 days)

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 12 days |
| Parallel Duration | 12 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature |

**Note**: This initiative has a linear dependency chain, so parallel execution provides no time savings. Each feature must complete before the next can begin.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Cal.com Foundation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Dashboard Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Session Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Cal.com Foundation | Pragmatic | CalProvider at layout level with graceful fallback for missing credentials |
| F2: Dashboard Widget | Pragmatic | Client-side useBookings hook, Cal.com as source of truth, no database needed |
| F3: Session Actions | Pragmatic | Simple button handlers with time-based visibility, standard navigation |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Cal.com Foundation | @calcom/atoms package compatibility | Research shows stable API, documented in context7-calcom.md |
| F2: Dashboard Widget | Cal.com API rate limits | useBookings has built-in caching, fetch only 3 sessions |
| F3: Session Actions | Meeting URL availability | Only show Join button when meetingUrl exists in booking data |

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget card | Card, CardHeader, CardContent | @kit/ui/card | Existing pattern in dashboard |
| Loading state | Skeleton | @kit/ui/skeleton | Consistent with app loading patterns |
| Action buttons | Button | @kit/ui/button | Existing component with variants |
| Empty state icon | CalendarIcon | lucide-react | Consistent iconography |

## Files Summary

### Files to Create (4)
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx`
- `apps/web/app/home/(user)/_components/coaching-session-card.tsx`
- `apps/web/app/home/(user)/_components/coaching-empty-state.tsx`
- `apps/web/app/home/(user)/_components/coaching-widget-skeleton.tsx`

### Files to Modify (4)
- `apps/web/package.json` - Add @calcom/atoms dependency
- `apps/web/app/home/(user)/layout.tsx` - Add CalProvider wrapper
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard
- `apps/web/.env.local.example` - Add Cal.com environment variables

## Next Steps

1. Run `/alpha:task-decompose S1692.I4.F1` to decompose the first feature into atomic tasks
2. Begin implementation with Priority 1 feature (Cal.com Foundation)
3. After F1 completes, run `/alpha:task-decompose S1692.I4.F2` for the widget feature
