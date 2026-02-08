# Feature: Presentations Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I4 |
| **Feature ID** | S1918.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
A full-width table widget displaying the user's presentations (building_blocks_submissions). Shows columns for title, presentation type, last modified date, and an "Edit Outline" action button. Provides quick access to continue working on existing presentations.

## User Story
**As a** content creator
**I want to** see all my presentations in one place with quick edit access
**So that** I can easily find and continue working on any presentation

## Acceptance Criteria

### Must Have
- [ ] Widget spans full width (row 3 of dashboard grid)
- [ ] Table columns: Title, Type, Last Modified, Actions
- [ ] Title column shows presentation title (truncated if > 40 chars)
- [ ] Type column shows presentation_type value or "—" if null
- [ ] Last Modified shows relative or formatted date
- [ ] Actions column has "Edit Outline" button linking to /home/ai/canvas/[id]
- [ ] Sorted by updated_at descending (most recent first)
- [ ] Limits to 5 presentations on dashboard (with "View All" link if more)
- [ ] Empty state: "You haven't created any presentations yet" with "Create Your First Presentation" CTA

### Nice to Have
- [ ] Row hover highlighting
- [ ] Mobile responsive (stacked cards on small screens)
- [ ] Quick delete action (with confirmation)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `presentations-table-widget.tsx` | New |
| **Logic** | Table rendering with sorting | New |
| **Data** | Props from dashboard loader | Existing query |
| **Database** | building_blocks_submissions table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use shadcn Table component for consistent styling. Server component receives pre-fetched data. No pagination needed for dashboard (limit to 5 rows) - full table at /home/ai page.

### Key Architectural Choices
1. Server component with pre-fetched presentations array
2. Use shadcn Table components (Table, TableHeader, TableBody, TableRow, TableCell)
3. Date formatting with date-fns or native Intl.DateTimeFormat
4. Link buttons using Next.js Link component

### Trade-offs Accepted
- No sorting/filtering on dashboard table (available on dedicated presentations page)
- Limited to 5 rows (full list elsewhere)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card, CardHeader, CardContent | shadcn/ui | Consistent dashboard widget |
| Data Table | Table, TableHeader, TableBody, etc. | shadcn/ui | Standard table implementation |
| Action Button | Button variant="outline" size="sm" | shadcn/ui | Compact action in table |
| Empty State | Custom with Button CTA | Custom | Match empty state patterns |

**Components to Install**: None required

## Required Credentials
> Environment variables required for this feature to function.

None required - uses only internal database data.

## Dependencies

### Blocks
- None directly

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (provides grid slot)
- S1918.I2.F1: Dashboard Types (provides PresentationSummary type)
- S1918.I2.F2: Dashboard Loader (provides presentations query)

### Parallel With
- F2: Kanban Summary (independent widget)
- F4: Activity Feed (independent widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in full-width row

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create PresentationSummary type**: Define interface with id, title, presentation_type, updated_at
2. **Create presentations-table-widget.tsx**: Build table with columns and actions
3. **Add date formatting utility**: Format updated_at for display
4. **Add empty state**: Handle zero presentations
5. **Integrate with dashboard page**: Place in full-width grid row
6. **Add responsive behavior**: Consider mobile layout

### Suggested Order
1. Types → 2. Component → 3. Empty State → 4. Integration → 5. Responsive

## Validation Commands
```bash
# Verify widget file exists
test -f apps/web/app/home/\(user\)/_components/presentations-table-widget.tsx && echo "✓ Presentations table widget exists"

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `packages/ui/src/shadcn/table.tsx`
- Reference: `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts`
- Pattern: `apps/web/app/home/[account]/members/_components/team-members-table.tsx`
