# Feature: Coaching Page Sessions List

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1366 |
| **Feature ID** | 1366-F3 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 3 |

## Description
Enhance the existing coaching page (`/home/(user)/coaching`) with a full sessions list displaying all upcoming bookings in a table format. This provides users with a dedicated space to view and manage all their coaching sessions, complementing the dashboard summary card.

## User Story
**As a** SlideHeroes user managing my coaching schedule
**I want to** see all my upcoming coaching sessions in one dedicated page
**So that** I can get a complete overview and manage sessions beyond the dashboard preview

## Acceptance Criteria

### Must Have
- [ ] Sessions table with columns: Date, Time, Title, Duration, Actions
- [ ] Action buttons per row: Join (if within 10 min), Reschedule
- [ ] Sessions sorted by date (earliest first)
- [ ] Empty state when no sessions booked
- [ ] "Book New Session" button above the table
- [ ] Existing calendar iframe preserved below sessions list
- [ ] Responsive table design for mobile (stack layout)

### Nice to Have
- [ ] Session status indicator (confirmed, pending, cancelled)
- [ ] Filter by date range
- [ ] Pagination for users with many sessions

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `sessions-list.tsx` | New |
| **Logic** | Table sorting, date formatting | New |
| **Data** | Uses `loadCoachingPageData()` from F1 (with higher limit) | Existing (F1) |
| **Database** | N/A (data from Cal.com API) | N/A |

## Architecture Decision

**Approach**: Pragmatic Extension
**Rationale**: Extend existing coaching page by adding a sessions list component above the existing calendar iframe. Reuse loader from F1 with configurable limit parameter. Keep calendar iframe intact for users who prefer visual calendar view.

### Key Architectural Choices
1. Server Component for sessions list (data passed as props)
2. Reuse session-list-item pattern from F2 for consistency
3. Reuse book-session-modal from F2 (shared component)
4. Table layout on desktop, card stack on mobile

### Trade-offs Accepted
- No pagination in MVP (assume <20 sessions typical)
- Reloading page updates data (no client-side refetch on booking)

## Dependencies

### Blocks
- None (end-user feature)

### Blocked By
- F1: Cal.com Booking Data Service (provides booking data)

### Parallel With
- F2: Dashboard Coaching Card (independent once F1 complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/coaching/_components/sessions-list.tsx` - Full sessions table component

### Modified Files
- `apps/web/app/home/(user)/coaching/page.tsx` - Add SessionsList above calendar, add BookSessionModal button
- `apps/web/app/home/(user)/coaching/_lib/server/coaching-page.loader.ts` - Add limit parameter for full list

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Sessions List Component**: Server component with table layout for all sessions
2. **Update Coaching Page Layout**: Add sessions list and book button above calendar
3. **Extend Loader for Full List**: Modify loader to support configurable limit (default vs all)
4. **Implement Responsive Table**: Mobile-friendly layout (stacked cards)
5. **Add Empty State**: Design "No sessions" state specific to coaching page

### Suggested Order
1. Extend Loader (enable fetching more sessions)
2. Sessions List Component (table with actions)
3. Coaching Page Layout (integrate list + modal + calendar)
4. Responsive Table (mobile optimization)
5. Empty State (handle zero sessions)

## Validation Commands
```bash
# Verify TypeScript types
pnpm typecheck

# Check component renders
pnpm dev
# Navigate to http://localhost:3000/home/coaching and verify:
# - Sessions list appears above calendar
# - Table shows all upcoming sessions
# - "Book New Session" button works
# - Existing calendar iframe still functional

# E2E test
pnpm --filter web-e2e test -- coaching-page

# Mobile responsiveness check
# Use browser dev tools to test mobile viewport
```

## Related Files
- Initiative: `../initiative.md`
- Depends on: `../pending-Feature-booking-data-service/feature.md`
- Shares with: `../pending-Feature-dashboard-coaching-card/feature.md` (book-session-modal)
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
