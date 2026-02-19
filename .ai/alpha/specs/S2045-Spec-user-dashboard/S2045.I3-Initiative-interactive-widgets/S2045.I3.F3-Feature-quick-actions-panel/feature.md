# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I3 |
| **Feature ID** | S2045.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Build the Quick Actions Panel for Row 2 of the dashboard with 4 conditional CTA buttons based on user state across multiple tables. Actions include "Continue Course" (visible when course started but not completed), "New Presentation" (always visible), "Complete Assessment" (visible when no survey response exists), and "Review Storyboard" (visible when building blocks drafts exist). The most relevant action is visually highlighted.

## User Story
**As a** SlideHeroes user
**I want to** see personalized action buttons on my dashboard based on where I am in my learning journey
**So that** I can jump to my most important next task with a single click

## Acceptance Criteria

### Must Have
- [ ] Card wrapper with "Quick Actions" title
- [ ] "Continue Course" CTA: visible when `course_progress.started_at` exists but `completed_at` is null; links to `/home/course`
- [ ] "New Presentation" CTA: always visible; links to `/home/ai/blocks`
- [ ] "Complete Assessment" CTA: visible when no `survey_responses` exist for the user; links to `/home/assessment`
- [ ] "Review Storyboard" CTA: visible when `building_blocks_submissions` drafts exist; links to `/home/ai/blocks/{latest_id}`
- [ ] Each CTA rendered as a Button with descriptive icon (Lucide)
- [ ] Most relevant action visually distinguished (e.g., primary variant vs outline)
- [ ] Data for conditional logic provided by dashboard data loader
- [ ] Dark mode support via semantic color classes
- [ ] Wired to dashboard grid layout (Row 2, position 2)

### Nice to Have
- [ ] `data-testid="quick-actions-panel"` on Card wrapper
- [ ] Subtle hover animation on action buttons

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `quick-actions-panel.tsx` (Card + conditional buttons) | New |
| **Logic** | Conditional visibility logic based on user state data | New |
| **Data** | Dashboard loader provides course_progress, survey_responses existence, building_blocks presence | New (query additions) |
| **Database** | `course_progress`, `survey_responses`, `building_blocks_submissions` tables | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: The conditional logic is straightforward — each CTA checks a simple boolean condition derived from the dashboard loader data. The component receives pre-fetched data as props and renders buttons conditionally. No client-side data fetching needed.

### Key Architectural Choices
1. Server Component that receives loader data as props (boolean flags for each condition)
2. Loader provides: `hasCourseStarted`, `hasCourseCompleted`, `hasAssessment`, `hasStoryboardDrafts`, `latestStoryboardId`
3. Priority logic: "Continue Course" > "Complete Assessment" > "Review Storyboard" > "New Presentation"

### Trade-offs Accepted
- Conditional state is snapshot at page load (no real-time updates)
- Priority highlighting is static (most relevant = primary variant, others = outline)

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardContent | @kit/ui/card | Standard widget pattern |
| Action buttons | Button | @kit/ui/button | Primary/outline variants for priority |
| Icons | Play, Plus, ClipboardCheck, FileEdit | lucide-react | Clear action indicators |

## Required Credentials
> None required. All data comes from Supabase tables with RLS.

## Dependencies

### Blocks
- None

### Blocked By
- S2045.I1.F1: Needs dashboard page shell and grid layout
- S2045.I1.F3: Needs dashboard data loader to provide conditional state data

### Parallel With
- F1 (Presentations Table), F2 (Coaching Sessions Card), F4 (Activity Feed)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/quick-actions-panel.tsx` - Conditional CTA panel component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add QuickActionsPanel to Row 2, position 2
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add conditional state queries (course_progress, survey_responses, building_blocks)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add conditional state queries to loader**: Query course_progress (started/completed), survey_responses (exists), building_blocks_submissions (has drafts + latest id)
2. **Create QuickActionsPanel component**: Server component with 4 conditional CTAs, priority-based variant selection, Lucide icons
3. **Wire to dashboard page**: Import and place in Row 2, position 2 of grid
4. **Add i18n keys**: Translation keys for action labels and descriptions

### Suggested Order
T1 (loader queries) → T2 (component) → T3 (wire to page) → T4 (i18n)

## Validation Commands
```bash
pnpm typecheck
pnpm lint
grep -c "quick-actions" apps/web/app/home/\(user\)/_components/dashboard/quick-actions-panel.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Course progress: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Survey responses: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
- Building blocks: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Paths config: `apps/web/config/paths.config.ts`
