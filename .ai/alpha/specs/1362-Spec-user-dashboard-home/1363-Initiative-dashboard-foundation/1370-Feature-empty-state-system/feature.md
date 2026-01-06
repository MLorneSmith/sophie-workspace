# Feature: Empty State System

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1363 |
| **Feature ID** | 1363-F4 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 4 |

## Description
Create a configurable empty state component system for dashboard cards. Each card type (presentations, course progress, submissions, surveys) has a unique empty state with contextual icon, heading, description, and CTA button. Empty states guide new users to take their first action and prevent blank, confusing cards.

## User Story
**As a** new SlideHeroes user with no data
**I want to** see helpful guidance when dashboard cards are empty
**So that** I understand what each section is for and how to get started

## Acceptance Criteria

### Must Have
- [ ] Shared DashboardEmptyState component with configurable props
- [ ] 5 empty state variants: presentations, course, submissions, surveys, generic
- [ ] Each variant has: Contextual icon, Heading, Description, CTA button
- [ ] CTA buttons navigate to correct create/start pages
- [ ] Uses existing @kit/ui/empty-state as base
- [ ] Passes `pnpm typecheck` with no errors

### Nice to Have
- [ ] Subtle background illustration or pattern
- [ ] Animated entrance when component mounts
- [ ] Accessibility: proper heading hierarchy and aria labels

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardEmptyState component | New |
| **Logic** | Config mapping for variants | New |
| **Data** | None (stateless component) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Pragmatic - Extend existing @kit/ui/empty-state with dashboard-specific config
**Rationale**: Existing EmptyState component from @kit/ui provides structure. Adding a config layer for dashboard variants keeps code DRY and easy to extend.

### Key Architectural Choices
1. Single component with `type` prop for variant selection
2. Static config object maps type to icon/heading/description/cta
3. Optional prop overrides for custom messages

### Trade-offs Accepted
- Fixed variant list (new types require code change)
- Same visual structure for all variants (acceptable for consistency)

## Dependencies

### Blocks
- None

### Blocked By
- 1363-F1: Dashboard Page & Grid (needs grid slot context)

### Parallel With
- 1363-F2: Presentation Outline Table (uses empty state for no presentations)
- 1363-F3: Quick Actions Panel (no direct dependency)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-empty-state.tsx` - Component
- `apps/web/app/home/(user)/_components/__tests__/dashboard-empty-state.test.tsx` - Tests

### Modified Files
- `apps/web/public/locales/en/common.json` - Add empty state translations
- `apps/web/app/home/(user)/_components/presentation-outline-table.tsx` - Use empty state (F2)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create empty state component**: Base structure with @kit/ui/empty-state
2. **Define variant config map**: Type → icon/heading/description/cta mapping
3. **Implement type prop logic**: Select config based on type
4. **Add CTA button with navigation**: Link to create/start pages
5. **Add translations**: i18n keys for all empty state text
6. **Write component tests**: Test each variant renders correctly
7. **Integrate with other features**: Use in presentation table, other cards

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7

## Validation Commands
```bash
# Check TypeScript types
pnpm typecheck

# Run component tests
pnpm --filter web test:unit -- dashboard-empty-state

# Visual check (manual)
# Clear user data and visit http://localhost:3000/home

# Test each variant (manual)
# Render component with each type prop value
```

## Related Files
- Initiative: `../initiative.md`
- Base component: `packages/ui/src/makerkit/empty-state.tsx`
- Icons: `lucide-react` (FileText, BookOpen, ClipboardList, MessagesSquare)
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
