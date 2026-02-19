# Initiative: Dashboard Interactive Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2045 |
| **Initiative ID** | S2045.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 3 |

---

## Description
Build the four data-driven and interactive dashboard widgets: Recent Activity Feed (new timeline UI backed by `activity_events` table), Quick Actions Panel (conditional CTA logic across multiple tables), Coaching Sessions Card (compact Cal.com iframe embed), and Presentation Outlines Table (DataTable with edit actions). These widgets form Row 2 and Row 3 of the 3-3-1 grid.

## Business Value
Completes the full dashboard experience. The Activity Feed shows users what they've accomplished (motivation), Quick Actions reduce clicks to start the next task from 3+ to 1 (G2 goal), the Coaching Card enables session booking without navigation, and the Presentations Table provides a central hub for presentation management.

---

## Scope

### In Scope
- [ ] Recent Activity Feed component with vertical timeline UI
- [ ] Activity feed query from `activity_events` table (10 most recent, ordered by created_at)
- [ ] Quick Actions Panel with 4 conditional CTAs based on user state
- [ ] Quick Actions conditional logic: check course_progress, survey_responses, building_blocks_submissions
- [ ] Coaching Sessions Card with compact Cal.com iframe embed
- [ ] Presentation Outlines DataTable with columns: Title, Type, Last Updated, Edit action
- [ ] Wire all widgets to dashboard data loader
- [ ] Relative time formatting for activity events (e.g., "Today, 2:30 PM", "Yesterday")
- [ ] Dark mode support via semantic color classes

### Out of Scope
- [ ] Empty state designs with CTAs (I4)
- [ ] Real-time activity feed updates
- [ ] Cal.com V2 API integration for fetching bookings
- [ ] Drag-and-drop or reordering in presentations table
- [ ] Activity feed pagination (show latest 10 only)

---

## Dependencies

### Blocks
- S2045.I4: Empty states need these widgets to exist

### Blocked By
- S2045.I1: Needs page layout (grid), data loader, activity_events table, and generated TypeScript types

### Parallel With
- S2045.I2: Can run in parallel once I1 completes (no cross-dependency)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity feed needs new timeline UI (no existing component); Quick Actions has conditional logic across 4+ tables |
| External dependencies | Low | Cal.com iframe pattern already exists; DataTable from @kit/ui |
| Unknowns | Medium | Cal.com compact embed sizing needs testing; activity feed timeline visual design TBD |
| Reuse potential | Medium | Cal.com iframe pattern from coaching page; DataTable from @kit/ui; but timeline UI is new |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Recent Activity Feed**: Timeline UI component, activity_events query (10 latest), event type icons (lesson, quiz, assessment, presentation), relative time display
2. **Quick Actions Panel**: 4 conditional CTAs, multi-table state checks, Button/Card layout, contextual highlighting for most relevant action
3. **Coaching Sessions Card**: Compact Cal.com iframe embed in Card, "View Full Calendar" link to `/home/coaching`, responsive iframe sizing
4. **Presentation Outlines Table**: DataTable with column definitions, building_blocks_submissions query, "Edit Outline" action links, "New Presentation" button

### Suggested Order
1. Presentation Outlines Table (simplest — existing DataTable + straightforward query)
2. Coaching Sessions Card (existing iframe pattern, just needs compact sizing)
3. Quick Actions Panel (conditional logic, but no new UI components)
4. Recent Activity Feed (most complex — new timeline UI + new data source)

---

## Validation Commands
```bash
# Verify all components exist
ls apps/web/app/home/(user)/_components/dashboard/

# Verify TypeScript compiles
pnpm typecheck

# Verify activity events query works
# Navigate to /home and verify activity feed, quick actions, coaching, and table render

# Verify Cal.com embed loads
# Navigate to /home and check Coaching Sessions card renders iframe
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Cal.com iframe: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
- Cal.com research: `../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- DataTable: `packages/ui/src/shadcn/data-table.tsx`
- Storyboard service: `apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service.ts`
- Task schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
