# Feature: Presentation Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I4 |
| **Feature ID** | S1877.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description

Creates the core presentation outlines data table widget for the user dashboard. Displays user's presentations from the `building_blocks_submissions` table with columns for title, presentation type, last updated date, and edit action buttons. Integrated with the dashboard's 3-3-1 grid layout as the full-width bottom widget.

## User Story

**As a** Learning Lauren (active learner managing multiple presentations)

**I want to** see all my presentations in a table on the dashboard with quick access to edit outlines

**So that** I can efficiently manage my presentation work without navigating away from the dashboard

## Acceptance Criteria

### Must Have
- [ ] Presentation table displays at bottom of user dashboard page
- [ ] Table columns: Title, Presentation Type, Last Updated, Actions
- [ ] Data fetched from `building_blocks_submissions` table via RLS
- [ ] "Edit Outline" button links to `/home/(user)/ai/storyboard?id={submission_id}`
- [ ] Table displays up to 10-20 presentations per page
- [ ] Loading skeleton shown while data is fetching
- [ ] Empty state shown when user has no presentations with CTA to create first

### Nice to Have
- [ ] Hover highlight on table rows
- [ ] Tooltip showing full title when truncated
- [ ] Mobile-optimized table with horizontal scroll

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `<PresentationTableWidget />` | New |
| **UI** | `DataTable` from `@kit/ui/makerkit` | Existing |
| **UI** | `Table` components from `@kit/ui/shadcn` | Existing |
| **UI** | `EmptyState` from `@kit/ui/makerkit` | Existing |
| **UI** | `Skeleton` from `@kit/ui/shadcn` | Existing |
| **Logic** | Dashboard data loader extension | New |
| **Data** | `building_blocks_submissions` table | Existing |
| **Database** | Supabase RLS policies | Existing |

## Architecture Decision

**Approach**: Pragmatic

**Rationale**: Build a focused table component that reuses the powerful `DataTable` from `@kit/ui/makerkit`. Server component fetches data via RLS-protected query, passes to client component for sorting/pagination state. This minimizes custom code while leveraging existing infrastructure.

### Key Architectural Choices

1. **Server Component for Data Fetching**: Use async server component pattern with `getSupabaseServerClient()` to fetch presentations. RLS automatically enforces user isolation.
2. **Client Component for Interactivity**: Table widget as client component managing sorting, filtering, and pagination state locally. No real-time updates for v1.
3. **TanStack Table Integration**: Leverage `DataTable` from `@kit/ui/makerkit` which wraps TanStack Table with built-in sorting, pagination, and column management.
4. **Navigation via Edit Buttons**: Each row has an "Edit Outline" button that navigates to storyboard page with submission ID as query parameter.

### Trade-offs Accepted

- **Client-side filtering**: Initial implementation filters data client-side after fetch. Future could add server-side filtering for larger datasets.
- **No real-time updates**: Table doesn't auto-refresh on changes. User must manually refresh page or navigate away and back.

## Required Credentials

None required - uses existing Supabase client with RLS protection.

## Dependencies

### Blocks
- None

### Blocked By
- S1877.I1 (Dashboard Foundation) - Requires grid layout container and dashboard page structure
- S1877.I2 (Progress Widgets) - Completes dashboard visualization set
- S1877.I3 (Activity & Task Widgets) - Completes dashboard visualization set

### Parallel With
- None (this initiative starts after I1, I2, I3 complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentation-table-widget.tsx` - Main table widget component
- `apps/web/app/home/(user)/_components/table-skeleton-rows.tsx` - Table loading skeleton rows

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add presentation table widget to dashboard grid
- `apps/web/app/home/(user)/_lib/server/user-dashboard-loader.ts` - Add presentation data fetch function

## Task Hints

### Candidate Tasks

1. **Create presentation data fetcher**: Server-side function to fetch from `building_blocks_submissions` with RLS
2. **Build table widget component**: Client component using `DataTable` with column definitions
3. **Integrate with dashboard page**: Add widget to bottom row of dashboard grid
4. **Add loading skeleton**: Create skeleton rows for table during fetch
5. **Add empty state**: Configure `EmptyState` component with "Create First Presentation" CTA

### Suggested Order

1. Create data fetcher in `_lib/server/`
2. Build table widget component with column definitions
3. Create loading skeleton component
4. Integrate widget into dashboard page
5. Test with sample data (user has presentations)
6. Test empty state (user has no presentations)

## Validation Commands

```bash
# Verify table renders on dashboard
pnpm dev:web
curl -s http://localhost:3000/home | grep -q "presentation"

# Typecheck after implementation
pnpm typecheck

# Verify data fetching
# Login as test user with presentations
# Navigate to /home
# Verify table displays correct presentation data

# Verify edit button navigation
# Click "Edit Outline" button
# Verify navigates to /home/(user)/ai/storyboard?id=<submission_id>

# Verify RLS protection
# Login as different user
# Verify cannot see first user's presentations
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
