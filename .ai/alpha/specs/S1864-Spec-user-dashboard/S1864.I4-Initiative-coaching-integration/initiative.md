# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1864 |
| **Initiative ID** | S1864.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 4 |

---

## Description
Implement the Cal.com coaching sessions widget that displays upcoming coaching sessions with join/reschedule links, and provides a booking CTA when no sessions are scheduled. This initiative includes the Cal.com V2 API integration for fetching bookings and the embed script for the booking widget.

## Business Value
Directly supports Goal G4 (Increase coaching bookings +30%) by making coaching sessions visible on the dashboard with one-click booking access. Users are reminded of upcoming sessions, reducing no-shows, and can easily book new sessions without navigating away from their home base.

---

## Scope

### In Scope
- [ ] Coaching Sessions Widget displaying upcoming bookings
- [ ] Cal.com V2 API integration for fetching user bookings
- [ ] Cal.com embed script integration for booking modal
- [ ] Join meeting link display for upcoming sessions
- [ ] Reschedule link functionality
- [ ] "Book New Session" CTA with inline booking embed
- [ ] Empty state when no upcoming sessions
- [ ] Loading skeleton for widget
- [ ] Webhook handler for booking events (optional, for activity feed integration)

### Out of Scope
- [ ] Full Cal.com atoms integration (@calcom/atoms is deprecated)
- [ ] Multiple event types (single coaching event type for v1)
- [ ] Managed user creation (use existing Cal.com authentication)
- [ ] Custom theming of Cal.com embed (use default styling)
- [ ] Recurring booking management

---

## Dependencies

### Blocks
- None (independent widget)

### Blocked By
- S1864.I1: Dashboard Foundation (requires grid layout, page shell)

### Parallel With
- S1864.I2: Progress & Assessment Widgets
- S1864.I3: Activity & Task Widgets

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | External API, embed script, webhook verification |
| External dependencies | High | Cal.com API availability, rate limits |
| Unknowns | Medium | Cal.com API behavior, graceful degradation patterns |
| Reuse potential | Medium | Coaching widget pattern could extend to team context |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com Foundation**: API client setup, environment variables, types for booking data
2. **Dashboard Widget**: Display upcoming sessions with meeting links, empty state
3. **Session Actions**: Reschedule link, join meeting button functionality
4. **Booking Modal**: Cal.com embed script integration with "Book New Session" CTA

### Suggested Order
1. Cal.com Foundation (API infrastructure)
2. Dashboard Widget (display existing bookings)
3. Session Actions (join/reschedule functionality)
4. Booking Modal (new session creation) - can be parallel with Session Actions

---

## Validation Commands
```bash
# Verify Cal.com env vars are set
grep -q "CAL_" .env.local && echo "Cal.com env vars present"

# Verify widget renders
curl -s http://localhost:3000/home | grep -q "CoachingSessionsWidget"

# Test API integration (requires Cal.com credentials)
curl -H "Authorization: Bearer $CAL_API_KEY" https://api.cal.com/v2/bookings
```

---

## Related Files
- Spec: `../spec.md`
- Research: `../research-library/context7-calcom.md`
- API Route (to create): `apps/web/app/api/coaching/sessions/route.ts`
- Webhook (to create): `apps/web/app/api/webhooks/cal/route.ts`
- Features: `./S1864.I4.F*-Feature-*/` (created in next phase)
