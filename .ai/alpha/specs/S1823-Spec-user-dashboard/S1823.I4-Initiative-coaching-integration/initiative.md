# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1823 |
| **Initiative ID** | S1823.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 4 |

---

## Description
Implement the Coaching Sessions Widget with Cal.com integration for displaying upcoming coaching sessions and enabling booking. Uses `@calcom/embed-react` for the booking modal and Cal.com V2 API for fetching existing bookings. Includes graceful degradation if Cal.com API is unavailable.

## Business Value
Increases visibility of coaching sessions directly on the dashboard, reducing no-show rates and encouraging booking. The embedded booking flow reduces friction compared to navigating to a separate page. This supports premium feature adoption and user engagement.

---

## Scope

### In Scope
- [x] Coaching Sessions Widget displaying upcoming bookings
- [x] Cal.com V2 API integration for fetching bookings
- [x] `@calcom/embed-react` integration for booking modal
- [x] "Book a Session" CTA when no upcoming sessions
- [x] Join and Reschedule links for existing bookings
- [x] Server-side data fetching with caching (5-min revalidation)
- [x] Graceful degradation if Cal.com unavailable
- [x] Environment variable configuration for Cal.com API key

### Out of Scope
- [ ] Cal.com OAuth authentication (deprecated, using API key)
- [ ] Webhook handling for booking updates
- [ ] Calendar sync with external providers
- [ ] Session history/past bookings
- [ ] Cancellation flow (via Cal.com directly)

---

## Dependencies

### Blocks
- S1823.I5 (needs widget for empty states)

### Blocked By
- S1823.I1 (needs grid layout and type definitions)

### Parallel With
- S1823.I2 (Progress/Assessment Widgets)
- S1823.I3 (Activity/Task Widgets)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | External API integration, embed package |
| External dependencies | Medium | Cal.com V2 API availability, rate limits (120/min) |
| Unknowns | Low | Research completed, patterns documented |
| Reuse potential | Low | First Cal.com integration in codebase |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com Foundation**: Install embed package, configure environment variables, create types
2. **Bookings Loader**: Server-side function to fetch upcoming bookings via V2 API
3. **Coaching Sessions Widget**: Display bookings list with join/reschedule actions
4. **Booking Modal Integration**: Client component with embed-react for new bookings

### Suggested Order
1. Cal.com Foundation (setup, types, env vars)
2. Bookings Loader (server-side API fetch)
3. Coaching Sessions Widget (display component)
4. Booking Modal Integration (client interaction)

---

## Validation Commands
```bash
# Verify Cal.com environment variables
grep -q "CALCOM_API_KEY" apps/web/.env.local

# Verify widget renders
curl -s http://localhost:3000/home | grep -q "coaching\|session"

# Test API fetch with mock
pnpm --filter web test:unit -- --grep "calcom"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Research: `../research-library/context7-calcom.md`
- Cal.com Embed Docs: https://cal.com/help/embedding/adding-embed
- Cal.com V2 API: https://cal.com/docs/api-reference/v2/introduction

## Environment Variables Required
```env
CALCOM_API_KEY="cal_live_xxxxxxxxxxxxx"
NEXT_PUBLIC_CALCOM_COACH_USERNAME="coach-name"
NEXT_PUBLIC_CALCOM_EVENT_SLUG="30min-coaching"
```
