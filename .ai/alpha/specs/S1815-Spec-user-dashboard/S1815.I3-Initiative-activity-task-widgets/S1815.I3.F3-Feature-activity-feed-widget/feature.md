# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I3 |
| **Feature ID** | S1815.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
A dashboard widget that displays a timeline of the user's recent activities including quiz completions, lesson progress, and presentation updates. Uses relative timestamps ("2 hours ago") and activity-type icons to create a sense of momentum and progress visibility.

## User Story
**As a** presentation learner using SlideHeroes
**I want to** see a timeline of my recent activities on my dashboard
**So that** I can feel a sense of progress and remember what I've accomplished recently

## Acceptance Criteria

### Must Have
- [ ] Display 5-7 most recent activities in a vertical timeline layout
- [ ] Show activity type icon (quiz, lesson, presentation) per item
- [ ] Display relative timestamps ("2 hours ago", "Yesterday")
- [ ] Activity title or description (e.g., "Completed quiz: Storytelling Basics")
- [ ] Widget skeleton loading state during data fetch
- [ ] Empty state for new users with no activity history
- [ ] "View All" link (optional, can link to activity page if exists)

### Nice to Have
- [ ] Click activity to navigate to relevant page
- [ ] Activity type color coding

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `ActivityFeedWidget` component | New |
| **Logic** | Relative time formatting | New (formatDistanceToNow) |
| **Data** | Consumes `loadRecentActivity()` from F2 | Existing (from F2) |
| **Database** | N/A (uses F2 aggregation) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple vertical list layout following UX research recommendations (5-7 items per view). Use date-fns for relative time formatting. Server Component with data from dashboard loader.

### Key Architectural Choices
1. Server Component for initial render (no client-side state)
2. Use date-fns `formatDistanceToNow` for relative timestamps
3. Activity type to icon mapping via simple lookup object
4. Single-column vertical layout per UX research best practices

### Trade-offs Accepted
- Static display (no infinite scroll or pagination for v1)
- Generic fallback text if activity enrichment fails

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget card | Card | @kit/ui/card | Consistent dashboard card pattern |
| Timeline item | Custom | New | Vertical timeline with icon, title, time |
| Icons | Lucide icons | lucide-react | Trophy (quiz), BookOpen (lesson), FileText (presentation) |
| Empty state | EmptyState | @kit/ui/empty-state | Consistent empty state UI |
| Loading | Skeleton | @kit/ui/skeleton | Consistent loading pattern |
| Relative time | formatDistanceToNow | date-fns | Standard relative time formatting |

## Required Credentials
None required - consumes data from F2 activity aggregation layer.

## Dependencies

### Blocks
- None

### Blocked By
- S1815.I1: Dashboard Foundation (provides grid layout, dashboard types)
- F2: Activity Data Aggregation (provides activity data)

### Parallel With
- F1: Kanban Summary Widget (UI development can proceed in parallel)
- F4: Quick Actions Panel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widgets/activity-feed-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_components/widgets/activity-feed-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_lib/utils/activity-icons.ts` - Activity type to icon mapping
- `apps/web/app/home/(user)/_lib/utils/format-activity-time.ts` - Relative time formatter

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Include widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create activity icon mapping**: Map activity types to Lucide icons
2. **Create relative time formatter**: Wrapper around date-fns formatDistanceToNow
3. **Create activity feed skeleton**: Loading state component
4. **Create activity feed item**: Single timeline item component
5. **Create activity feed widget**: Main widget with timeline layout
6. **Create empty state**: Handle users with no activity
7. **Integrate into dashboard**: Add to dashboard page grid

### Suggested Order
1. Icon mapping and time formatter (utilities)
2. Skeleton component
3. Activity item component
4. Main widget component
5. Empty state handling
6. Dashboard integration

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Manual testing
pnpm dev
# Navigate to /home as authenticated user with activity history
# Verify activity feed displays correctly with icons and times
# Verify empty state for new user
# Verify responsive layout on mobile
```

## Design Reference

Per UX research (perplexity-dashboard-ux.md):
- Single-column, mobile-first layout
- 5-7 items per view
- Visual hierarchy with icons and bold activity names
- Generous whitespace for readability
- Progressive disclosure (keep items concise)

## Related Files
- Initiative: `../initiative.md`
- Dependency: `../*F2*/feature.md` - Activity data aggregation
- Reference: Research `../../research-library/perplexity-dashboard-ux.md` - UX best practices
- Tasks: `./tasks.json` (created in next phase)
