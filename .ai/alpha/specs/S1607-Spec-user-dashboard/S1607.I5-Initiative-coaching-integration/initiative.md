# Initiative: Coaching Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1607 |
| **Initiative ID** | S1607.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 3-4 |
| **Priority** | 5 |

---

## Description
Integrate Cal.com for coaching session booking and upcoming session display. When sessions are booked, show the next 1-2 upcoming sessions with date/time, join link, and reschedule option. When no sessions exist, display a CTA to book via Cal.com's embed widget or direct link.

## Business Value
Coaching sessions are a premium feature that drive user engagement and retention. Surfacing upcoming sessions on the dashboard increases attendance rates and reminds users of their commitment. Easy booking access reduces friction and increases conversion to booked sessions.

---

## Scope

### In Scope
- [x] Coaching Sessions Widget card
- [x] Display next 1-2 upcoming sessions (date, time, join link)
- [x] Reschedule button linking to Cal.com
- [x] "Book a Session" CTA when no sessions booked
- [x] Cal.com API research/integration for fetching upcoming sessions
- [x] Cal.com embed widget or external link for booking
- [x] Fallback UI if Cal.com is unavailable
- [x] Empty state with compelling CTA
- [x] Loading skeleton

### Out of Scope
- [ ] In-app video conferencing (uses Cal.com's external links)
- [ ] Session history (past sessions)
- [ ] Coach selection (uses default booking page)
- [ ] Custom booking form fields

---

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation & Data Layer (provides page structure and loader)

### Parallel With
- S1607.I2: Progress & Assessment Visualization
- S1607.I3: Task & Activity Awareness
- S1607.I4: Quick Actions & Presentations

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | External API integration with Cal.com |
| External dependencies | High | Cal.com API availability, embed requirements |
| Unknowns | High | Cal.com API capabilities need research spike |
| Reuse potential | Low | Custom integration specific to coaching |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Cal.com API Spike**: Research Cal.com embed and API capabilities
2. **Coaching Widget Shell**: Card structure with loading/empty states
3. **Upcoming Sessions Display**: Fetch and display booked sessions
4. **Booking Integration**: Embed widget or link to Cal.com booking page

### Suggested Order
1. Cal.com API Spike (research before implementation)
2. Coaching Widget Shell (UI structure independent of API)
3. Booking Integration (simpler - just a link/embed)
4. Upcoming Sessions Display (requires API integration)

---

## Validation Commands
```bash
# Verify Coaching Widget renders
# Manual: Navigate to /home, verify coaching card appears

# Verify "Book Session" CTA works
# Manual: Click booking CTA, verify Cal.com page/embed opens

# Verify upcoming sessions display (if Cal.com API works)
# Manual: Book a session, return to dashboard, verify it shows

# Verify fallback UI
# Manual: Disable network/mock Cal.com failure, verify graceful fallback

# TypeScript validation
pnpm --filter web typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../S1607.I1-Initiative-dashboard-foundation/`
- External: [Cal.com Embed Documentation](https://cal.com/docs/embed)
- External: [Cal.com API Documentation](https://cal.com/docs/api-reference)

---

## Risk Mitigation

### R1: Cal.com API May Not Support Required Features
**Mitigation**: Implement as spike first. If API is insufficient, fall back to simple "Book on Cal.com" link with no upcoming session display.

### R2: Cal.com Embed May Not Load
**Mitigation**: Design fallback UI that shows direct link to Cal.com booking page with clear instructions.

### R3: Cal.com Rate Limits
**Mitigation**: Cache upcoming sessions data; only refresh on page load (no real-time polling).
