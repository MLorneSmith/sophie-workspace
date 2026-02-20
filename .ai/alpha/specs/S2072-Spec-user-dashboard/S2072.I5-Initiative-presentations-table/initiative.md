# Initiative: Presentations Table

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2072 |
| **Initiative ID** | S2072.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 3 |

---

## Description

Implements a full-width presentations table widget showing the user's presentation outlines with title, created date, status, and edit links. Uses the existing DataTable component from @kit/ui/data-table with the building_blocks_submissions table as the data source.

## Business Value

Provides quick access to recent presentations without navigating to a separate page. Users can see all their work in one place and jump directly to editing. Supports the content creation workflow central to the product.

---

## Scope

### In Scope
- [ ] Presentations table widget (full-width in Row 3)
- [ ] Columns: Title, Created date, Status, Actions (edit link)
- [ ] Data query from building_blocks_submissions table
- [ ] Edit link to outline editor
- [ ] "New Presentation" button
- [ ] Integration with dashboard grid layout

### Out of Scope
- [ ] Table pagination (show all or limit to recent 10)
- [ ] Sorting/filtering functionality
- [ ] Inline editing
- [ ] Loading skeletons (delegated to I6)
- [ ] Empty states (delegated to I6)
- [ ] Presentation creation flow (existing functionality)

---

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs widget for empty state design

### Blocked By
- S2072.I1 (Foundation & Data Layer) - requires page shell and data loader

### Parallel With
- S2072.I2 (Progress Visualization Widgets)
- S2072.I3 (Activity & Actions Widgets)
- S2072.I4 (Coaching Integration)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | DataTable component exists, simple query |
| External dependencies | Low | Only Supabase |
| Unknowns | Low | Table schema well-known |
| Reuse potential | High | DataTable pattern reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Presentations Table Widget**: DataTable with configured columns
2. **Presentations Data Query**: Fetch from building_blocks_submissions
3. **Table Row Actions**: Edit link component

### Suggested Order
1. Presentations Data Query (get data)
2. Presentations Table Widget (display data)
3. Table Row Actions (enable navigation)

---

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify table renders with presentations

# Verify edit links work
# Click edit link, verify navigation to outline editor
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./S2072.I5.F*-Feature-*/` (created in next phase)
- Reference: `packages/ui/src/makerkit/data-table.tsx` (DataTable component)
- Reference: `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts` (query pattern)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (table pattern)
