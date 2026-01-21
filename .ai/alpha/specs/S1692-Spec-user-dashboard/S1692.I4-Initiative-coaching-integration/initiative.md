# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1692 |
| **Initiative ID** | S1692.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 3-4 |
| **Priority** | 4 |

---

## Description
Implement Cal.com integration for the Coaching Sessions widget. This includes setting up the `@calcom/atoms` package, displaying upcoming sessions, and providing booking/reschedule functionality directly from the dashboard.

## Business Value
Coaching sessions are a premium feature with high monetization potential. Making sessions visible and bookable from the dashboard increases booking rates (target: +30%) and reduces friction in the coaching journey.

---

## Scope

### In Scope
- [x] Install and configure `@calcom/atoms` package
- [x] CalProvider setup in app layout
- [x] Coaching Sessions widget showing upcoming bookings
- [x] "Book New Session" CTA when no sessions
- [x] Join session link with meeting URL
- [x] Reschedule session functionality
- [x] Empty state for no upcoming sessions
- [x] Loading skeleton state
- [x] Environment variable documentation

### Out of Scope
- [ ] Webhook integration for real-time updates (future)
- [ ] Coaching session history
- [ ] In-app video calling
- [ ] Coach selection/filtering

---

## Dependencies

### Blocks
- S1692.I5: Polish & Testing (needs widget for E2E tests)

### Blocked By
- S1692.I1: Dashboard Foundation (needs grid layout and data loader)

### Parallel With
- S1692.I2: Progress & Assessment Widgets (can develop simultaneously)
- S1692.I3: Activity & Task Widgets (can develop simultaneously)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | External API, OAuth, new package integration |
| External dependencies | High | Cal.com API v2, requires OAuth client ID |
| Unknowns | Medium | Cal.com atoms documented but untested in codebase |
| Reuse potential | Medium | CalProvider useful for other Cal.com features |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com Package Setup**: Install @calcom/atoms, configure CalProvider
2. **Coaching Widget Shell**: Widget card structure with states
3. **Bookings Data Hook**: Use `useBookings` from @calcom/atoms
4. **Session Display**: Show upcoming session with details
5. **Booking Actions**: Book new, join, reschedule buttons

### Suggested Order
1. Cal.com Package Setup (foundation - may need spike if issues)
2. Coaching Widget Shell (UI structure)
3. Bookings Data Hook (data layer)
4. Session Display (render bookings)
5. Booking Actions (interaction)

### Spike Consideration
If Cal.com OAuth setup is complex or undocumented, a 2-3 day spike may be needed before full implementation.

---

## Validation Commands
```bash
# Verify @calcom/atoms installed
grep "@calcom/atoms" apps/web/package.json

# Verify environment variables
grep "CAL_" apps/web/.env.example

# Type check
pnpm typecheck

# Visual test (manual)
# Visit /home and verify coaching widget renders (may show fallback without Cal.com credentials)
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-slug>/` (created in next phase)
- Research: `../research-library/context7-calcom.md`
- Existing coaching: `apps/web/app/home/(user)/coaching/` (if exists)
