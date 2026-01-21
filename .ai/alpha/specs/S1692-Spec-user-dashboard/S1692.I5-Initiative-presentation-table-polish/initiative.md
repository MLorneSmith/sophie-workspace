# Initiative: Presentation Table & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1692 |
| **Initiative ID** | S1692.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 5 |

---

## Description
Implement the Presentation Outline Table widget (full-width, bottom row) and complete final polish including comprehensive empty states, accessibility audit, performance optimization, and E2E testing for the entire dashboard.

## Business Value
The presentation table provides quick access to user-created content, the core output of the SlideHeroes platform. Polish and testing ensure production quality, accessibility compliance (WCAG 2.1 AA), and performance targets (<2s LCP).

---

## Scope

### In Scope
- [x] Presentation Outline Data Table widget
- [x] Table columns: Title, Type, Updated, Actions (Edit/View)
- [x] "New Presentation" CTA button
- [x] Links to presentation editor/viewer
- [x] Empty state for no presentations
- [x] Final polish on all empty states across widgets
- [x] Loading skeleton refinements
- [x] Accessibility audit and fixes (WCAG 2.1 AA)
- [x] Performance optimization (LCP < 2s)
- [x] E2E test for dashboard page load
- [x] Unit tests for data loaders

### Out of Scope
- [ ] Presentation creation flow (existing feature)
- [ ] Presentation editing (existing feature)
- [ ] Bulk actions on presentations
- [ ] Presentation search/filter

---

## Dependencies

### Blocks
- None (final initiative)

### Blocked By
- S1692.I1: Dashboard Foundation (needs grid layout)
- S1692.I2: Progress & Assessment Widgets (for full E2E test)
- S1692.I3: Activity & Task Widgets (for full E2E test)
- S1692.I4: Coaching Integration (for full E2E test)

### Parallel With
- None (must wait for all widgets to be complete for E2E tests)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Uses existing shadcn DataTable pattern |
| External dependencies | Low | Data from building_blocks_submissions table |
| Unknowns | Low | All patterns established |
| Reuse potential | Low | Table is dashboard-specific |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Presentation Table Widget**: DataTable with building_blocks_submissions data
2. **Table Data Loader**: Add presentations to dashboard loader
3. **Empty States Audit**: Review and finalize all widget empty states
4. **Accessibility Audit**: WCAG 2.1 AA compliance check
5. **E2E Dashboard Test**: Playwright test for dashboard page

### Suggested Order
1. Table Data Loader (data foundation)
2. Presentation Table Widget (main feature)
3. Empty States Audit (polish)
4. Accessibility Audit (compliance)
5. E2E Dashboard Test (validation)

---

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests
pnpm --filter web test:unit

# E2E tests
pnpm --filter web-e2e test:e2e -- --grep "dashboard"

# Performance audit (manual)
# Use Lighthouse in Chrome DevTools on /home route
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-slug>/` (created in next phase)
- Building blocks table: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- DataTable: `packages/ui/src/shadcn/data-table.tsx`
- E2E patterns: `apps/e2e/tests/`
