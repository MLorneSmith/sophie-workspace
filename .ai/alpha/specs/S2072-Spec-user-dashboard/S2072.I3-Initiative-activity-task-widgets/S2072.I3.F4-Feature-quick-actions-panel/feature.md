# Feature: Quick Actions Panel

## Description

Context-aware panel displaying relevant CTAs based on user state. Shows "Continue Course" if in progress, "Take Assessment" if not completed, "New Presentation" always, and "Review Storyboard" if drafts exist. Uses established button patterns from the codebase.

## User Story
**As a** learner visiting the dashboard
**I want to** see quick actions relevant to my current state
**So that** I can take the most important next action with one click

## Acceptance Criteria

### Must Have
- [ ] Display "Continue Course" button when course in progress (variant="default" primary)
- [ ] Display "New Presentation" button always (variant="outline")
- [ ] Display "Take Assessment" button when assessment not completed (variant="outline")
- [ ] Display "Review Storyboard" button when presentation drafts exist (variant="outline")
- [ ] Button asChild + Link pattern for navigation
- [ ] Card wrapper with header "Quick Actions"
- [ ] Context determination from dashboard loader data

### Nice to Have
- [ ] Icon for each action (lucide-react)
- [ ] Hover effects on buttons

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | QuickActionsPanel component | New |
| **Logic** | Context determination logic | New |
| **Data** | Uses dashboard loader data | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Server component with conditional rendering

**Rationale**: Quick actions should be determined server-side based on user state to avoid client-side complexity and improve initial render. Follows established button patterns from assessment page and AI workspace.

### Key Architectural Choices
1. Server component (no `use client`) for zero client overhead
2. Receive context props from parent (courseProgress, assessmentCompleted, hasPresentationDrafts)
3. Use buttonVariants() utility for consistent styling
4. Button asChild + Link pattern for navigation

### Trade-offs Accepted
- Static actions (no dynamic state changes without page refresh)
- No analytics tracking on button clicks (could be added later)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses data passed from parent | N/A |

> If no external credentials required, note "None required" below:
> Panel receives context props - no direct data fetching required.

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs quick actions for empty state design

### Blocked By
- S2072.I1.F3 (Dashboard Data Loader) - needs context data (course progress, assessment status)
- S2072.I1.F2 (Responsive Grid Layout) - needs grid slot

### Parallel With
- S2072.I3.F2 (Activity Feed Widget)
- S2072.I3.F3 (Kanban Summary Widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Quick actions component

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add context flags if not present
- `apps/web/app/home/(user)/page.tsx` - Add quick actions to dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define Context Props Interface**: Props for courseProgress, assessmentCompleted, hasPresentationDrafts
2. **Create Action Button Component**: Reusable button with icon, label, href, variant
3. **Create Context Determination Logic**: Order actions by priority (continue > start)
4. **Create Panel Component**: Card wrapper with header, action buttons grid
5. **Add Context Data to Loader**: Ensure all context flags available in dashboard loader
6. **Integrate with Dashboard**: Add to grid layout with context props

### Suggested Order
1. Define Context Props Interface (type safety)
2. Create Action Button Component (building block)
3. Create Context Determination Logic (business logic)
4. Create Panel Component (assembly)
5. Add Context Data to Loader (data availability)
6. Integrate with Dashboard (connection)

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify quick actions appear with correct context

# Test context switching
# Complete course → "Continue Course" should disappear
# Take assessment → "Take Assessment" should disappear
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/(user)/assessment/page.tsx` (context-aware button pattern)
- Reference: `apps/web/app/home/(user)/ai/_components/AIWorkspaceDashboard.tsx` (action cards pattern)
- Reference: `packages/ui/src/shadcn/button.tsx` (buttonVariants)
