# Initiative: Dashboard Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 1 |

---

## Description
Establish the foundational page structure, responsive grid layout, and navigation integration for the user dashboard at `/home/(user)/page.tsx`. This initiative creates the skeleton that all subsequent widget initiatives will build upon.

## Business Value
Provides the structural foundation for the entire dashboard feature. Without this, no widgets can be placed or displayed. Enables parallel development of widget initiatives once complete.

---

## Scope

### In Scope
- [x] Replace empty `/home/(user)/page.tsx` with dashboard page structure
- [x] Implement responsive 3-3-1 grid layout (mobile/tablet/desktop breakpoints)
- [x] Create dashboard page header with title and description
- [x] Set up PageBody container with proper spacing
- [x] Configure page metadata and i18n translations
- [x] Add loading skeleton placeholders for widgets
- [x] Implement dark mode support via semantic Tailwind classes

### Out of Scope
- [ ] Individual widget implementations (handled by I3-I6)
- [ ] Data fetching logic (handled by I2)
- [ ] Empty state designs (handled by I7)
- [ ] Cal.com integration (handled by I6)

---

## Dependencies

### Blocks
- S1890.I3: Progress Widgets (needs grid layout)
- S1890.I4: Task & Activity Widgets (needs grid layout)
- S1890.I5: Action Widgets (needs grid layout)
- S1890.I6: Coaching Integration (needs grid layout)
- S1890.I7: Empty States & Polish (needs page structure)

### Blocked By
- None (foundation initiative)

### Parallel With
- S1890.I2: Data Layer (can develop concurrently)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing Page/Card components available; grid layout is straightforward Tailwind CSS |
| External dependencies | Low | No external APIs or services |
| Unknowns | Low | Patterns well-established in codebase (see course page, team dashboard) |
| Reuse potential | High | PageBody, HomeLayoutPageHeader, Card components all exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page & Layout**: Create page.tsx with responsive grid, PageBody, header integration
2. **Widget Placeholder Grid**: Implement skeleton loading states for all 7 widget positions
3. **Navigation & Routing**: Ensure dashboard is default landing for authenticated users

### Suggested Order
1. Dashboard Page & Layout (F1) - core structure
2. Widget Placeholder Grid (F2) - enables parallel widget development
3. Navigation & Routing (F3) - integration with app flow

---

## Validation Commands
```bash
# Verify page exists
test -f apps/web/app/home/\(user\)/page.tsx && echo "✓ Page exists"

# Check for responsive grid classes
grep -q "grid-cols-1.*md:grid-cols" apps/web/app/home/\(user\)/page.tsx && echo "✓ Responsive grid"

# Verify i18n integration
grep -q "withI18n" apps/web/app/home/\(user\)/page.tsx && echo "✓ i18n wrapper"

# Run typecheck
pnpm typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Existing pattern: `apps/web/app/home/[account]/page.tsx` (team dashboard)
- Layout components: `packages/ui/src/makerkit/page.tsx`
- Features: `./<feature-#>-<slug>/` (created in next phase)
