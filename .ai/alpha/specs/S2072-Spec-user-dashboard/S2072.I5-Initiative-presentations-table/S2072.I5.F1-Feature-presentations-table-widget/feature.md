# Feature: Presentations Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I5 |
| **Feature ID** | S2072.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 1 |

## Description

A full-width presentations table widget for the dashboard Row 3 slot, displaying the user's presentation outlines with columns for title, created date, status, and edit actions. Uses the existing DataTable component from `@kit/ui/data-table` with the `building_blocks_submissions` table as the data source.

## User Story
**As a** user on my dashboard
**I want to** see a list of my recent presentations
**So that** I can quickly access and continue working on them without navigating to a separate page

## Acceptance Criteria

### Must Have
- [ ] Table displays presentations from `building_blocks_submissions` for current user
- [ ] Columns: Title, Created date, Status indicator, Actions (Edit link)
- [ ] Table integrates into Row 3 (full-width) of dashboard grid layout
- [ ] "New Presentation" button links to outline creation flow
- [ ] Edit link navigates to correct outline editor route
- [ ] Responsive on mobile (table scrolls horizontally)
- [ ] Typecheck passes without errors

### Nice to Have
- [ ] Hover effect on row for better clickability feedback
- [ ] Empty state message when no presentations exist (base implementation - I6 will enhance)
- [ ] Title column truncation with ellipsis for long titles

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | PresentationsTable client component | New |
| **Logic** | Column definitions, row actions | New |
| **Data** | getPresentationsForDashboard query | New |
| **Database** | building_blocks_submissions table | Existing |

## Architecture Decision

**Approach**: Minimal/Pragmatic
**Rationale**: This is a straightforward data display widget. The DataTable component and query patterns already exist in the codebase. No need for complex abstractions - follow existing patterns from admin tables and building-blocks queries.

### Key Architectural Choices
1. **Use basic DataTable** (`@kit/ui/data-table`) - no server-side pagination needed for dashboard widget
2. **Client component** for table - simple filtering/sorting if needed later
3. **Inline query in loader** - follow I1's dashboard loader pattern, not a separate server action
4. **Derive status from storyboard presence** - no dedicated status column in table, derive from `storyboard` field

### Trade-offs Accepted
- No pagination initially (show last 10 or all) - can add later if needed
- No sorting/filtering beyond what DataTable provides client-side
- Status derived from data presence rather than explicit column

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Table | DataTable | @kit/ui/data-table | Basic table without pagination complexity |
| Container | Card | @kit/ui/card | Consistent widget container pattern |
| Status Badge | Badge | @kit/ui/badge | Conditional display based on storyboard |
| Edit Link | Link/Button | Next.js/Radix | Direct navigation to editor |
| New Button | Button | @kit/ui/button | Primary CTA for new presentation |

**Components to Install**: None required - all exist in packages/ui

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | This feature uses only Supabase with RLS | N/A |

## Dependencies

### Blocks
- S2072.I6.F* (Empty States & Polish) - needs widget for empty state design

### Blocked By
- S2072.I1.F1 (Dashboard Page Shell) - provides route and page structure
- S2072.I1.F2 (Responsive Grid Layout) - provides Row 3 slot
- S2072.I1.F3 (Dashboard Data Loader) - provides data fetching pattern and integration

### Parallel With
- S2072.I2.F* (Progress Visualization Widgets)
- S2072.I3.F* (Activity & Actions Widgets)
- S2072.I4.F* (Coaching Integration)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentations-table.tsx` - DataTable component with column definitions
- `apps/web/app/home/(user)/_lib/queries/get-presentations-for-dashboard.ts` - Query function for dashboard

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render PresentationsTable in Row 3
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add presentations to parallel fetch (if I1 created this)
- `apps/web/app/home/(user)/_lib/types.ts` - Add PresentationRow type (if I1 created this)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create presentations query**: Fetch id, title, created_at, storyboard from building_blocks_submissions, ordered by created_at DESC
2. **Define column configuration**: Title (link), Created (formatted date), Status (badge from storyboard), Actions (edit icon/link)
3. **Create PresentationsTable component**: DataTable with columns, New Presentation button, responsive styling
4. **Integrate into dashboard page**: Import component, place in Row 3 (full-width), pass data from loader
5. **Add responsive handling**: Ensure table scrolls horizontally on mobile, full-width on desktop

### Suggested Order
1. Create query function (data layer)
2. Define column configuration (logic layer)
3. Create PresentationsTable component (UI layer)
4. Integrate into dashboard page (integration)
5. Test responsive behavior (validation)

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Development server
pnpm dev
# Navigate to /home, verify table renders with presentations

# Verify edit links
# Click edit link, verify navigation to outline editor route

# Verify responsive
# Resize browser, verify table scrolls on mobile

# Verify new button
# Click "New Presentation", verify navigation to creation flow
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/makerkit/data-table.tsx` (DataTable component)
- Reference: `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts` (query pattern)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (table in dashboard pattern)
- Reference: `packages/features/admin/src/components/admin-accounts-table.tsx` (column definition pattern)
