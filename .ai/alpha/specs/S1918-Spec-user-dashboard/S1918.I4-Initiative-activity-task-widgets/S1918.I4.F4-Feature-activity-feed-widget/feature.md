# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I4 |
| **Feature ID** | S1918.I4.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
A widget displaying a timeline of the user's recent activities across the platform. Aggregates events from multiple sources: lesson completions, quiz passes, presentation updates, and assessment completions. Shows the last 5-8 activities with timestamps and activity-specific icons.

## User Story
**As a** learner
**I want to** see my recent activity across all features in one place
**So that** I feel a sense of progress and can recall what I worked on recently

## Acceptance Criteria

### Must Have
- [ ] Widget displays in dashboard grid slot (left column, row 2)
- [ ] Shows last 5-8 activities sorted by timestamp (most recent first)
- [ ] Activity types supported:
  - Lesson completed (from lesson_progress)
  - Quiz passed (from quiz_attempts where passed=true)
  - Presentation created/updated (from building_blocks_submissions)
  - Assessment completed (from survey_responses)
- [ ] Each activity shows: icon, description, relative timestamp ("2 hours ago")
- [ ] Activities link to relevant pages when clicked
- [ ] Empty state: "Your activity will appear here as you progress" with "Start Course" CTA

### Nice to Have
- [ ] Activity type filtering
- [ ] Load more / infinite scroll
- [ ] Activity detail expansion on click

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `activity-feed-widget.tsx` | New |
| **Logic** | Activity normalization and sorting | New |
| **Data** | Aggregated from dashboard loader | New query pattern |
| **Database** | lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Most complex widget in I4 due to multi-source aggregation. Dashboard loader (I2) handles the aggregation query, widget receives normalized ActivityItem[] array. Use parallel queries in loader with UNION or in-memory merge.

### Key Architectural Choices
1. Normalized ActivityItem type with common fields (id, type, title, timestamp, link)
2. Server component receives pre-aggregated, sorted activity array
3. In-memory aggregation in loader (simpler than PostgreSQL UNION for 4 different table schemas)
4. Limit to 10 items in loader for performance

### Trade-offs Accepted
- In-memory aggregation limits scalability (acceptable for <1000 items per source)
- No real-time updates (page refresh required)
- Fixed limit (10 items) - no pagination on dashboard

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card, CardHeader, CardContent | shadcn/ui | Consistent dashboard widget |
| Timeline | Custom vertical list | Custom | Simple timeline, no library needed |
| Activity Icon | Lucide icons per type | lucide-react | Visual activity differentiation |
| Timestamp | Custom with date-fns formatDistanceToNow | date-fns | Relative time display |
| Empty State | Custom with Button CTA | Custom | Match empty state patterns |

**Components to Install**: None required (date-fns already installed)

## Required Credentials
> Environment variables required for this feature to function.

None required - uses only internal database data.

## Dependencies

### Blocks
- S1918.I6: Polish (needs activity feed for skeleton/error states)

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (provides grid slot)
- S1918.I2.F1: Dashboard Types (provides ActivityItem type)
- S1918.I2.F2: Dashboard Loader (provides activity aggregation query)
- S1918.I2.F3: Activity Aggregation (provides aggregated activity data)

### Parallel With
- F2: Kanban Summary (independent widget)
- F3: Presentations Table (independent widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create ActivityItem type**: Define normalized interface (id, type, title, description, timestamp, link)
2. **Create activity type icons map**: Map activity types to Lucide icons
3. **Create activity-feed-widget.tsx**: Build timeline component
4. **Add relative time formatting**: Use date-fns formatDistanceToNow
5. **Add empty state**: Handle zero activities gracefully
6. **Integrate with dashboard page**: Place in grid and connect to loader data

### Suggested Order
1. Types + Icons Map → 2. Component → 3. Time Formatting → 4. Empty State → 5. Integration

## Validation Commands
```bash
# Verify widget file exists
test -f apps/web/app/home/\(user\)/_components/activity-feed-widget.tsx && echo "✓ Activity feed widget exists"

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Reference: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
- Pattern: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (timeline example)
