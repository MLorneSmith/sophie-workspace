# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2072 |
| **Initiative ID** | S2072.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 2 |

---

## Description

Integrates Cal.com booking system with the dashboard through the V2 API. Implements a Coaching Sessions Card widget that displays upcoming booked sessions with date/time/join link, or shows a booking CTA if no sessions are scheduled. Uses server-side API calls with Bearer token authentication.

## Business Value

Drives coaching session bookings by surfacing availability directly on the dashboard. Users can see upcoming sessions at a glance or be prompted to book if none exist. This directly supports the G3 goal of +30% coaching sessions booked.

---

## Scope

### In Scope
- [ ] Cal.com V2 API client (server-side)
- [ ] Bearer token authentication (cal_ prefix required)
- [ ] Coaching Sessions Card widget
- [ ] Display upcoming sessions (1-2 next bookings)
- [ ] Booking CTA when no sessions scheduled
- [ ] Graceful fallback if API unavailable
- [ ] Integration with dashboard grid layout

### Out of Scope
- [ ] Reschedule capability in widget (link to Cal.com only)
- [ ] Calendar sync beyond Cal.com
- [ ] @calcom/atoms package (deprecated per research)
- [ ] @calcom/embed-react (buggy in Next.js 15+)
- [ ] Loading skeletons (delegated to I6)
- [ ] Empty states beyond CTA (delegated to I6)

---

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs widget for empty state design

### Blocked By
- S2072.I1 (Foundation & Data Layer) - requires page shell and grid

### Parallel With
- S2072.I2 (Progress Visualization Widgets)
- S2072.I3 (Activity & Actions Widgets)
- S2072.I5 (Presentations Table)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | External API integration, auth handling |
| External dependencies | Medium | Cal.com V2 API availability, rate limits |
| Unknowns | Medium | API behavior, token permissions |
| Reuse potential | Medium | API client reusable for other features |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Cal.com V2 API unavailable | Graceful fallback to booking CTA only |
| API rate limiting | Cache responses, limit query frequency |
| Bearer token issues | Validate token permissions during implementation |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com API Client**: Server-side client with Bearer token auth
2. **Fetch Bookings Query**: Get upcoming bookings for current user
3. **Coaching Sessions Widget**: Display sessions or booking CTA
4. **API Error Handling**: Graceful degradation on failure

### Suggested Order
1. Cal.com API Client (enables booking data)
2. Fetch Bookings Query (get data from API)
3. Coaching Sessions Widget (display data)
4. API Error Handling (production readiness)

---

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify coaching card renders

# API connectivity test (manual)
# Verify CALCOM_API_KEY is set in environment
# Check server logs for API response
```

---

## Environment Variables Required

```
NEXT_PUBLIC_CALCOM_COACH_USERNAME=<coach-username>
NEXT_PUBLIC_CALCOM_EVENT_SLUG=<event-type-slug>
CALCOM_API_KEY=cal_<api-key>  # Note: cal_ prefix required
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./S2072.I4.F*-Feature-*/` (created in next phase)
- Reference: `apps/web/app/home/(user)/coaching/_components/calendar.tsx` (iframe pattern)
- Research: `../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- API Docs: https://cal.com/docs/api/v2
