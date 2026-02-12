# Feature: Coaching Sessions Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I4 |
| **Feature ID** | S2072.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description

Creates the Coaching Sessions Card widget that displays upcoming booked sessions with date/time/join link, or shows a booking CTA if no sessions are scheduled. Integrates with the dashboard grid layout from I1.

## User Story
**As a** learner
**I want to** see my upcoming coaching sessions at a glance
**So that** I can quickly join or book a session without navigating away

## Acceptance Criteria

### Must Have
- [ ] Card component using `@kit/ui/card` pattern
- [ ] Display 1-2 upcoming sessions with date, time, and "Join Session" link
- [ ] "Book a Session" CTA when no upcoming sessions
- [ ] CTA links to Cal.com booking page (not embed)
- [ ] Responsive design for mobile/tablet/desktop grid
- [ ] Graceful handling when booking data is `null` (API failure)

### Nice to Have
- [ ] Session duration display (e.g., "60 min")
- [ ] Relative time display (e.g., "Tomorrow at 2 PM")
- [ ] Coach avatar/name display

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `coaching-sessions-card.tsx` | New |
| **Logic** | Widget component with conditional rendering | New |
| **Data** | Props from dashboard loader | F2 provides |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple conditional UI based on data presence. Follow existing card widget patterns.

### Key Architectural Choices
1. Server component (data passed via props from loader)
2. Conditional rendering: sessions vs. empty state CTA
3. External link to Cal.com for booking (no embed in widget)

### Trade-offs Accepted
- No in-widget booking (links to full Cal.com page)
- No reschedule capability (links to Cal.com)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | `Card`, `CardHeader`, `CardContent` | @kit/ui/card | Existing pattern |
| CTA button | `Button` | @kit/ui/button | Consistent styling |
| External link icon | `ExternalLink` | lucide-react | Standard icon |
| Calendar icon | `Calendar` | lucide-react | Visual indicator |

**Components to Install**: None (all exist in project)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | For booking URL | Client-safe |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | For booking URL | Client-safe |

**Note**: These are `NEXT_PUBLIC_` prefixed and can be used in client components if needed.

## Dependencies

### Blocks
- None (leaf feature)

### Blocked By
- S2072.I4.F1 (Cal.com API Client) - provides client for F2
- S2072.I4.F2 (Fetch Bookings Query) - provides data
- S2072.I1.F1 (Dashboard Page Shell) - provides grid slot

### Parallel With
- None (depends on F2 data)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Card Structure**: Set up Card with header and content areas
2. **Add Sessions Display**: Render upcoming sessions list
3. **Add Empty State**: CTA for booking when no sessions
4. **Add Error State**: Fallback UI when data is null
5. **Integrate with Grid**: Add to dashboard page layout
6. **Add Responsive Styling**: Ensure fits in 3-column grid

### Suggested Order
1. Create card structure with placeholder content
2. Add sessions display (with mock data first)
3. Add empty state CTA
4. Add error/null state handling
5. Integrate with dashboard page
6. Test responsive behavior

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home
# Verify card renders in grid
# Test with/without sessions (mock data)

# Responsive testing
# Resize browser to test breakpoints
```

## Related Files
- Initiative: `../initiative.md`
- Data Layer: `../S2072.I4.F2-Feature-fetch-bookings-query/feature.md`
- Pattern: `packages/ui/src/shadcn/card.tsx` (Card component)
- Pattern: `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (card pattern)
