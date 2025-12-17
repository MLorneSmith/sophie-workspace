# Feature Set: User Dashboard at /home

## Overview

| Field | Value |
|-------|-------|
| **Initiative** | Create a user dashboard at /home with 7 main components |
| **Slug** | user-dashboard-home |
| **Status** | pending-approval |
| **Created** | 2025-12-16 |
| **Total Features** | 7 |
| **Total Phases** | 3 |
| **Estimated Effort** | Large (multi-sprint) |

## Initiative Description

Create a user dashboard at /home with 7 main components: Course progress radial progress graph, Spider diagram from self assessment survey, Kanban Summary Card, Recent Activity Feed, Quick Actions Panel, Book/Upcoming Coaching Sessions, and Presentation outline table. Three components in first row, three in second row, and Presentation outline table as full third row.

## Dashboard Layout

```
+------------------+------------------+------------------+
| Course Progress  | Assessment       | Kanban Summary   |
| (Radial Graph)   | (Spider Diagram) | Card             |
+------------------+------------------+------------------+
| Recent Activity  | Quick Actions    | Coaching         |
| Feed             | Panel            | Sessions         |
+------------------+------------------+------------------+
| Presentation Outline Table (Full Width)                |
+--------------------------------------------------------+
```

## Technology Stack (from Research)

- **Charts**: shadcn/ui charts (Recharts-based)
- **Layout**: CSS Grid with responsive breakpoints
- **Data Fetching**: Server Components with parallel fetching (Promise.all)
- **Caching**: React cache() for request deduplication
- **Components**: Existing RadialProgress, RadarChart can be reused

## Feature Decomposition

### Phase 1: Foundation (Features 1-2)

| # | Feature | Description | Effort | Dependencies |
|---|---------|-------------|--------|--------------|
| 1 | Dashboard Layout & Data Loading | Page structure, CSS grid layout, parallel data loader | M | None |
| 2 | Course Progress Card | Radial progress graph with lesson/quiz stats | S | Feature 1 |

### Phase 2: Core Components (Features 3-5)

| # | Feature | Description | Effort | Dependencies |
|---|---------|-------------|--------|--------------|
| 3 | Assessment Spider Diagram | RadarChart with category scores from survey | S | Feature 1 |
| 4 | Kanban Summary Card | Task counts by status, current/next task display | S | Feature 1 |
| 5 | Activity Feed & Quick Actions | Combined: activity list + contextual CTAs | M | Feature 1 |

### Phase 3: Integration (Features 6-7)

| # | Feature | Description | Effort | Dependencies |
|---|---------|-------------|--------|--------------|
| 6 | Coaching Sessions Card | Upcoming sessions from Cal.com, booking CTA | S | Feature 1 |
| 7 | Presentation Outline Table | Full-width table with phases and tasks | M | Feature 1, 4 |

## Dependency Graph

```
Feature 1 (Dashboard Layout)
    │
    ├──> Feature 2 (Course Progress)
    │
    ├──> Feature 3 (Assessment Spider)
    │
    ├──> Feature 4 (Kanban Summary) ──┐
    │                                 │
    ├──> Feature 5 (Activity/Actions) │
    │                                 │
    ├──> Feature 6 (Coaching)         │
    │                                 │
    └──> Feature 7 (Presentation) <───┘
```

## Feature Details

### Feature 1: Dashboard Layout & Data Loading

**Scope:**
- Create `/home/(user)/page.tsx` with CSS Grid layout (3-3-1 rows)
- Implement server-side data loader with parallel fetching
- Create empty card placeholders for all 7 components
- Add Suspense boundaries for progressive loading

**Files to Create/Modify:**
- `apps/web/app/home/(user)/page.tsx` (modify)
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts` (create)
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` (create)

**Data Sources:**
- course_progress
- lesson_progress
- quiz_attempts
- survey_responses
- tasks
- coaching sessions (Cal.com)

**Acceptance Criteria:**
- [ ] Grid layout displays correctly on desktop (3-3-1)
- [ ] Grid responsive on mobile (stacked cards)
- [ ] All data loaded in parallel via Promise.all
- [ ] Empty state cards render without errors

---

### Feature 2: Course Progress Card

**Scope:**
- Reuse existing RadialProgress component
- Display overall course completion percentage
- Show lesson count (completed/total)
- Show quiz average score
- Add link to course page

**Files to Create/Modify:**
- `apps/web/app/home/(user)/_components/course-progress-card.tsx` (create)

**Data Sources:**
- course_progress table
- lesson_progress table
- quiz_attempts table

**Acceptance Criteria:**
- [ ] Radial progress displays correctly (0-100%)
- [ ] Lesson count shows completed/total
- [ ] Quiz score shows average percentage
- [ ] Empty state when no progress exists
- [ ] Card links to /home/course

---

### Feature 3: Assessment Spider Diagram

