# Initiative: Dashboard Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1815 |
| **Initiative ID** | S1815.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Establish the foundational infrastructure for the user dashboard at `/home/(user)` including the page shell, responsive 3-row grid layout, TypeScript types, server-side data loader with parallel fetching, and skeleton loading states.

## Business Value
Provides the essential UI infrastructure that all dashboard widgets depend upon. Without this foundation, no other dashboard features can be implemented. Establishes patterns for performance (< 1.5s LCP) and responsive design that will be used across all widgets.

---

## Scope

### In Scope
- [x] Dashboard page component at `/home/(user)/page.tsx`
- [x] Responsive grid layout (3-3-1 pattern: desktop 3 cols, tablet 2 cols, mobile 1 col)
- [x] TypeScript types for all widget data structures
- [x] Unified data loader with parallel `Promise.all()` fetching
- [x] Skeleton loading states for entire dashboard grid
- [x] Page header with title and description (i18n ready)
- [x] Integration with existing `UserWorkspaceContextProvider`

### Out of Scope
- [ ] Individual widget implementations (handled in I2-I5)
- [ ] Cal.com API integration
- [ ] Real-time updates (WebSockets)
- [ ] Widget customization or drag-and-drop

---

## Dependencies

### Blocks
- S1815.I2: Progress & Assessment Widgets (needs grid layout and types)
- S1815.I3: Activity & Task Widgets (needs grid layout and types)
- S1815.I4: Coaching Integration (needs grid layout and types)
- S1815.I5: Presentation Table & Polish (needs page structure)

### Blocked By
- None (foundation initiative)

### Parallel With
- None (must complete before all other initiatives)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing patterns in codebase (load-user-workspace.ts, dashboard-demo-charts.tsx) |
| External dependencies | Low | No external APIs; uses existing Supabase client |
| Unknowns | Low | Clear requirements from spec; established patterns to follow |
| Reuse potential | High | Loader patterns, grid layouts, Card/Skeleton components all exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page Shell**: Create page.tsx, loading.tsx, and page header component following existing patterns
2. **TypeScript Types & Data Loader**: Define dashboard types and create cached parallel loader function
3. **Responsive Grid Layout**: Implement 3-row responsive grid using Tailwind breakpoints
4. **Skeleton Loading States**: Create dashboard-specific skeleton component for loading state

### Suggested Order
1. Types & Loader first (defines data contracts)
2. Page Shell second (uses loader)
3. Grid Layout third (renders widget placeholders)
4. Skeleton Loading fourth (polish for loading state)

---

## Validation Commands
```bash
# Verify page exists and builds
pnpm typecheck

# Test page loads without errors
pnpm dev
# Navigate to /home and verify dashboard renders

# Verify loader fetches data
# Check browser DevTools Network tab for parallel requests
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
