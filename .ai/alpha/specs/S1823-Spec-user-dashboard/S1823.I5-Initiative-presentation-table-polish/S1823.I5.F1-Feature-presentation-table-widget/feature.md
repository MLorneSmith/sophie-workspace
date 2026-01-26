# Feature: Presentation Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I5 |
| **Feature ID** | S1823.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Implement the Presentation Outline Table widget displaying all user presentations from `building_blocks_submissions` with title, audience, last updated timestamp, and edit links. Includes a "New Presentation" CTA and integrates with the existing dashboard grid layout.

## User Story
**As a** presentation creator
**I want to** see all my presentation outlines in a table on my dashboard
**So that** I can quickly access and manage my work from a central location

## Acceptance Criteria

### Must Have
- [ ] Table displays title, audience, presentation_type, last updated columns
- [ ] Title column links to edit page (`/home/ai/canvas/[id]`)
- [ ] Table sorted by `updated_at` DESC (most recent first)
- [ ] "New Presentation" CTA button in table header/footer
- [ ] Responsive design - stacks on mobile, scrollable on tablet
- [ ] Loading skeleton state while data fetches
- [ ] Integrates with dashboard grid (full-width bottom row)

### Nice to Have
- [ ] Hover states on rows for visual feedback
- [ ] Action dropdown with "Edit" option (extensible for future actions)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `PresentationTableWidget`, column definitions | New |
| **Logic** | Client table component with DataTable | New |
| **Data** | Server loader for presentations | New |
| **Database** | `building_blocks_submissions` table | Existing |

## Architecture Decision

**Approach**: Pragmatic - Server Component with Client Table
**Rationale**: Follow established DataTable patterns from team members/admin tables. Server component fetches data, passes to client table component for interactive features.

### Key Architectural Choices
1. Use `@kit/ui/enhanced-data-table` for consistent table behavior
2. Server-side data fetching in dashboard loader (parallel with other widgets)
3. Client component for table interactions (column definitions, click handlers)

### Trade-offs Accepted
- No client-side sorting/filtering (keep simple for v1, matches scope)
- All presentations shown (no pagination for v1 - typically < 20 per user)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Table | DataTable | @kit/ui/enhanced-data-table | Existing pattern, TanStack Table |
| Card wrapper | Card | shadcn/ui | Consistent widget styling |
| CTA button | Button | shadcn/ui | Standard action button |
| Link column | Link | next/link | Navigation to canvas editor |

**Components to Install**: None - all components already in packages/ui

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required - uses internal database queries only.

## Dependencies

### Blocks
- F2: Empty state requires table widget to be complete
- F3: Accessibility compliance testing needs table in place
- F4: E2E tests need table to test against

### Blocked By
- S1823.I1.F1: Needs TypeScript types from dashboard foundation
- S1823.I1.F2: Needs dashboard page shell and grid layout

### Parallel With
- None (first feature in initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentation-table-widget.tsx` - Table widget with DataTable
- `apps/web/app/home/(user)/_lib/server/presentations.loader.ts` - Server loader function
- `apps/web/app/home/(user)/_lib/schemas/presentation.schema.ts` - Zod schema for type safety

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add presentations to parallel fetch
- `apps/web/app/home/(user)/page.tsx` - Integrate PresentationTableWidget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create TypeScript types**: Define Presentation type from building_blocks_submissions schema
2. **Create server loader**: `loadUserPresentations()` function with Supabase query
3. **Create Zod schema**: Validation schema for presentation data
4. **Create table column definitions**: ColumnDef array for DataTable
5. **Create PresentationTableWidget component**: Client component with DataTable
6. **Integrate into dashboard loader**: Add to `Promise.all()` in dashboard loader
7. **Add widget to dashboard page**: Place in grid layout (row 3, full-width)
8. **Add loading skeleton**: Skeleton state matching table dimensions
9. **Write unit tests**: Test loader function and component rendering

### Suggested Order
1. Types/schema → 2. Loader → 3. Columns → 4. Widget → 5. Dashboard integration → 6. Skeleton → 7. Tests

## Validation Commands
```bash
# Verify table renders with data
pnpm dev
curl -s http://localhost:3000/home | grep -q "presentation"

# Type checking
pnpm typecheck

# Unit tests
pnpm --filter web test:unit -- --grep "presentation"

# Visual validation
agent-browser open http://localhost:3000/home
agent-browser is visible "New Presentation"
agent-browser screenshot /tmp/presentation-table.png
```

## Related Files
- Initiative: `../initiative.md`
- DataTable Component: `packages/ui/src/makerkit/data-table.tsx`
- DB Schema: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Dashboard Page: `apps/web/app/home/(user)/page.tsx`
