# Feature: Activity Feed Timeline

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I4 |
| **Feature ID** | S1890.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 3 |

## Description
Create the Recent Activity Feed widget that displays a timeline of user actions over the last 30 days. Shows lesson completions, quiz attempts, presentation updates, and assessment completions with relative timestamps and visual type indicators.

## User Story
**As a** SlideHeroes learner
**I want to** see my recent activity on the dashboard
**So that** I can track my progress and feel a sense of accomplishment from visible activity history

## Acceptance Criteria

### Must Have
- [ ] Display activity timeline with most recent first
- [ ] Show activity type with badge/icon (lesson, quiz, presentation, assessment)
- [ ] Show relative timestamps (e.g., "2 hours ago", "Yesterday")
- [ ] Display activity-specific details (quiz score, lesson name, presentation title)
- [ ] Scrollable feed within fixed-height card
- [ ] "Show more" button for pagination (load additional items)
- [ ] Empty state when no activity in last 30 days
- [ ] Responsive layout for mobile/tablet/desktop

### Nice to Have
- [ ] Activity type color coding (different badge colors)
- [ ] Link to relevant pages (lesson, presentation, etc.)
- [ ] Activity count badge in header

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `recent-activity-feed.tsx` | New |
| **Logic** | Consume activity loader | New (F2) |
| **Data** | Activity aggregation | New (F2) |
| **Database** | Multiple tables via F2 | Existing |

## Architecture Decision

**Approach**: Pragmatic - Server Component with client interactivity
**Rationale**: Initial render as Server Component for fast LCP, with client-side "Show more" for pagination. Use existing timeAgo() pattern from notifications for relative timestamps.

### Key Architectural Choices
1. Server Component wrapper fetching initial activity via loader (F2)
2. Client component for interactive "Show more" button
3. Reuse `timeAgo()` pattern from notifications feature
4. ScrollArea for fixed-height scrollable feed
5. Badge variants for activity type differentiation

### Trade-offs Accepted
- No real-time updates (v1 uses manual refresh) - acceptable per initiative scope
- No activity filtering (v1 shows all types) - acceptable for initial version

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card, CardHeader, CardContent, CardFooter | @kit/ui/card | Standard dashboard card |
| Scroll container | ScrollArea | @kit/ui/scroll-area | Fixed-height scrollable feed |
| Activity type badge | Badge with variants | @kit/ui/badge | Visual type differentiation |
| Relative time | timeAgo() utility | packages/features/notifications | Proven i18n-aware implementation |
| Activity icons | Lucide icons | lucide-react | CheckCircle, Trophy, Edit, ClipboardCheck |
| Show more button | Button variant="ghost" | @kit/ui/button | Consistent pagination pattern |
| Empty state | Custom with icon | Tailwind | Match empty state research patterns |
| Separator | Separator | @kit/ui/separator | Visual separation between items |

**Components to Install**: None - all needed components exist

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | All data from F2 activity loader | N/A |

> No external credentials required - consumes data from F2.

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure for empty state design)

### Blocked By
- F2: Activity Aggregation Query (provides activity data)
- S1890.I1.F1: Dashboard Page & Grid (provides layout container)

### Parallel With
- None (depends on F2 completion)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/recent-activity-feed.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/activity-item.tsx` - Individual activity item component
- `apps/web/app/home/(user)/_lib/client/hooks/use-activity-feed.ts` - Client hook for pagination (optional)
- `apps/web/public/locales/en/dashboard.json` - Add i18n keys for activity types

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in grid (after I1/I2)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create RecentActivityFeed component skeleton**: Set up component with Card structure
2. **Implement ActivityItem component**: Single activity display with type, details, time
3. **Add activity type icons and badges**: Map activity types to icons and badge variants
4. **Integrate timeAgo utility**: Import or adapt from notifications feature
5. **Connect to activity loader**: Wire up server-side data fetching
6. **Add ScrollArea for fixed height**: Implement scrollable feed container
7. **Implement "Show more" pagination**: Client-side load more functionality
8. **Build empty state UI**: Contextual empty state per research
9. **Add i18n translations**: Activity type labels, empty state text
10. **Write component tests**: Test rendering, pagination, empty states

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

## Validation Commands
```bash
# Verify component exists
test -f apps/web/app/home/\(user\)/_components/recent-activity-feed.tsx && echo "✓ Component exists"

# Verify activity item exists
test -f apps/web/app/home/\(user\)/_components/activity-item.tsx && echo "✓ Activity item exists"

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Visual verification (after integration with page)
# pnpm --filter web-e2e test:local -- -g "dashboard activity"
```

## Related Files
- Initiative: `../initiative.md`
- F2 Activity Loader: `apps/web/app/home/(user)/_lib/server/activity-feed.loader.ts`
- timeAgo utility: `packages/features/notifications/src/components/notifications-popover.tsx`
- ScrollArea component: `packages/ui/src/shadcn/scroll-area.tsx`
- Empty state research: `../../../research-library/perplexity-dashboard-empty-states.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)

## UI Design Notes

### Activity Item Layout
```
┌──────────────────────────────────────────────────┐
│ 🎓  Completed lesson "Storytelling Basics"       │
│     badge    description                          │
│     2 hours ago                                   │
│     timestamp                                     │
├──────────────────────────────────────────────────┤
│ 🏆  Scored 85% on "Module 1 Quiz"                │
│     badge    description                          │
│     Yesterday                                     │
│     timestamp                                     │
├──────────────────────────────────────────────────┤
│ ...more items...                                  │
└──────────────────────────────────────────────────┘
```

### Activity Type Mapping
| Type | Icon | Badge Variant | Display Text |
|------|------|---------------|--------------|
| lesson_completion | CheckCircle | success | "Completed lesson {title}" |
| quiz_attempt (passed) | Trophy | success | "Scored {score}% on {title}" |
| quiz_attempt (failed) | XCircle | destructive | "Scored {score}% on {title}" |
| presentation_update | Edit | info | "Updated presentation {title}" |
| survey_completion | ClipboardCheck | secondary | "Completed skills assessment" |

### Empty State Design
Following research best practices:
- Relevant icon (Calendar or Activity)
- Specific message: "No recent activity"
- Educational context: "Complete lessons, take quizzes, or create presentations to see your activity here."
- Single CTA: "Start Learning" → course page
