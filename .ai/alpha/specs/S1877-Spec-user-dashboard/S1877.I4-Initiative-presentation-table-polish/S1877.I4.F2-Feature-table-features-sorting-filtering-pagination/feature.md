# Feature: Table Features - Sorting, Filtering, Pagination

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I4 |
| **Feature ID** | S1877.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description

Enables sorting, filtering, and pagination capabilities for the presentation table. Users can sort presentations by title, type, or last updated date; filter by presentation type; and navigate through pages when they have many presentations (10+).

## User Story

**As a** Organized Oliver (user with 20+ presentations)

**I want to** sort, filter, and paginate through my presentations table

**So that** I can quickly find specific presentations and browse large collections efficiently

## Acceptance Criteria

### Must Have
- [ ] Sortable columns: Title (asc/desc), Presentation Type (asc/desc), Last Updated (asc/desc - default)
- [ ] Filter dropdown for Presentation Type (All, Informative, Persuasive, Inspirational)
- [ ] Pagination at bottom of table showing "Page X of Y" with previous/next buttons
- [ ] Page size: 10 rows per page
- [ ] Sort indicator (up/down arrow) visible on currently sorted column
- [ ] Filter preserves across page navigation

### Nice to Have
- [ ] Keyboard shortcuts for sorting (click header to toggle asc/desc)
- [ ] Active filter badge showing "Filtered by: Type"

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Enhanced column definitions for `DataTable` | New |
| **UI** | Filter dropdown (Select from `@kit/ui`) | New |
| **Logic** | Sorting state management | Existing (TanStack Table) |
| **Logic** | Filtering logic | New (client-side) |
| **Logic** | Pagination state management | Existing (TanStack Table) |

## Architecture Decision

**Approach**: Pragmatic

**Rationale**: Leverage TanStack Table's built-in sorting and pagination state management. Add client-side filtering as a simple array filter function. This provides full table functionality without complex server-side state.

### Key Architectural Choices

1. **TanStack Table Sorting**: Use `getSortedRowModel()` from TanStack Table which provides column-level sorting with multi-sort support.
2. **Client-side Filtering**: Filter the data array before passing to table. For small datasets (typically <100 presentations per user), client-side is sufficient and faster.
3. **URL State Sync**: Optional: sync sort/filter/page state to URL query params for bookmarkable views.
4. **Filter Component**: Use `Select` from `@kit/ui` for presentation type filter dropdown.

### Trade-offs Accepted

- **Client-side filtering**: Not optimal for thousands of records, but acceptable for typical user presentation counts (<50).
- **No URL persistence**: Initial implementation doesn't persist filter/sort state in URL. Future enhancement.

## Required Credentials

None required - client-side filtering of locally-fetched data.

## Dependencies

### Blocks
- None

### Blocked By
- S1877.I4.F1 (Presentation Table Widget) - Requires base table component to enhance

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/table-column-definitions.ts` - Type-safe column definitions with sorting/filtering config

### Modified Files
- `apps/web/app/home/(user)/_components/presentation-table-widget.tsx` - Add sorting, filtering, pagination controls

## Task Hints

### Candidate Tasks

1. **Define column definitions**: Create TypeScript interfaces and TanStack Table column definitions with sort functions
2. **Add sorting state**: Connect TanStack Table's `getSortedRowModel()` to DataTable props
3. **Implement type filter**: Add Select dropdown for presentation_type filtering
4. **Add pagination controls**: Configure DataTable's `pageIndex`, `pageSize`, `pageCount` props
5. **Test sorting**: Verify all columns sort correctly asc/desc
6. **Test filtering**: Verify type filter hides non-matching rows
7. **Test pagination**: Verify page navigation works correctly

### Suggested Order

1. Define column definitions with sort functions
2. Add sorting to table widget
3. Add presentation type filter dropdown
4. Configure pagination controls
5. Test sorting interactions
6. Test filtering interactions
7. Test pagination across multiple pages

## Validation Commands

```bash
# Typecheck after implementation
pnpm typecheck

# Test sorting - via browser
# 1. Navigate to /home
# 2. Click "Title" column header
# 3. Verify sorts ascending (A-Z)
# 4. Click "Title" again
# 5. Verify sorts descending (Z-A)
# 6. Repeat for "Last Updated" column

# Test filtering - via browser
# 1. Open presentation type filter dropdown
# 2. Select "Informative"
# 3. Verify only Informative presentations shown
# 4. Select "All" to clear filter

# Test pagination - via browser
# 1. Create test user with 15+ presentations
# 2. Verify page shows first 10 presentations
# 3. Click "Next" button
# 4. Verify shows presentations 11-15
# 5. Verify page indicator shows "Page 2 of 2"
```

## Related Files
- Initiative: `../initiative.md`
- F1 Presentation Table Widget: `../S1877.I4.F1-Feature-presentation-table-widget/feature.md`
- Tasks: `./tasks.json` (created in next phase)
