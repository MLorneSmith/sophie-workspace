# Initiative: Presentation Table & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1815 |
| **Initiative ID** | S1815.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 5 |

---

## Description
Implement the full-width presentations table widget with edit links, comprehensive empty states for all widgets, accessibility compliance (WCAG 2.1 AA), and E2E test coverage for the dashboard happy path.

## Business Value
Presentations table provides quick access to user's work products without navigation. Empty states guide new users toward first actions, improving onboarding. Accessibility ensures all users can access the dashboard. E2E tests ensure reliability and prevent regressions.

---

## Scope

### In Scope
- [x] Presentations Table Widget
  - Full-width table of user presentations
  - Columns: Title, Audience, Type, Updated, Actions
  - Sort by updated_at descending
  - "Edit" link to outline editor
  - Pagination (limit 10 initially)
  - Empty state for no presentations
- [x] Empty States Polish
  - Consistent empty state design across all 7 widgets
  - Compelling CTAs directing to appropriate actions
  - Empty state illustrations (optional)
- [x] Accessibility Compliance
  - Keyboard navigation for all interactive elements
  - Screen reader support with ARIA labels
  - Focus management within widgets
  - Color contrast compliance (WCAG 2.1 AA)
  - Skip links for dashboard sections
- [x] E2E Test Coverage
  - Dashboard happy path test
  - Widget rendering verification
  - Empty state scenarios
  - Navigation and interaction tests
- [x] Performance Validation
  - LCP < 1.5s on desktop, < 2.5s on mobile
  - Lighthouse audit passing

### Out of Scope
- [ ] Inline editing of presentations
- [ ] Presentation preview modal
- [ ] Drag-and-drop table reordering
- [ ] Presentation export functionality

---

## Dependencies

### Blocks
- None (final polish initiative)

### Blocked By
- S1815.I1: Dashboard Foundation (provides page structure)
- S1815.I2: Progress & Assessment Widgets (empty states need context)
- S1815.I3: Activity & Task Widgets (empty states need context)
- S1815.I4: Coaching Integration (empty states need context)

### Parallel With
- None (should be the last initiative to complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing DataTable component; established a11y patterns |
| External dependencies | Low | No external APIs; uses building_blocks_submissions table |
| Unknowns | Low | Clear requirements; existing components to leverage |
| Reuse potential | High | DataTable, EmptyState components already exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Presentation Table Widget**: DataTable with presentations data, edit links, pagination
2. **Empty States Polish**: Consistent empty state design and CTAs for all widgets
3. **Accessibility Compliance**: Keyboard nav, ARIA labels, focus management, skip links
4. **E2E Dashboard Tests**: Playwright tests for dashboard happy path and edge cases

### Suggested Order
1. Presentation Table Widget first (last visible widget)
2. Empty States Polish second (depends on seeing all widgets)
3. Accessibility Compliance third (audit all widgets)
4. E2E Tests fourth (requires completed dashboard)

---

## Validation Commands
```bash
# Verify table renders
pnpm typecheck
pnpm dev
# Navigate to /home with presentation data

# Accessibility audit
# Run Lighthouse in Chrome DevTools
# Target: Accessibility score > 90

# E2E tests
pnpm test:e2e --grep dashboard

# Performance audit
# Run Lighthouse performance audit
# Target: LCP < 1.5s on desktop

# Keyboard navigation test
# Tab through all interactive elements
# Verify focus visible and logical order
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `packages/ui/src/makerkit/data-table.tsx`
- Reference: `packages/ui/src/makerkit/empty-state.tsx`
- Schema: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- E2E: `apps/e2e/` (test directory)
