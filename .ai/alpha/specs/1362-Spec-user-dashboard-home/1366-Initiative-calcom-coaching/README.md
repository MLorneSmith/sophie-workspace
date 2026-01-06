# Feature Overview: Cal.com Coaching Integration

**Parent Initiative**: #1366
**Parent Spec**: #1362
**Created**: 2026-01-01
**Total Features**: 3
**Estimated Duration**: 10-13 days sequential / 7-9 days parallel

## Directory Structure

```
1366-Initiative-calcom-coaching/
├── initiative.md                         # Initiative document
├── README.md                             # This file - features overview
├── 1377-Feature-booking-data-service/    # F1: Cal.com API integration
│   └── feature.md
├── 1378-Feature-dashboard-coaching-card/ # F2: Dashboard card + modal
│   └── feature.md
└── 1379-Feature-coaching-page-sessions/  # F3: Full coaching page
    └── feature.md
```

## Feature Summary

| ID | Issue | Directory | Priority | Days | Dependencies | Status |
|----|-------|-----------|----------|------|--------------|--------|
| F1 | #1377 | booking-data-service | 1 | 3-4 | None | Planning |
| F2 | #1378 | dashboard-coaching-card | 2 | 4-5 | #1377 | Planning |
| F3 | #1379 | coaching-page-sessions | 3 | 3-4 | #1377 | Planning |

## Dependency Graph

```
┌─────────────────────────────────────────┐
│                                         │
│  F1: Booking Data Service               │
│  (Cal.com API + Zod schemas)            │
│  Priority: 1 | Days: 3-4                │
│                                         │
└──────────────┬──────────────────────────┘
               │
               │ blocks
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│              │ │              │
│ F2: Dashboard│ │ F3: Coaching │
│ Coaching Card│ │ Page Sessions│
│              │ │              │
│ Priority: 2  │ │ Priority: 3  │
│ Days: 4-5    │ │ Days: 3-4    │
│              │ │              │
└──────────────┘ └──────────────┘

F2 and F3 can execute in PARALLEL once F1 is complete
```

## Parallel Execution Groups

### Group 0: Foundation (No Dependencies)
- **F1: Cal.com Booking Data Service** (3-4 days)
  - Establishes API integration and data types
  - Must complete before any other feature can start

### Group 1: User Features (Depend on F1)
- **F2: Dashboard Coaching Card** (4-5 days)
- **F3: Coaching Page Sessions List** (3-4 days)
- Both can execute in **parallel** once F1 is complete

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10-13 days |
| Parallel Duration | 7-9 days |
| Time Saved | 3-4 days (30%) |
| Max Parallelism | 2 features |

**Critical Path**: F1 (3-4 days) → F2 (4-5 days) = 7-9 days

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Booking Data Service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| F2: Dashboard Coaching Card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Coaching Page Sessions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

**Note on F1 Vertical**: F1 is infrastructure-only (no UI layer) but is a valid vertical slice for the "developer" persona. It provides testable API integration that enables all user-facing features.

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Booking Data Service | Pragmatic Server-First | Simple fetch + Zod, no SDK needed |
| F2: Dashboard Coaching Card | Pragmatic Component Composition | Server + Client component split |
| F3: Coaching Page Sessions | Pragmatic Extension | Extend existing page, reuse components |

**Overall Approach**: Pragmatic
- Reuse existing codebase patterns (loaders, cards, server actions)
- No external SDK dependencies (simple iframe embed)
- Server-side API calls for security
- Minimal new abstractions

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | Cal.com API unavailable | Graceful degradation (empty array), 15-min cache |
| F2 | Iframe modal UX | Acceptable for MVP, can upgrade to SDK later |
| F3 | Many sessions performance | Cache + limit, pagination as Nice-to-Have |

## Files Summary

### Total: 11 files (7 create + 4 modify)

**New Files**:
1. `coaching/_lib/server/cal-api-client.ts` - API client
2. `coaching/_lib/schemas/booking.schema.ts` - Zod schemas
3. `coaching/_lib/server/coaching-page.loader.ts` - Data loader
4. `_components/coaching-sessions-card.tsx` - Dashboard card
5. `_components/session-list-item.tsx` - Session row component
6. `_components/book-session-modal.tsx` - Booking modal
7. `coaching/_components/sessions-list.tsx` - Full sessions table

**Modified Files**:
1. `.env.example` - Add Cal.com env vars
2. `page.tsx` (user dashboard) - Add coaching card
3. `coaching/page.tsx` - Add sessions list
4. `coaching/_lib/server/coaching-page.loader.ts` - Add limit parameter

## Next Steps

1. Run `/alpha:task-decompose 1377` to decompose the first feature
2. Begin implementation with Priority 1 / Group 0 features
