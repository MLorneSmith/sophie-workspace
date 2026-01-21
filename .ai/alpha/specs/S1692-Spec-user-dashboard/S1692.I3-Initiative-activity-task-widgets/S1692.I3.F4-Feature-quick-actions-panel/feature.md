# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I3 |
| **Feature ID** | S1692.I3.F4 |
| **Status** | Draft |
| **Estimated Days** | 4-5 |
| **Priority** | 4 |

## Description
A contextual actions panel displaying 3-5 prioritized CTAs based on user state (new user, active learner, power user). Determines which actions to show by analyzing course progress, assessment status, and presentation count, then renders them as actionable cards.

## User Story
**As a** SlideHeroes user
**I want to** see relevant next actions personalized to my progress
**So that** I can quickly take the most impactful action without searching through menus

## Acceptance Criteria

### Must Have
- [ ] CTA state logic determining user type (new/active/power)
- [ ] Priority-based action selection (3-5 actions)
- [ ] CardButton grid with icons and descriptions
- [ ] Links to relevant pages (course, assessment, storyboard, kanban)
- [ ] Responsive grid (1-col mobile, 2-col tablet, 3-col desktop)

### Nice to Have
- [ ] Animate action cards on hover
- [ ] Track CTA clicks for analytics
- [ ] A/B test different CTA orders

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `quick-actions-panel.tsx` (Server) | New |
| **UI** | `quick-action-item.tsx` (Client) | New |
| **Logic** | `user-cta-state.loader.ts` | New |
| **Data** | User progress from multiple tables | Existing |
| **Database** | course_progress, survey_responses, etc. | Existing |

## Architecture Decision

**Approach**: Server Loader + Server Panel + Client Items
**Rationale**: Server-side CTA logic enables optimal data fetching (parallel queries) and personalization without exposing business logic to client. Client component handles dynamic icon imports and interactions.

### Key Architectural Choices
1. `loadUserCTAState()` fetches all progress data with `Promise.all()`
2. `buildCTAActions()` determines state and prioritizes actions
3. Server component renders grid, passes actions to client items
4. Client component imports icons dynamically from lucide-react

### Trade-offs Accepted
- Server component cannot track clicks (would need separate client analytics)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card | @kit/ui/card | Standard widget container |
| Action Card | CardButton | @kit/ui/card-button | Interactive navigation card |
| Icons | Lucide | lucide-react | Action type icons |
| Link | Link | next/link | Navigation wrapper |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- None

### Blocked By
- None (queries existing progress tables directly)

### Parallel With
- F1: Kanban Summary Widget
- F2: Activity Data Aggregation

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/user-cta-state.loader.ts` - CTA state determination
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Server component
- `apps/web/app/home/(user)/_components/quick-action-item.tsx` - Client action card

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CTA state loader**: Fetch progress data, determine state
2. **Implement action prioritization**: Build sorted action list
3. **Create quick action item**: Client card with dynamic icon
4. **Create quick actions panel**: Server grid layout
5. **Add all action definitions**: Continue Course, Assessment, etc.
6. **Test user states**: Verify correct actions per state
7. **Style responsive grid**: Mobile/tablet/desktop layouts

### Suggested Order
1. Create CTA state loader with state determination
2. Implement action prioritization logic
3. Create client action item component
4. Create server panel component
5. Test all user state scenarios
6. Style and polish

## User State Logic

| State | Criteria | Actions Shown |
|-------|----------|---------------|
| `new_user` | No course started, no assessment | 5 actions: Assessment first |
| `active_learner` | Course OR assessment started | 5 actions: Continue activity |
| `power_user` | Course + assessment + storyboards | 3 actions: Advanced features |

## Action Definitions

| Key | Label | Description | Href | Priority (new/active/power) |
|-----|-------|-------------|------|----------------------------|
| `take_assessment` | Take Assessment | Discover strengths | /home/assessment | 1/10/10 |
| `start_course` | Start Course | Begin learning | /home/course | 2/10/10 |
| `continue_course` | Continue Learning | Resume progress | /home/course | 10/2/4 |
| `create_storyboard` | Create Storyboard | Build presentation | /home/ai/storyboard | 3/3/1 |
| `view_kanban` | View Task Board | Track tasks | /home/kanban | 9/4/3 |

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual test (manual)
# 1. Test as new user (no data) - should see 5 actions
# 2. Test as active learner - should see continue actions
# 3. Test as power user - should see 3 advanced actions
# 4. Click each action - verify navigation
```

## Related Files
- Initiative: `../initiative.md`
- CardButton: `packages/ui/src/makerkit/card-button.tsx`
- Paths config: `apps/web/config/paths.config.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