**Scope:**
- Reuse existing RadarChart component
- Display category scores from self-assessment survey
- Show overall assessment score
- Add link to assessment page

**Files to Create/Modify:**
- `apps/web/app/home/(user)/_components/assessment-spider-card.tsx` (create)

**Data Sources:**
- survey_responses table (most recent completed survey)

**Acceptance Criteria:**
- [ ] Radar chart displays all skill categories
- [ ] Scores correctly mapped to chart axes
- [ ] Empty state when no survey completed
- [ ] Card links to /home/assessment

---

### Feature 4: Kanban Summary Card

**Scope:**
- Display task counts by status (To Do, Doing, Done)
- Show current task in progress (if any)
- Show next recommended task
- Add link to kanban board

**Files to Create/Modify:**
- `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` (create)

**Data Sources:**
- tasks table with status aggregation

**Acceptance Criteria:**
- [ ] Task counts display for each status
- [ ] Current task shows with title/phase
- [ ] Next task recommendation displayed
- [ ] Empty state when no tasks exist
- [ ] Card links to /home/kanban

---

### Feature 5: Activity Feed & Quick Actions

**Scope:**
- Recent activity list (last 5-10 items)
- Activity types: lesson completed, quiz taken, task moved, survey completed
- Quick action buttons based on user state
- Contextual CTAs (continue course, take survey, etc.)

**Files to Create/Modify:**
- `apps/web/app/home/(user)/_components/activity-feed-card.tsx` (create)
- `apps/web/app/home/(user)/_components/quick-actions-card.tsx` (create)

**Data Sources:**
- Multiple tables aggregated (lesson_progress, quiz_attempts, tasks, survey_responses)
- User state for contextual actions

**Acceptance Criteria:**
- [ ] Activity feed shows recent items with timestamps
- [ ] Activities properly typed with icons
- [ ] Quick actions contextual to user state
- [ ] Empty states handled gracefully

---

### Feature 6: Coaching Sessions Card

**Scope:**
- Display upcoming coaching sessions
- Integration with existing Cal.com setup
- "Book Session" CTA if no upcoming
- Show session date/time and type

**Files to Create/Modify:**
- `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx` (create)

**Data Sources:**
- Cal.com API (existing integration at /home/coaching)

**Acceptance Criteria:**
- [ ] Upcoming sessions displayed with date/time
- [ ] "Book Session" CTA links to booking page
- [ ] Empty state when no sessions booked
- [ ] Card links to /home/coaching

---

### Feature 7: Presentation Outline Table

**Scope:**
- Full-width table spanning bottom row
- Display presentation phases and tasks
- Show task status, completion, and priority
- Expandable rows for subtasks
- Phase grouping with headers

**Files to Create/Modify:**
- `apps/web/app/home/(user)/_components/presentation-outline-table.tsx` (create)

**Data Sources:**
- tasks table with phases
- PRESENTATION_PHASES from config

**Acceptance Criteria:**
- [ ] Table spans full width (3 columns)
- [ ] Phases displayed as group headers
- [ ] Tasks show status, priority, completion
- [ ] Subtasks expandable (accordion style)
- [ ] Links to individual task pages
- [ ] Empty state when no tasks

## Implementation Notes

### Reusable Components
- `RadialProgress` from `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- `RadarChart` from `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Card components from `@kit/ui/card`
- Chart components from `@kit/ui/chart`

### Data Loading Pattern
```typescript
import "server-only";
import { cache } from "react";

export const loadUserDashboard = cache(async (userId: string) => {
  const [courseProgress, surveyResults, tasks, activity] = await Promise.all([
    loadCourseProgress(userId),
    loadSurveyResults(userId),
    loadKanbanSummary(userId),
    loadRecentActivity(userId),
  ]);
  return { courseProgress, surveyResults, tasks, activity };
});
```

### Grid Layout Pattern
```css
/* Desktop: 3-3-1 layout */
grid-template-columns: repeat(3, 1fr);
grid-template-rows: auto auto auto;

/* Mobile: stacked */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

### Gotchas (from Research)
1. Charts require `'use client'` directive - Recharts is client-only
2. Use ChartConfig with CSS variables for dark mode support
3. All components need empty state handling
4. Wrap cards in Suspense for streaming if needed

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cal.com integration complexity | Medium | Medium | Reuse existing coaching page patterns |
| Activity aggregation performance | Low | Medium | Use database views or materialized queries |
| Chart rendering on mobile | Low | Low | Test responsive behavior, simplify if needed |

## Next Steps

1. **Approve feature decomposition** - Review and approve this plan
2. **Create GitHub issues** - Run with `--create-issues` flag
3. **Begin Phase 1** - Start with Feature 1 (Dashboard Layout)
4. **Parallel development** - Features 2-6 can be developed in parallel after Feature 1
5. **Integration** - Feature 7 depends on Feature 4 completion
