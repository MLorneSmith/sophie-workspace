# Feature: Activity Feed Widget

## Description

Timeline-style widget component that displays the user's recent learning activities. Shows activity items with type-specific icons, formatted timestamps, and optional links to related content. Uses data from the activity aggregation loader (F1).

## User Story
**As a** learner using the dashboard
**I want to** see a visual timeline of my recent activities with icons
**So that** I can quickly understand what I've done and navigate to related content

## Acceptance Criteria

### Must Have
- [ ] Timeline component with vertical line and activity items
- [ ] Activity type icons and colors (lesson, quiz, assessment, presentation)
- [ ] Relative timestamps using date-fns (e.g., "2 hours ago")
- [ ] Clickable links to related content where applicable
- [ ] Empty state with engaging message when no activities
- [ ] Card wrapper with header "Recent Activity"
- [ ] Responsive design (mobile-friendly)

### Nice to Have
- [ ] Animated entry for activity items
- [ ] Hover effects on activity items

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | RecentActivityFeed component | New |
| **Logic** | Activity type icon mapping | New |
| **Data** | Uses activity loader from F1 | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Client component with server-fetched data

**Rationale**: Timeline visual requires client-side rendering for hover effects and interactivity. Data is fetched server-side by parent and passed as props. Follows established server/client component pattern from course dashboard.

### Key Architectural Choices
1. Client component with `use client` directive
2. Data passed as props from server component parent
3. Discriminated union for type-safe icon/color mapping
4. Tailwind CSS for timeline visual (border-left + absolute dots)

### Trade-offs Accepted
- No pagination/infinite scroll (spec limits to 10 items)
- No real-time updates (refresh required for new activities)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses data passed from parent | N/A |

> If no external credentials required, note "None required" below:
> Widget receives data as props - no direct data fetching required.

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs activity feed for empty state design

### Blocked By
- S2072.I3.F1 (Activity Aggregation Query) - needs activity data structure and loader
- S2072.I1.F3 (Dashboard Data Loader) - integration point for data
- S2072.I1.F2 (Responsive Grid Layout) - needs grid slot

### Parallel With
- S2072.I3.F3 (Kanban Summary Widget)
- S2072.I3.F4 (Quick Actions Panel)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/recent-activity-feed.tsx` - Activity feed component
- `apps/web/app/home/(user)/_components/activity-item.tsx` - Individual activity item

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add activity feed to dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Activity Types Import**: Import types from F1 activity loader
2. **Create Activity Item Component**: Icon, timestamp, title, link with type discrimination
3. **Create Timeline Visual**: Vertical line with dots using Tailwind
4. **Create Empty State**: Engaging message with illustration/icon
5. **Create Main Widget Component**: Card wrapper, header, activity list
6. **Integrate with Dashboard**: Add to grid layout in page.tsx

### Suggested Order
1. Create Activity Types Import (type safety)
2. Create Activity Item Component (building block)
3. Create Timeline Visual (styling)
4. Create Empty State (edge case)
5. Create Main Widget Component (assembly)
6. Integrate with Dashboard (connection)

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify activity feed renders with icons

# Component test (if created)
pnpm --filter web test -- --grep "activity-feed"
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` (list pattern)
- Research: `../../research-library/perplexity-dashboard-empty-states-ux.md` (empty states)
