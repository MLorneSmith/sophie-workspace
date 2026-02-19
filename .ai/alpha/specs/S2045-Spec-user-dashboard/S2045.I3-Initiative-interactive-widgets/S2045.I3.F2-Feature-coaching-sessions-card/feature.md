# Feature: Coaching Sessions Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I3 |
| **Feature ID** | S2045.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Build a compact Coaching Sessions Card widget for Row 2 of the dashboard that embeds a Cal.com booking widget via iframe. Includes a "View Full Calendar" link to the existing `/home/coaching` page. Reuses the proven iframe pattern from the coaching page's `calendar.tsx` component in a smaller, card-sized form factor.

## User Story
**As a** SlideHeroes user
**I want to** see a coaching booking widget directly on my dashboard
**So that** I can schedule a session without navigating away from my overview page

## Acceptance Criteria

### Must Have
- [ ] Card wrapper with "Coaching Sessions" title and CardDescription
- [ ] Compact Cal.com iframe embed using `https://cal.com/{username}/{event-slug}?embed=true`
- [ ] iframe uses `NEXT_PUBLIC_CALCOM_COACH_USERNAME` and `NEXT_PUBLIC_CALCOM_EVENT_SLUG` env vars
- [ ] Reduced height (350-400px) compared to full coaching page (600px+)
- [ ] "View Full Calendar" link in CardFooter linking to `/home/coaching`
- [ ] `loading="lazy"` attribute on iframe for performance
- [ ] Dark mode support via semantic color classes
- [ ] Wired to dashboard grid layout (Row 2, position 3)

### Nice to Have
- [ ] `data-testid="coaching-sessions-card"` on Card wrapper
- [ ] Subtle rounded corners on iframe container

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `coaching-sessions-card.tsx` (Card + iframe) | New |
| **Logic** | Env var reading for Cal.com URL construction | New (minimal) |
| **Data** | N/A (iframe handles its own data) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal
**Rationale**: The Cal.com iframe is self-contained — it handles its own UI, booking flow, and data. Our component just needs a Card wrapper with the iframe and a link. No server-side data fetching needed. This is the simplest widget in the initiative.

### Key Architectural Choices
1. Server Component (no client interactivity needed — iframe handles everything)
2. Read env vars at render time for Cal.com URL construction
3. Use same `embed=true` parameter as existing coaching page

### Trade-offs Accepted
- Limited styling control over iframe content (acceptable per Cal.com research)
- No programmatic access to booking events (V2 API integration deferred to v2)
- Compact size may clip some Cal.com UI elements (fallback: link to full page)

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | @kit/ui/card | Standard card pattern |
| Calendar link | Button (variant="link") | @kit/ui/button | Consistent with other widget CTAs |
| Calendar icon | CalendarDays | lucide-react | Visual indicator for coaching |

## Required Credentials
> Environment variables already configured in `.env`:

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach Cal.com username | `.env` (value: `slideheroes.com`) |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug | `.env` (value: `60min`) |

> `CALCOM_API_KEY` exists but is NOT needed for this feature (embed only, no V2 API).

## Dependencies

### Blocks
- None

### Blocked By
- S2045.I1.F1: Needs dashboard page shell and grid layout

### Parallel With
- F1 (Presentations Table), F3 (Quick Actions Panel), F4 (Activity Feed)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/coaching-sessions-card.tsx` - Compact Cal.com embed card

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add CoachingSessionsCard to Row 2, position 3

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CoachingSessionsCard component**: Server component with Card wrapper, compact iframe (350px height), env var URL, lazy loading
2. **Wire to dashboard page**: Import and place in Row 2, position 3 of grid
3. **Add i18n keys**: Translation keys for card title, description, and "View Full Calendar" link

### Suggested Order
T1 (component) → T2 (wire to page) → T3 (i18n)

## Validation Commands
```bash
pnpm typecheck
pnpm lint
grep -c "coaching" apps/web/app/home/\(user\)/_components/dashboard/coaching-sessions-card.tsx
grep -c "cal.com" apps/web/app/home/\(user\)/_components/dashboard/coaching-sessions-card.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Existing Cal.com iframe: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
- Cal.com research: `../../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- Coaching page: `apps/web/app/home/(user)/coaching/page.tsx`
