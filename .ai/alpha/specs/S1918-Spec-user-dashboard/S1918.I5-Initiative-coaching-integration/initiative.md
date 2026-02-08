# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1918 |
| **Initiative ID** | S1918.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 5 |

---

## Description
Integrate Cal.com V2 API to fetch upcoming coaching sessions and display them in a dashboard widget. Includes API client, server-side data fetching, and widget UI with booking link fallback.

## Business Value
Coaching sessions are a premium feature. Surfacing upcoming sessions and booking CTAs on the dashboard increases coaching engagement and bookings by an estimated 20%.

---

## Scope

### In Scope
- [x] Cal.com V2 API client (server-side only)
- [x] Fetch upcoming bookings with Bearer token auth
- [x] Coaching Sessions widget showing next 1-2 sessions
- [x] Session details (date/time, coach name, join link)
- [x] "Book a Session" CTA linking to booking page
- [x] Empty state for no bookings
- [x] Error handling with graceful fallback

### Out of Scope
- [ ] Cal.com booking modal/embed (links to booking page instead)
- [ ] @calcom/atoms (deprecated, requires Platform OAuth)
- [ ] Real-time session updates
- [ ] Rescheduling UI (links to Cal.com)

---

## Dependencies

### Blocks
- S1918.I6: Polish (needs base widget)

### Blocked By
- S1918.I1: Dashboard Foundation (needs grid slot)

### Parallel With
- S1918.I2: Data Layer (independent external API)
- S1918.I3: Progress Widgets (independent widget)
- S1918.I4: Activity & Task Widgets (independent widget)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | External API integration |
| External dependencies | Medium | Cal.com V2 API stability |
| Unknowns | Low | Research doc covers API patterns |
| Reuse potential | Medium | Cal.com client reusable for other features |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com API Client**: Server-side client with Bearer token auth
2. **Coaching Sessions Widget**: Display upcoming sessions with CTAs

### Suggested Order
1. API client (foundational, handles auth and error states)
2. Widget UI (consumes API client data)

---

## Validation Commands
```bash
# Verify API client exists
test -f apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "✓ Cal.com client exists"

# Verify widget exists
test -f apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "✓ Coaching widget exists"

# Type check
pnpm typecheck

# Verify env var documented
grep -q "CALCOM_API_KEY" apps/web/.env.example && echo "✓ Env var documented"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Research: `.ai/alpha/specs/S1918-Spec-user-dashboard/research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- Cal.com V2 API Docs: https://cal.com/docs/api/v2
