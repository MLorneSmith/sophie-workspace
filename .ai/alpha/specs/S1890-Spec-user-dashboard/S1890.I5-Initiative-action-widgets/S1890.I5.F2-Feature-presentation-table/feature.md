# Feature: Presentation Outline Table

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I5 |
| **Feature ID** | S1890.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 4-5 |
| **Priority** | 2 |

## Description
Implement a full-width Presentation Outline Table widget that displays the user's building blocks submissions (presentations) in a DataTable format. Shows title, last updated date, slides count, status, and an "Edit Outline" action button for each row. Includes a "New Presentation" action in the table footer.

## User Story
**As a** SlideHeroes user with presentation drafts
**I want to** see all my presentations in one table with quick edit access
**So that** I can easily find and continue working on any presentation

## Acceptance Criteria

### Must Have
- [ ] Presentation Table component renders full-width in dashboard grid (row 3)
- [ ] Table displays columns: Title, Last Updated, Slides Count, Status, Actions
- [ ] "Edit Outline" button in Actions column links to `/home/ai/canvas?id={id}`
- [ ] "New Presentation" button in table footer/header links to `/home/ai/new`
- [ ] Table shows most recent presentations first (sorted by updated_at DESC)
- [ ] Responsive behavior: cards on mobile (<768px), table on tablet/desktop
- [ ] Maximum 10 presentations shown initially (pagination if >10)
- [ ] Dark mode support via semantic Tailwind classes

### Nice to Have
- [ ] Hover row highlighting
- [ ] "View Storyboard" secondary action
- [ ] Status badge with appropriate colors (Draft=yellow, Complete=green)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | PresentationTable.tsx | New |
| **UI** | PresentationCard.tsx (mobile) | New |
| **Logic** | Column definitions, sorting | New |
| **Data** | Uses building_blocks_submissions from loader | Existing (from I2) |
| **Database** | No direct DB access (uses loader data) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing DataTable component from @kit/ui for table structure. Use responsive pattern with conditional rendering for mobile cards vs desktop table. Server component receives data from dashboard loader.

### Key Architectural Choices
1. Use existing DataTable component with custom column definitions
2. Server component for main table, no client-side data fetching
3. Mobile responsive: Use `hidden md:block` / `block md:hidden` pattern for table vs cards
4. Column definitions follow TanStack Table patterns already in codebase
5. Slides count derived from storyboard JSON length (if available) or default to 0

### Trade-offs Accepted
- No real-time updates (acceptable for v1 - refresh shows new data)
- No sorting/filtering UI (keep simple, can add in future)
- Slides count may be 0 for presentations without storyboard yet

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Table structure | DataTable | @kit/ui/makerkit | Feature-rich, consistent with codebase |
| Container | Card, CardHeader, CardContent | shadcn/ui | Wraps table for consistent widget style |
| Action buttons | Link + buttonVariants | shadcn/ui | Standard navigation pattern |
| Status badge | Badge | shadcn/ui | Visual status indicator |
| Mobile cards | Card | shadcn/ui | Responsive presentation cards |
| Empty state | EmptyState | @kit/ui/makerkit | Consistent empty pattern |

**Components to Install**: None - all components available

## Required Credentials
> Environment variables required for this feature to function.

None required - all internal data and routing.

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs table structure for empty state)

### Blocked By
- S1890.I1.F1: Dashboard Page Layout (needs grid container)
- S1890.I2.F1: Dashboard Types (needs type definitions for submissions)
- S1890.I2.F2: Dashboard Data Loader (needs building_blocks_submissions data)
- S1890.I5.F1: Quick Actions Panel (F2 is lower priority, implement after F1)

### Parallel With
- S1890.I3: Progress Widgets (different widget area)
- S1890.I4: Task & Activity Widgets (different widget area)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentation-table.tsx` - Main table component
- `apps/web/app/home/(user)/_components/presentation-table-columns.tsx` - Column definitions
- `apps/web/app/home/(user)/_components/presentation-mobile-card.tsx` - Mobile card variant

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place PresentationTable in grid
- `apps/web/locales/en/home.json` - Add i18n translations for table headers and actions

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define column configuration**: Create column definitions for DataTable
2. **Create PresentationTable component**: Main component with DataTable integration
3. **Create mobile card variant**: Responsive card component for mobile view
4. **Add i18n translations**: Translation keys for headers and actions
5. **Integrate into dashboard page**: Import and place in full-width grid position
6. **Add responsive switching**: Toggle between table and cards based on viewport

### Suggested Order
1. Column definitions → 2. Table component → 3. Mobile cards → 4. Responsive logic → 5. i18n → 6. Integration

## Validation Commands
```bash
# Verify component exists
test -f apps/web/app/home/\(user\)/_components/presentation-table.tsx && echo "✓ Component exists"

# Check for DataTable usage
grep -q "DataTable" apps/web/app/home/\(user\)/_components/presentation-table.tsx && echo "✓ Uses DataTable"

# Check component is imported in page
grep -q "PresentationTable" apps/web/app/home/\(user\)/page.tsx && echo "✓ Integrated in page"

# Check for Edit Outline link
grep -qE "/home/ai/canvas\?id=" apps/web/app/home/\(user\)/_components/presentation-table.tsx && echo "✓ Edit link"

# Run typecheck
pnpm typecheck

# Visual verification
pnpm --filter web dev
# Navigate to /home and verify:
# - Table renders with correct columns
# - Edit Outline links work
# - New Presentation button works
# - Responsive: cards on mobile, table on desktop
```

## Related Files
- Initiative: `../initiative.md`
- Dashboard loader: `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts`
- DataTable component: `packages/ui/src/makerkit/data-table.tsx`
- Existing query pattern: `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts`
- Building blocks schema: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Target edit route: `apps/web/app/home/(user)/ai/canvas/page.tsx`

## Data Shape Reference

The `building_blocks_submissions` table provides:
```typescript
interface BuildingBlocksSubmission {
  id: string;
  user_id: string;
  title: string;
  audience: string | null;
  presentation_type: string | null;
  question_type: string | null;
  situation: string | null;
  complication: string | null;
  answer: string | null;
  outline: string | null;
  storyboard: Json | null; // Array of slide objects
  created_at: string;
  updated_at: string;
}
```

**Derived Fields:**
- `slidesCount`: `Array.isArray(storyboard) ? storyboard.length : 0`
- `status`: `storyboard?.length > 0 ? 'Complete' : 'Draft'`
