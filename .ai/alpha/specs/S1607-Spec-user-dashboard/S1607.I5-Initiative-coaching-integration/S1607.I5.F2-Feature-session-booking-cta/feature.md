# Feature: Session Booking CTA

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I5 |
| **Feature ID** | S1607.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Implement the "Book a Session" call-to-action that allows users to schedule coaching sessions via Cal.com. This feature provides either an embedded Cal.com booking widget or a direct link to the Cal.com booking page. The CTA appears in the empty state when no sessions exist and as a secondary action when sessions are displayed.

## User Story
**As a** SlideHeroes user
**I want to** book a coaching session directly from my dashboard
**So that** I can easily schedule time with my coach without leaving the app

## Acceptance Criteria

### Must Have
- [ ] "Book a Session" button opens Cal.com booking flow
- [ ] Booking CTA visible in empty state (primary action)
- [ ] Booking CTA visible in sessions view (secondary action)
- [ ] Cal.com booking page/embed loads correctly
- [ ] Fallback to external link if embed fails to load

### Nice to Have
- [ ] Cal.com embed widget opens in modal/sheet
- [ ] Pre-fill user email in booking form
- [ ] Success toast when booking is confirmed (via Cal.com callback)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | BookSessionButton component | New |
| **UI** | Cal.com embed integration | New |
| **Logic** | Cal.com URL/embed configuration | New |
| **Data** | Environment variables for Cal.com | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Start with simple external link to Cal.com booking page. The Cal.com embed widget requires additional JavaScript and may have loading issues. A simple link provides reliable booking while embed can be added as enhancement.

### Key Architectural Choices
1. Primary implementation: External link to Cal.com booking page (`window.open` or `Link`)
2. Optional enhancement: Cal.com embed script for in-app booking modal
3. Environment variable for Cal.com booking URL (configurable per environment)
4. Use existing Button component with appropriate styling

### Trade-offs Accepted
- External link takes user out of app (vs embed keeping them in)
- No real-time booking confirmation in dashboard (webhook feature is out of scope)
- Simple implementation prioritized over feature-rich embed

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Primary CTA button | Button | @kit/ui/button | Standard button with `variant="default"` |
| Secondary CTA | Button | @kit/ui/button | `variant="outline"` for sessions view |
| Modal (if embed) | Dialog | @kit/ui/dialog | Existing dialog component |
| External link icon | ExternalLink | lucide-react | Indicates link opens new tab |
| Calendar icon | CalendarPlus | lucide-react | Booking action affordance |

**Components to Install**: None - all required components exist

## Dependencies

### Blocks
- F3: Upcoming Sessions Display (reuses booking button component)

### Blocked By
- F1: Coaching Widget Foundation (provides empty state container)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/book-session-button.tsx` - Booking CTA component
- `apps/web/lib/calcom/config.ts` - Cal.com configuration (URL, event type)

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-sessions-empty-state.tsx` - Replace placeholder with real CTA
- `apps/web/.env.example` - Add CALCOM_BOOKING_URL variable
- `apps/web/.env.development` - Add local Cal.com booking URL

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Cal.com config**: Environment variables and config file for booking URL
2. **Build BookSessionButton**: Button component that opens Cal.com booking
3. **Update empty state**: Replace placeholder CTA with BookSessionButton
4. **Add environment variables**: Document and set up Cal.com URL configuration
5. **Write integration test**: E2E test that clicks button and verifies Cal.com opens

### Suggested Order
1. Config → 2. BookSessionButton → 3. Update Empty State → 4. Env vars → 5. Tests

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Verify CTA renders in empty state
# Manual: Navigate to /home with no sessions, verify "Book a Session" button appears

# Verify booking flow
# Manual: Click "Book a Session", verify Cal.com booking page opens

# Verify fallback
# Manual: Test with invalid Cal.com URL, verify graceful error handling

# Run unit tests
pnpm --filter web test:unit -- --grep "BookSessionButton"
```

## Related Files
- Initiative: `../initiative.md`
- F1 Empty State: `../S1607.I5.F1-Feature-coaching-widget-foundation/feature.md`
- Cal.com Embed Docs: https://cal.com/docs/embed
- Button component: `packages/ui/src/shadcn/button.tsx`
