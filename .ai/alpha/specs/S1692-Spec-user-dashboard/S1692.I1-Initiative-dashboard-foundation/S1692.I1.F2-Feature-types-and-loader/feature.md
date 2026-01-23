# Feature: Dashboard TypeScript Types & Data Loader Infrastructure

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I1 |
| **Feature ID** | S1692.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Define TypeScript interfaces for all 7 dashboard widgets and create the unified data loader infrastructure with parallel fetching using `Promise.all()`. The loader initially returns empty/default data for each widget, enabling immediate widget component development while real database queries are added incrementally in later initiatives.

## User Story
**As a** developer building dashboard widgets
**I want to** have type-safe data contracts and a loader infrastructure
**So that** I can develop widgets with predictable data shapes and the page can fetch all widget data efficiently

## Acceptance Criteria

### Must Have
- [ ] TypeScript interfaces defined for all 7 widget data types
- [ ] `DashboardData` aggregate type exported using `Awaited<ReturnType<>>` pattern
- [ ] `loadDashboardPageData` function created with React `cache()` wrapper
- [ ] Parallel fetching implemented with `Promise.all()` for 7 widget loaders
- [ ] `"server-only"` directive at top of loader file
- [ ] Individual loader functions return empty/default data (placeholder)
- [ ] Error handling pattern established with `createServiceLogger`
- [ ] Loader file at `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts`
- [ ] TypeScript compiles without errors (`pnpm typecheck` passes)

### Nice to Have
- [ ] JSDoc comments on interfaces explaining each field
- [ ] Commented-out example queries showing future implementation pattern

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (types/loader only) | N/A |
| **Logic** | dashboard-page.loader.ts | New |
| **Data** | TypeScript interfaces | New |
| **Database** | N/A (empty data initially) | N/A |

## Architecture Decision

**Approach**: Pragmatic - Complete types with empty loader implementation
**Rationale**: Types are the contract needed for widget development. Loader infrastructure enables page integration immediately. Real database queries will be added incrementally per widget in later features (I2-I5).

### Key Architectural Choices
1. Types and loader in same file - co-located for maintainability
2. React `cache()` for per-request memoization
3. Graceful degradation - each loader catches errors and returns empty state
4. Follow `members-page.loader.ts` pattern exactly

### Trade-offs Accepted
- Empty data initially means dashboard shows placeholders - acceptable for foundation
- All types defined upfront even though widgets come later - ensures stable contracts

## Component Strategy

No UI components - this is a types and data layer feature.

## Dependencies

### Blocks
- F3: Grid Layout (will eventually consume loader data)
- All I2-I5 widget implementations (will implement real queries)

### Blocked By
- F1: Dashboard Page Shell (loader integrates with page.tsx)

### Parallel With
- F3: Grid Layout (can develop in parallel after F1 completes)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Main loader with types

### Modified Files
- None for this feature (page.tsx integration done in F3)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create _lib/server directory**: Ensure directory structure exists
2. **Define widget interfaces**: Create interfaces for all 7 widgets
3. **Create main loader function**: Implement loadDashboardPageData with cache()
4. **Implement individual loaders**: Create 7 empty loader functions
5. **Add error handling**: Setup createServiceLogger pattern
6. **Export types**: Add DashboardData type export
7. **Verify types**: Run pnpm typecheck

### Suggested Order
1. Create _lib/server directory
2. Define widget interfaces (all 7)
3. Create main loader function
4. Implement individual loaders (empty returns)
5. Add error handling
6. Export types
7. Verify types

## Type Definitions

### Widget Data Interfaces

```typescript
// Progress Overview Widget
interface ProgressOverviewData {
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
  currentLessonTitle: string | null;
}

// Recent Activity Widget
interface RecentActivityData {
  activities: Activity[];
  hasMore: boolean;
}

interface Activity {
  id: string;
  type: 'lesson_completed' | 'quiz_completed' | 'presentation_created' | 'presentation_updated' | 'assessment_completed';
  title: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Upcoming Tasks Widget
interface UpcomingTasksData {
  doingTasks: Task[];
  nextTask: Task | null;
  taskCounts: { do: number; doing: number; done: number; };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'do' | 'doing' | 'done';
  priority?: string;
  dueDate?: string | null;
}

// Skills Radar Widget
interface SkillsRadarData {
  categoryScores: CategoryScore[];
  completedAt: string | null;
}

interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

// Presentations Table Widget
interface PresentationsTableData {
  presentations: Presentation[];
  totalCount: number;
}

interface Presentation {
  id: string;
  title: string;
  type: string | null;
  audience: string | null;
  slideCount: number;
  status: 'draft' | 'complete';
  updatedAt: string;
}

// Coaching Sessions Widget
interface CoachingSessionsData {
  upcomingSessions: CoachingSession[];
  hasActiveSessions: boolean;
}

interface CoachingSession {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  meetingLink: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Quick Actions Widget
interface QuickActionsData {
  hasCourseProgress: boolean;
  hasAssessment: boolean;
  hasPresentations: boolean;
  hasActiveTasks: boolean;
}
```

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Verify file exists
ls apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts
```

## Related Files
- Initiative: `../initiative.md`
- Reference loader: `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts`
- Type export pattern: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts`
- Logging: `@kit/shared/logger`
