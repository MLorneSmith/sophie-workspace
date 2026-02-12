# Feature: Fetch Bookings Query

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I4 |
| **Feature ID** | S2072.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description

Implements the data fetching layer that queries upcoming Cal.com bookings for the current user. Uses the API client from F1 and integrates with the dashboard loader pattern. Handles the case where API is unavailable gracefully.

## User Story
**As a** learner
**I want to** see my upcoming coaching sessions on the dashboard
**So that** I know when my next session is scheduled

## Acceptance Criteria

### Must Have
- [ ] `fetchUpcomingBookings(userEmail)` function using API client
- [ ] Filter for `status=accepted` bookings only
- [ ] Filter for future bookings (after current time)
- [ ] Return typed `CalcomBooking[]` array
- [ ] Graceful error handling (return `null` on failure, not throw)
- [ ] Integration with dashboard loader (parallel fetch)

### Nice to Have
- [ ] Limit to 2 most recent upcoming bookings
- [ ] Sort by start time ascending

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A (data layer) |
| **Logic** | `calcom-bookings.ts` | New |
| **Data** | Cal.com V2 API | External |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple data fetching with error boundaries. Graceful degradation over complex error handling.

### Key Architectural Choices
1. Return `null` on API failure (widget shows CTA instead of error)
2. Filter server-side to minimize data transfer
3. Use React `cache()` for request deduplication within same request

### Trade-offs Accepted
- No client-side caching (data fresh on each page load)
- No background refresh (user must reload page)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | Already validated in F1 | F1 provides |

**Note**: Uses API client from F1, which handles credential validation.

## Dependencies

### Blocks
- S2072.I4.F3 (Coaching Sessions Widget) - requires booking data

### Blocked By
- S2072.I4.F1 (Cal.com API Client) - provides client

### Parallel With
- None (sequential chain)

## Files to Create/Modify

### New Files
- `apps/web/_lib/server/calcom-bookings.ts` - Booking fetch functions

### Modified Files
- `apps/web/app/home/(user)/_lib/server/load-dashboard-data.ts` - Add coaching sessions to loader (if exists, otherwise created in I1)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Fetch Function**: Implement `fetchUpcomingBookings(userEmail)`
2. **Add Filtering**: Filter for accepted status and future dates
3. **Add Error Handling**: Wrap in try-catch, return null on failure
4. **Add Caching**: Wrap with React `cache()` for deduplication
5. **Integrate with Loader**: Add to dashboard parallel data fetch

### Suggested Order
1. Create fetch function with filtering
2. Add error handling
3. Add caching
4. Integrate with dashboard loader

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Manual test in dashboard
pnpm dev
# Navigate to /home, check server logs for API response
# Verify coaching data in page props
```

## Related Files
- Initiative: `../initiative.md`
- API Client: `../S2072.I4.F1-Feature-calcom-api-client/feature.md`
- Pattern: `apps/web/app/home/(user)/_lib/server/` (loader patterns)
