# Initiative: Presentation Table & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1877 |
| **Initiative ID** | S1877.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 3 |
| **Priority** | 4 |

---

## Description

Creates a full-width presentation outlines data table with sortable/filterable columns, quick-edit outline buttons, and pagination. Completes dashboard with comprehensive polish including empty states, skeleton refinement, accessibility audit, and E2E test coverage.

## Business Value

Provides users with quick access to manage their presentation outlines without navigating away from the dashboard. Table format enables efficient browsing of large presentation sets with sorting and filtering, while "Edit Outline" buttons provide direct action paths.

---

## Scope

### In Scope
- [x] Presentation Table Widget (full-width at bottom of dashboard)
- [x] DataTable integration (TanStack Table with sorting, filtering, pagination)
- [x] Quick "Edit Outline" action buttons linking to `/home/(user)/ai/storyboard`
- [x] Data fetching from `building_blocks_submissions` table
- [x] Empty state for presentation list with "Create First Presentation" CTA
- [x] Loading skeleton states
- [x] Accessibility compliance (WCAG 2.1 AA): keyboard nav, screen reader, color contrast
- [x] E2E tests: dashboard load, widget interactions, table sorting/filtering
- [x] Integration with dashboard grid layout

### Out of Scope
- [ ] Full presentation management CRUD (handled by storyboard pages)
- [ ] Outline editing functionality (handled by storyboard pages)
- [ ] Advanced table features (bulk actions, export, custom column visibility)
- [ ] Real-time table updates (use polling/refetch for v1)

---

## Dependencies

### Blocks
- None

### Blocked By
- S1877.I1 - Dashboard Foundation (requires grid container and page structure)
- S1877.I2 - Progress Widgets (completes dashboard visualization set)
- S1877.I3 - Activity & Task Widgets (completes dashboard visualization set)

### Parallel With
- None (this initiative should start after all visualizations are complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | DataTable customization, sorting/filtering integration, accessibility compliance, E2E test creation |
| External dependencies | Low | Only uses existing `building_blocks_submissions` table and DataTable component |
| Unknowns | Low | DataTable patterns well-established, accessibility requirements standard |
| Reuse potential | High | Reuses existing `DataTable` from `@kit/ui/makerkit/data-table.tsx`, table components from `@kit/ui/table` |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Presentation Table Widget**: DataTable with title, type, updated_at columns, edit actions
2. **Table Features**: Sorting by updated_at, filtering by presentation_type, pagination (10-20 rows per page)
3. **Empty States**: "No presentations yet" with "Create First Presentation" CTA
4. **Loading States**: Table skeleton rows during data fetch
5. **Accessibility Audit**: Ensure keyboard navigation, ARIA labels, focus management, screen reader announcements
6. **E2E Test Coverage**: Dashboard page load, widget interactions, table sort/filter, accessibility scenarios

### Suggested Order
1. Presentation Table Widget (core functionality)
2. Table Features (sorting, filtering, pagination)
3. Empty and loading states
4. Accessibility audit and fixes
5. E2E test creation and validation

---

## Validation Commands
```bash
# Verify presentation table displays correctly
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "presentation"

# Verify DataTable integration working
pnpm typecheck

# Run E2E tests
pnpm --filter web-e2e test:dashboard

# Accessibility audit (use axe DevTools)
# Open browser DevTools and run accessibility audit

# Verify sorting and filtering
# In browser: sort by "Last Updated", filter by presentation type, verify table updates correctly

# Typecheck after implementation
pnpm typecheck

# Verify pagination works (check network requests when navigating pages)
# Open browser DevTools Network tab and verify pagination requests
```

---

## Related Files
- Spec: `../spec.md`
- Data Table Component: `packages/ui/src/makerkit/data-table.tsx`
- Table Components: `packages/ui/src/shadcn/table.tsx`
- Building Blocks Schema: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Storyboard Page: `apps/web/app/home/(user)/ai/storyboard/page.tsx`
