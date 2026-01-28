# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I3 |
| **Feature ID** | S1877.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description

A dashboard widget showing contextual action buttons (CTAs) based on user state. Dynamically surfaces "Continue Course", "New Presentation", "Complete Assessment", "Review Storyboard", and "Continue Task" based on data availability, helping users take immediate action without navigating through multiple pages.

## User Story

**As a** learner working through courses, presentations, and tasks
**I want to** see contextually relevant actions based on my current progress
**So that** I can quickly take the next logical step in my learning journey without searching through the platform

## Acceptance Criteria

### Must Have
- [ ] Displays 3-4 most relevant CTAs based on user state detection
- [ ] "Continue Course" appears when course progress exists but is incomplete
- [ ] "Complete Assessment" appears when survey is not completed
- [ ] "Review Storyboard" appears when building_blocks_submissions exist (most recent)
- [ ] "Continue Task" appears when tasks with status='doing' exist
- [ ] "New Presentation" always available as fallback action
- [ ] Each CTA includes icon, title, and description
- [ ] Clicking CTA navigates to appropriate page
- [ ] Loading skeleton state displays during data fetch
- [ ] Empty state shows "New Presentation" as default

### Nice to Have
- [ ] Priority-based ordering of CTAs (continue learning > review work > create new)
- [ ] Hover effect shows additional context for each action
- [ ] Animation when actions appear after data loads

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | QuickActionsPanel | New |
| **UI** | CardButton, Button, Card | Existing |
| **Logic** | quick-actions.loader.ts | New |
| **Logic** | deriveActions() state detection | New |
| **Data** | course_progress, survey_responses, building_blocks_submissions, tasks queries | Existing |
| **Database** | Multiple tables via parallel queries | Existing |

## Architecture Decision

**Approach**: Server Component with Parallel Data Fetching
**Rationale**:
1. **Consistency** - Matches dashboard pattern from S1877.I1 foundation
2. **Performance** - Parallel `Promise.all()` fetching reduces load time by 60-80% vs sequential
3. **Simplicity** - No React Query complexity for read-only contextual actions
4. **RLS Automatic** - Server components inherit row-level security
5. **Single Fetch** - All data gathered once at page load

### Key Architectural Choices
1. Server-side loader queries 4 data sources in parallel: course_progress, survey_responses, building_blocks_submissions, tasks
2. `deriveActions()` function maps data availability to action objects with priority scores
3. Client component receives pre-computed actions as props (presentational only)
4. Fallback "New Presentation" action always ensures widget is never empty
5. Priority scoring ensures most relevant actions appear first

### Trade-offs Accepted
- Actions are static until page refresh (acceptable for dashboard context)
- No real-time action updates (can be added in v2)

## Required Credentials

> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses existing Supabase tables with RLS | No external services |

## Dependencies

### Blocks
- S1877.I4.F1 - Presentation Table Widget (completes widget set, no blocking relationship)

### Blocked By
- S1877.I1.F1 - Dashboard Page & Grid Layout (requires grid container)

### Parallel With
- S1877.I3.F1 - Kanban Summary Widget
- S1877.I3.F3 - Activity Feed Widget

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Main widget component rendering CardButton CTAs
- `apps/web/app/home/(user)/_components/quick-actions-panel-skeleton.tsx` - Loading skeleton with placeholder cards
- `apps/web/app/home/(user)/_lib/server/quick-actions-loader.ts` - Server-side data fetching with parallel queries
- `apps/web/app/home/(user)/_lib/types/quick-actions.types.ts` - TypeScript interfaces for QuickAction and related types

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and use `loadQuickActions()` in parallel fetch, pass actions to widget

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create type definitions**: Define `QuickAction` interface with id, title, description, icon, href, and priority fields
2. **Build loader function**: Implement `loadQuickActions()` with 4 parallel queries using `Promise.all()`
3. **Implement state detection**: Create `deriveActions()` logic that maps data availability to action objects with priority scoring
4. **Create main widget**: Build `QuickActionsPanel` component that renders CardButton components for each action
5. **Add loading skeleton**: Create `QuickActionsPanelSkeleton` with placeholder buttons
6. **Integrate into dashboard**: Add loader call to `page.tsx` parallel fetch and pass actions to widget
7. **Add icons and navigation**: Import Lucide icons (BookOpen, ClipboardCheck, Layout, PlusCircle, CheckSquare) and configure links via pathsConfig
8. **Add i18n translations**: Add keys for action titles, descriptions, and widget header

### Suggested Order
1. Create type definitions and verify they match database schemas
2. Implement loader function with all 4 queries and deriveActions logic
3. Test state detection with mock data (continue course, complete assessment, review storyboard, continue task scenarios)
4. Build main widget component and verify rendering
5. Create skeleton and empty states
6. Integrate into dashboard page with parallel data fetching
7. Add translations and accessibility refinements

## Validation Commands
```bash
# Verify quick actions display
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Quick Actions"

# Verify navigation links exist
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "/home/course\|/home/assessment\|/home/ai"

# Typecheck after implementation
pnpm typecheck

# Run linter
pnpm lint:fix

# Format code
pnpm format:fix
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../../S1877.I1-Initiative-dashboard-foundation/`
- Course Page: `apps/web/app/home/(user)/course/page.tsx` (course_progress query pattern)
- Assessment Page: `apps/web/app/home/(user)/assessment/page.tsx` (survey_responses query pattern)
- Storyboard: `apps/web/app/home/(user)/ai/storyboard/_components/presentation-selector.tsx` (building_blocks_submissions query pattern)
- Kanban: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` (tasks query pattern)
- Paths Config: `apps/web/config/paths.config.ts`
