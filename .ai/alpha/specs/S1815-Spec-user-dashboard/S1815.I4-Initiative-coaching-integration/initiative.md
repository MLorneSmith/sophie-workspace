# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1815 |
| **Initiative ID** | S1815.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 3-4 |
| **Priority** | 4 |

---

## Description
Implement the coaching sessions widget with Cal.com integration. Display upcoming coaching sessions with join/reschedule options, or show a booking CTA if no sessions are scheduled. This is the highest-risk initiative due to external API dependency.

## Business Value
Coaching session attendance is a key success metric (goal: +20% improvement). Surfacing sessions directly on the dashboard reduces missed appointments and friction to join. Booking CTA conversion drives premium feature adoption.

---

## Scope

### In Scope
- [x] Coaching Sessions Widget
  - Display next upcoming session (date, time, coach name)
  - "Join" button linking to meeting URL
  - "Reschedule" button opening reschedule modal
  - Display following session if available
- [x] Cal.com Integration (Free Embed Approach)
  - Use Cal.com free iframe/popup embed (no @calcom/atoms - Platform deprecated)
  - Generate embed URLs for booking and rescheduling
  - Use postMessage events for completion detection
  - No API key or OAuth required
- [x] Empty State
  - No sessions scheduled → Show booking CTA
  - Booker component embedded or modal
- [x] Graceful Degradation
  - Handle Cal.com API unavailability
  - Show error state with retry option
  - Cache booking data for resilience
- [x] Widget-specific loading skeleton

### Out of Scope
- [ ] Cancellation functionality (just reschedule)
- [ ] Full booking calendar view
- [ ] Webhook integration for real-time updates
- [ ] Coach profile display
- [ ] Session notes or history

---

## Dependencies

### Blocks
- None (this widget is a leaf component)

### Blocked By
- S1815.I1: Dashboard Foundation (provides grid layout, types, and loader)

### Parallel With
- S1815.I2: Progress & Assessment Widgets
- S1815.I3: Activity & Task Widgets

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | New external dependency; multiple Cal.com components; auth flow |
| External dependencies | High | Cal.com API availability; `@calcom/atoms` package |
| Unknowns | High | Coach username configuration; event type slug; API rate limits |
| Reuse potential | Low | Cal.com-specific code; minimal reuse outside this widget |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com Foundation**: Install `@calcom/atoms`, configure provider, set up environment variables
2. **Dashboard Widget**: Implement coaching widget with booking display and actions
3. **Session Actions**: Join meeting and reschedule functionality with modal/redirect handling

### Suggested Order
1. Cal.com Foundation first (unblocks all Cal.com functionality)
2. Dashboard Widget second (displays bookings, implements empty state with Booker)
3. Session Actions third (adds join/reschedule interactive features)

### Risks & Mitigations
| Risk | Probability | Mitigation |
|------|-------------|------------|
| Cal.com API downtime | Medium | Graceful error state; cache last known bookings |
| API rate limits | Low | Client-side caching; debounce refresh calls |
| Package version incompatibility | Low | Lock version; test in isolation first |
| Coach username not configured | Medium | Environment variable with fallback; clear error message |

---

## Validation Commands
```bash
# Verify Cal.com package installs
pnpm add @calcom/atoms
pnpm typecheck

# Test widget renders
pnpm dev
# Navigate to /home with Cal.com configured

# Test booking flow
# Click booking CTA and complete booking
# Verify session appears in widget

# Test join functionality
# Verify meetingUrl opens correctly

# Test reschedule flow
# Click reschedule and verify modal/redirect works

# Test error handling
# Disable network and verify graceful degradation
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Research: `../research-library/context7-calcom.md`
- Config: Environment variables for Cal.com credentials
