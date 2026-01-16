# Feature: Activity Feed Component

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1365 |
| **Feature ID** | 1365-F3 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 3 |

## Description
Build the Activity Feed Timeline component for the dashboard. Displays the 10 most recent user activities with icons per activity type, relative timestamps, entity links, and proper empty state handling.

## User Story
**As a** user
**I want to** see my recent activity on the dashboard
**So that** I can track my progress and quickly navigate to recent work

## Acceptance Criteria

### Must Have
- [ ] Server component `ActivityFeedCard` displays in dashboard card format
- [ ] Loader fetches 10 most recent activities ordered by created_at DESC
- [ ] Each activity shows icon, title, relative timestamp (e.g., "2 hours ago")
- [ ] Activities link to relevant entity (lesson, presentation, etc.)
- [ ] Empty state shown when no activities exist
- [ ] Suspense boundary with skeleton loader for progressive rendering
- [ ] i18n translations for all text

### Nice to Have
- [ ] Hover effects on activity items
- [ ] Tooltip showing exact timestamp on relative time
- [ ] Color-coded icons per activity type

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ActivityFeedCard, ActivityFeedItem, ActivityFeedEmpty | New |
| **Logic** | Relative time formatting, entity link mapping | New |
| **Data** | activity-feed.loader.ts with React.cache | New |
| **Database** | Queries user_activities table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Server-first rendering for performance; minimal client interactivity only where needed (hover effects); follow existing dashboard card patterns.

### Key Architectural Choices
1. **Server Component Pattern**: ActivityFeedCard is async server component with loader
2. **Client Interactivity**: ActivityFeedItem uses 'use client' for hover effects and dynamic time
3. **ScrollArea**: Fixed 400px height with scroll for consistent dashboard layout
4. **Icon Mapping**: Dedicated Lucide icons per activity type for visual hierarchy

### Trade-offs Accepted
- Relative time requires page navigation to update (acceptable vs real-time complexity)
- Limited to 10 items without pagination (acceptable for MVP; pagination can be added later)

## Dependencies

### Blocks
- None (end feature in this chain)

### Blocked By
- F2: Activity Recording Service (needs activities to display)

### Parallel With
- F4: Kanban Summary Card (both can develop UI in parallel after their deps)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/activity-feed.loader.ts` - Data loader
- `apps/web/app/home/(user)/_components/activity-feed-card.tsx` - Main server component
- `apps/web/app/home/(user)/_components/activity-feed-item.tsx` - Client component for items
- `apps/web/app/home/(user)/_components/activity-feed-empty.tsx` - Empty state
- `apps/web/app/home/(user)/_components/activity-feed-skeleton.tsx` - Loading skeleton

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add ActivityFeedCard to dashboard
- `apps/web/public/locales/en/common.json` - Add activity feed translations

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Loader**: activity-feed.loader.ts with React.cache wrapper
2. **Create Card Component**: ActivityFeedCard server component
3. **Create Item Component**: ActivityFeedItem with icons and relative time
4. **Create Empty State**: ActivityFeedEmpty with icon and CTA
5. **Create Skeleton**: ActivityFeedSkeleton for loading state
6. **Add Translations**: i18n keys for activity feed text
7. **Integrate into Dashboard**: Add to page.tsx with Suspense
8. **Write Unit Tests**: Test relative time formatting, entity link mapping

### Suggested Order
Loader → Card → Item → Empty → Skeleton → Translations → Integration → Tests

## Validation Commands
```bash
# Verify component renders
pnpm dev
# Navigate to /home/[account] and check activity feed card

# Run unit tests
pnpm --filter web test:unit -- activity-feed

# Verify typecheck
pnpm typecheck

# Run linter
pnpm lint:fix

# Accessibility audit
# Use browser dev tools Lighthouse accessibility audit
```

## Related Files
- Initiative: `../initiative.md`
- Feature F2: `../pending-Feature-activity-recording-service/feature.md`
- Research: `../../research-library/perplexity-dashboard-design-patterns.md` (Activity Feed section)
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
