# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I6 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 6 |

---

## Description
Implement the Coaching Sessions Widget with Cal.com V2 API integration. The widget displays upcoming 1-2 coaching sessions with date/time, join link, and reschedule option. Shows a "Book a Session" CTA with Cal.com embed when no sessions are booked. This is a higher-risk integration due to external API dependency.

## Business Value
Coaching sessions are a premium feature that drives user success and revenue. Surfacing upcoming sessions on the dashboard increases attendance rates and reduces no-shows. The booking CTA increases conversion for users who haven't scheduled sessions.

---

## Scope

### In Scope
- [x] Coaching Sessions Widget component
- [x] Cal.com V2 API integration for fetching upcoming bookings
- [x] Server-side API call with Bearer token authentication
- [x] Display upcoming 1-2 sessions with date, time, and event type
- [x] "Join" link for confirmed sessions
- [x] "Reschedule" link for session management
- [x] Fallback iframe embed for booking when no sessions exist
- [x] Loading and error states for API calls
- [x] Caching strategy for API responses

### Out of Scope
- [ ] Empty state design (handled by I7)
- [ ] Full coaching page redesign (existing feature)
- [ ] Cal.com webhook integration for real-time updates
- [ ] Multiple coach support (single coach for v1)

---

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure)

### Blocked By
- S1890.I1: Dashboard Foundation (needs grid layout)
- S1890.I2: Data Layer (needs dashboard data context)

### Parallel With
- S1890.I3: Progress Widgets
- S1890.I4: Task & Activity Widgets
- S1890.I5: Action Widgets

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | New API integration; V2 API well-documented |
| External dependencies | Medium | Cal.com API - rate limiting, availability concerns |
| Unknowns | Medium | API response format; error handling scenarios |
| Reuse potential | Medium | Existing iframe pattern in coaching page |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com API Client**: Server-side API wrapper with auth and error handling
2. **Coaching Sessions Widget**: Display component with session cards
3. **Booking Embed Widget**: Cal.com iframe for booking new sessions

### Suggested Order
1. Cal.com API Client (F1) - foundation for widget
2. Coaching Sessions Widget (F2) - main display component
3. Booking Embed Widget (F3) - fallback for no sessions

---

## Validation Commands
```bash
# Verify coaching widget component
test -f apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "✓ Coaching widget exists"

# Verify API client
test -f apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "✓ Cal.com API client exists"

# Check for V2 API headers
grep -rq "cal-api-version" apps/web/app/home/\(user\)/_lib/server/ && echo "✓ V2 API headers"

# Integration test
pnpm --filter web test:unit -- -g "calcom"
```

---

## Related Files
- Spec: `../spec.md`
- Existing iframe: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
- Research: `research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)

## Cal.com V2 API Reference
| Endpoint | Purpose |
|----------|---------|
| GET /v2/bookings?status=accepted | Fetch confirmed upcoming sessions |
| Headers | `Authorization: Bearer cal_<key>`, `cal-api-version: 2024-08-13` |

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| API rate limiting | Cache responses for 5 minutes |
| API downtime | Graceful degradation to "Book a Session" CTA |
| Token expiration | API key doesn't expire (not OAuth) |
