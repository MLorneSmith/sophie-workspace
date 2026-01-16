# Initiative: Cal.com Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | #1362 |
| **Initiative ID** | #1366 |
| **Status** | Draft |
| **Estimated Weeks** | 2.5-3 |
| **Priority** | 4 |

---

## Description
Integrate Cal.com for coaching session booking and display. This includes server-side API integration to fetch upcoming bookings, the embed SDK for booking modals, and the Coaching Sessions Card that displays next sessions with join/reschedule options.

## Business Value
Enables users to book and manage coaching sessions without leaving the dashboard:
- Reduces friction in booking process (Goal G2)
- Increases coaching session engagement (+15% target)
- Provides at-a-glance visibility of upcoming sessions
- Supports secondary persona (Sarah the Session Booker)

---

## Scope

### In Scope
- [x] Cal.com API v2 server actions (fetch upcoming bookings)
- [x] Cal.com Embed SDK integration (booking modal)
- [x] Coaching Sessions Card component (next 1-2 sessions)
- [x] Join meeting button with link
- [x] Reschedule option via embed modal
- [x] "Book Session" button launching embed modal
- [x] Environment variable configuration for Cal.com API key
- [x] Caching strategy (15-min stale time) for booking data
- [x] Empty state for no upcoming sessions
- [x] Error handling for API failures

### Out of Scope
- [x] Full calendar view of all sessions
- [x] Session history/past sessions
- [x] Cancellation flow (redirect to Cal.com)
- [x] Coach profile/bio display
- [x] Multi-coach selection (single coaching event type)

---

## Dependencies

### Blocks
- None (end-node in dependency graph)

### Blocked By
- I1: Dashboard Foundation (provides dashboard layout and cards)

### Parallel With
- I2: Progress Visualization (can develop in parallel once I1 complete)
- I3: Activity & Task Tracking (can develop in parallel once I1 complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | External API + embed script integration |
| External dependencies | High | Cal.com API availability, rate limits |
| Unknowns | Medium | Cal.com event type slug, API key setup, rate limits |
| Reuse potential | Medium | Cal.com integration reusable if expanded |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com API Integration**: Server actions for fetching bookings
2. **Embed SDK Setup**: Script loading, modal configuration
3. **Coaching Sessions Card**: UI component with sessions list
4. **Booking Modal**: "Book Session" button with embed integration

### Suggested Order
1. Cal.com API Integration (foundation; validates API access works)
2. Coaching Sessions Card (displays fetched data)
3. Embed SDK Setup (enables booking flow)
4. Booking Modal (completes the loop)

---

## Technical Notes

### Cal.com API Configuration
```typescript
// Environment variables
CALCOM_API_KEY=cal_live_xxxxxx
CALCOM_EVENT_SLUG=coaching-session  // TBD - open question
CALCOM_USERNAME=slideheroes         // TBD - confirm username
```

### Server Action Pattern
```typescript
// apps/web/app/home/(user)/_lib/server/calcom-server-actions.ts
'use server';

import 'server-only';

export async function getUpcomingBookings() {
  const response = await fetch('https://api.cal.com/v2/bookings?status=upcoming&limit=2', {
    headers: {
      'Authorization': `Bearer ${process.env.CALCOM_API_KEY}`,
      'cal-api-version': '2024-08-13'
    },
    next: { revalidate: 900 } // 15 min cache
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }

  return response.json();
}
```

### Embed SDK Integration
```typescript
// Client component
'use client';

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export function CalBookingButton() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", { theme: "light" });
    })();
  }, []);

  return (
    <button
      data-cal-link="slideheroes/coaching-session"
      data-cal-config='{"theme":"light"}'
    >
      Book Coaching Session
    </button>
  );
}
```

### Booking Data Structure
```typescript
interface CalBooking {
  id: number;
  uid: string;
  title: string;
  status: 'accepted' | 'pending' | 'cancelled';
  start: string; // ISO datetime
  end: string;
  meetingUrl?: string;
}
```

### Card Display
- Show max 2 upcoming sessions
- Display: Date, Time, Title, Status badge
- Actions: [Join] (if meetingUrl), [Reschedule]
- Empty state: "No upcoming sessions" + [Book Session] button

---

## Risk Considerations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cal.com API rate limits | Low | Medium | Cache 15 min, batch requests |
| API key exposure | Low | High | Server actions only, never client-side |
| Embed script blocks page load | Low | Medium | Dynamic import, defer loading |
| Cal.com API changes | Low | Medium | Pin API version, monitor for updates |

---

## Open Questions (to resolve before implementation)

1. **What is the Cal.com event type slug?** (e.g., `coaching-session`, `30min`, etc.)
2. **What is the Cal.com username/organization?** (e.g., `slideheroes`)
3. **Is a Cal.com API key already configured?** Check production environment
4. **What meeting platform is used?** (Zoom, Google Meet, Cal Video)

---

## Validation Commands
```bash
# Verify Cal.com API access
curl -H "Authorization: Bearer $CALCOM_API_KEY" \
  -H "cal-api-version: 2024-08-13" \
  https://api.cal.com/v2/me

# Test booking fetch
curl http://localhost:3000/api/test/calcom-bookings

# Verify embed loads
curl http://localhost:3000/home | grep -q "cal-embed"

# E2E test booking flow
pnpm --filter web-e2e test -- calcom-booking
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../pending-Initiative-dashboard-foundation/initiative.md`
- Research: `../research-library/calcom-embed-integration.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
