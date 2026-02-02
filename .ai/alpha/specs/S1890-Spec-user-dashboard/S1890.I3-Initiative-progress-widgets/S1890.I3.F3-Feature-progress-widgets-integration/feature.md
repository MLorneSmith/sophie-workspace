# Feature: Progress Widgets Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I3 |
| **Feature ID** | S1890.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description
Create a container component that integrates the Skills Spider Diagram (F1) and Course Progress Radial Chart (F2) into the dashboard page. The component provides responsive grid layout and handles data prop distribution to child components. Also modifies the main dashboard page to render the progress widgets section.

## User Story
**As a** SlideHeroes learner
**I want to** see my course progress and skills assessment side-by-side on my dashboard
**So that** I can understand my overall learning status at a glance

## Acceptance Criteria

### Must Have
- [ ] ProgressWidgets component renders F1 and F2 in responsive grid
- [ ] Mobile (< 1024px): Single column, stacked widgets
- [ ] Desktop (>= 1024px): Two columns, side-by-side widgets
- [ ] Data props passed correctly to child components
- [ ] Handles null data gracefully (passes null to children for their empty states)
- [ ] Dashboard page (page.tsx) imports and renders ProgressWidgets
- [ ] Placeholder data structure in place for I2 integration

### Nice to Have
- [ ] Section header for "Progress" widget group
- [ ] Loading skeleton wrapper

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ProgressWidgets container, page.tsx update | New |
| **Logic** | Props distribution, responsive layout | New |
| **Data** | Placeholder data structure for I2 | New |
| **Database** | N/A - container only | N/A |

## Architecture Decision

**Approach**: Minimal - Simple container with grid layout
**Rationale**: This is purely a layout and integration feature. Keep it minimal with no business logic. The complexity is in F1 and F2.

### Key Architectural Choices
1. Thin container component - only handles layout and prop distribution
2. Responsive grid using Tailwind classes (grid-cols-1 lg:grid-cols-2)
3. No loading/error states in container (delegated to child components)
4. Placeholder data structure matches expected I2 loader output shape

### Trade-offs Accepted
- Placeholder data until I2 is complete (marked with TODO comments)
- No loading skeleton in v1 (I7 will add polish)
- Container is client component (due to importing client chart components)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Grid layout | Tailwind grid | tailwindcss | Simple, responsive |
| Child charts | SkillsSpiderDiagram, CourseProgressChart | F1, F2 | Import and render |
| Section spacing | gap-6 class | tailwindcss | Consistent with dashboard |

**Components to Install**: None

## Required Credentials
> Environment variables required for this feature to function.

None required - layout container only.

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs complete widget structure)

### Blocked By
- F1: Skills Spider Diagram (needs component to import)
- F2: Course Progress Radial Chart (needs component to import)
- S1890.I1.F1: Dashboard page structure (needs PageBody to render in)

### Parallel With
- None (depends on F1 and F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/progress-widgets.tsx` - Container component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add ProgressWidgets to PageBody

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create ProgressWidgets component**: Container with props interface
2. **Implement responsive grid**: grid-cols-1 lg:grid-cols-2 layout
3. **Import and render F1 and F2**: Pass data props to children
4. **Update page.tsx**: Import ProgressWidgets, add placeholder data
5. **Add TODO comments**: Mark I2 integration points
6. **Verify typecheck**: Ensure all imports resolve

### Suggested Order
T1 (scaffold) → T2 (grid) → T3 (children) → T4 (page update) → T5 (TODOs) → T6 (verify)

## Validation Commands
```bash
# Verify container exists
test -f apps/web/app/home/\(user\)/_components/progress-widgets.tsx && echo "✓ Container exists"

# Imports F1 and F2
grep -q "SkillsSpiderDiagram\|skills-spider-diagram" apps/web/app/home/\(user\)/_components/progress-widgets.tsx && echo "✓ Imports F1"
grep -q "CourseProgressChart\|course-progress-chart" apps/web/app/home/\(user\)/_components/progress-widgets.tsx && echo "✓ Imports F2"

# Page imports ProgressWidgets
grep -q "ProgressWidgets\|progress-widgets" apps/web/app/home/\(user\)/page.tsx && echo "✓ Page integration"

# Has responsive grid
grep -q "grid-cols-1.*lg:grid-cols-2\|lg:grid-cols-2" apps/web/app/home/\(user\)/_components/progress-widgets.tsx && echo "✓ Responsive grid"

# Typecheck passes
pnpm typecheck

# Visual verification
# Start dev server: pnpm dev
# Navigate to /home
# Verify:
# - Both widgets render (with empty states if no data)
# - Desktop: side-by-side layout
# - Mobile (resize browser): stacked layout
```

## Related Files
- Initiative: `../initiative.md`
- F1 component: `../S1890.I3.F1-Feature-skills-spider-diagram/`
- F2 component: `../S1890.I3.F2-Feature-course-progress-radial/`
- Dashboard page: `apps/web/app/home/(user)/page.tsx`
