# Feature: Booking Embed Fallback

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I6 |
| **Feature ID** | S1890.I6.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
When no upcoming coaching sessions exist, display a "Book a Session" call-to-action with an embedded Cal.com booking widget using iframe. This provides a seamless booking experience directly from the dashboard without navigating to the coaching page.

## User Story
**As a** SlideHeroes user without upcoming coaching sessions
**I want to** see a booking option on my dashboard
**So that** I can easily schedule a coaching session without extra navigation

## Acceptance Criteria

### Must Have
- [ ] Detect when user has no upcoming sessions (from F1/F2)
- [ ] Display "Book a Session" CTA card in widget space
- [ ] Embed Cal.com booking widget using iframe on CTA click
- [ ] Modal or expandable view for the booking iframe
- [ ] Maintain consistent card styling with other dashboard widgets
- [ ] Handle case when API fails (show booking CTA as fallback)

### Nice to Have
- [ ] Inline embed option (no modal)
- [ ] Pre-fill user email in booking form

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `booking-cta-card.tsx` - CTA card component | New |
| **UI** | `booking-embed-modal.tsx` - Modal with iframe | New |
| **Logic** | Conditional rendering based on session count | New |
| **Data** | Existing session data from F2 | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse existing iframe pattern from `apps/web/app/home/(user)/coaching/_components/calendar.tsx`. Add modal wrapper for better UX. Keep implementation simple - iframe is the most stable Cal.com embed method per research.

### Key Architectural Choices
1. Use existing iframe embed approach (proven stable in codebase)
2. Dialog component from shadcn/ui for modal
3. Conditional rendering in parent widget based on session count
4. Graceful degradation: API failure → show booking CTA

### Trade-offs Accepted
- Limited styling control with iframe embed
- No programmatic booking event callbacks
- Modal requires extra click (vs inline embed)

## Required Credentials
> Environment variables required for this feature to function.

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach username for embed URL | Cal.com account |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug for embed URL | Cal.com event settings |

> **Note**: Uses existing public credentials for client-side iframe.

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure for empty state styling)

### Blocked By
- F2: Coaching Sessions Widget (needs session data to determine fallback)
- S1890.I1.F1: Dashboard Page & Grid (needs grid layout container)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/booking-cta-card.tsx` - CTA card
- `apps/web/app/home/(user)/_components/booking-embed-modal.tsx` - Modal with iframe

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add conditional fallback

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create BookingCtaCard component**: Card with "Book a Session" button
2. **Create BookingEmbedModal component**: Dialog with iframe embed
3. **Integrate conditional rendering**: Show CTA when no sessions or API error
4. **Add client-side interactivity**: Modal open/close state
5. **Style consistency**: Match dashboard widget styling

### Suggested Order
T1: CTA card → T2: Modal with iframe → T3: Conditional logic → T4: Integration

## Validation Commands
```bash
# Verify CTA card exists
test -f apps/web/app/home/\(user\)/_components/booking-cta-card.tsx && echo "✓ CTA card exists"

# Check for iframe embed
grep -q "iframe" apps/web/app/home/\(user\)/_components/booking-embed-modal.tsx && echo "✓ Iframe embed"

# Check for Dialog usage
grep -q "Dialog" apps/web/app/home/\(user\)/_components/booking-embed-modal.tsx && echo "✓ Modal dialog"

# Verify conditional rendering
grep -q "sessions.length" apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "✓ Conditional logic"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Existing iframe: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
- Dialog component: `packages/ui/src/shadcn/dialog.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)

## Cal.com Embed Reference
```tsx
// Embed URL format
const embedUrl = `https://cal.com/${process.env.NEXT_PUBLIC_CALCOM_COACH_USERNAME}/${process.env.NEXT_PUBLIC_CALCOM_EVENT_SLUG}?embed=true&layout=month_view`;
```

## UI Component Reference
| Component | Source | Purpose |
|-----------|--------|---------|
| Card, CardContent, CardHeader | @kit/ui/card | CTA container |
| Button | @kit/ui/button | Book session action |
| Dialog, DialogContent, DialogTrigger | @kit/ui/dialog | Modal wrapper |
