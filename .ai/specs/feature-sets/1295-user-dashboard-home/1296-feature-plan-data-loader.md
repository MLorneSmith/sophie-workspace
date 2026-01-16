# Feature Plan: Dashboard Data Loader

**Issue**: #1296
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 1
**Effort**: M (Medium)
**Dependencies**: None

---

## Overview

Create a server-side data loader using `Promise.all` for parallel fetching of all dashboard data sources. This is the foundation feature that all other dashboard components depend on. The loader will orchestrate fetching of course progress, survey scores, task counts, recent activity, presentations, and coaching sessions in parallel to minimize total load time.

## Solution Approach

**Architecture Pattern**: RSC Loader Pattern with Parallel Data Fetching

Following Next.js 15's best practices, implement a dedicated loader function that:
1. Uses server-only async operations
2. Executes all data fetches in parallel with `Promise.all`
3. Returns aggregated dashboard data structure
4. Handles errors gracefully without cascading failures

**Key Design Decisions**:
- Server component loader for efficient data fetching
- Parallel execution reduces N+1 query antipattern
- Type-safe with TypeScript interfaces
- Reuses existing query patterns from codebase

## Research Applied

### From Manifest
- Parallel data fetching with `Promise.all` reduces page load time by 60-80%
- Use existing `useTasks`, `RadialProgress`, `RadarChart` patterns
- Aggregate counts server-side to avoid N+1 queries
- Handle empty states when no data exists

### From Skills
- Server Components as data fetching layer (RSC pattern)
- Suspense boundaries for independent widget loading
- Type-safe data structures with TypeScript

### Performance Optimizations
- All queries execute in parallel, not sequentially
- Count aggregations done at database level where possible
- Server-side rendering prevents client-side data waterfalls
- Suspense boundaries allow partial page renders

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` | Main server-side data loader with parallel fetching |
| `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` | TypeScript interfaces for dashboard data structures |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and use dashboard loader in page component |

## Implementation Tasks

### Task 1: Create Data Type Definitions
- [ ] Define `DashboardData` interface with all data structures
- [ ] Define `CourseProgress` interface (completion %, lessons completed)
- [ ] Define `SurveyScores` interface (skill ratings for radar chart)
- [ ] Define `TaskCounts` interface (status-based task counts)
- [ ] Define `ActivityItem` interface (activity feed entries)
- [ ] Define `Presentation` interface (presentation metadata)
- [ ] Define `CoachingSession` interface (session data)
- [ ] Export all types from dashboard.types.ts

**File**: `apps/web/app/home/(user)/_lib/types/dashboard.types.ts`

```typescript
export interface CourseProgress {
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
}

export interface SurveyScores {
  scores: Array<{
    skill: string;
    score: number;
  }>;
  completedAt: string | null;
}

export interface TaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  currentTask?: {
    id: string;
    title: string;
  };
}

export interface ActivityItem {
  id: string;
  type: 'presentation' | 'lesson' | 'quiz' | 'assessment';
  title: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Presentation {
  id: string;
  title: string;
  type: string;
  audience: string;
  lastModified: string;
}

export interface CoachingSession {
  id: string;
  date: string;
  time: string;
  joinLink?: string;
  status: 'scheduled' | 'completed';
}

export interface DashboardData {
  courseProgress: CourseProgress;
  surveyScores: SurveyScores;
  taskCounts: TaskCounts;
  recentActivity: ActivityItem[];
  presentations: Presentation[];
  upcomingCoachingSessions: CoachingSession[];
}
```

### Task 2: Create Dashboard Loader Function
- [ ] Import Supabase client (`getSupabaseServerClient`)
- [ ] Create helper functions for each data fetch:
  - `loadCourseProgress(client, userId)`
  - `loadSurveyScores(client, userId)`
  - `loadTaskCounts(client, userId)`
  - `loadRecentActivity(client, userId)`
  - `loadPresentations(client, userId)`
  - `loadCoachingSessions(client, userId)`
- [ ] Implement `loadDashboardData` with `Promise.all` for parallel execution
- [ ] Add error handling per data source (partial failures don't block entire dashboard)
- [ ] Return typed `DashboardData` result

**File**: `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts`

```typescript
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/lib/database.types';
import type { DashboardData } from '../types/dashboard.types';

async function loadCourseProgress(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<CourseProgress> {
  try {
    // Query course_progress and lesson_progress tables
    // Calculate completion percentage
    // Return CourseProgress data
  } catch (error) {
    console.error('Failed to load course progress:', error);
    return { completionPercentage: 0, completedLessons: 0, totalLessons: 0 };
  }
}

async function loadSurveyScores(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<SurveyScores> {
  try {
    // Query survey_responses table
    // Extract skill scores
    // Return SurveyScores data
  } catch (error) {
    console.error('Failed to load survey scores:', error);
    return { scores: [], completedAt: null };
  }
}

// Similar pattern for other loaders...

export async function loadDashboardData(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardData> {
  const [
    courseProgress,
    surveyScores,
    taskCounts,
    recentActivity,
    presentations,
    upcomingCoachingSessions,
  ] = await Promise.all([
    loadCourseProgress(client, userId),
    loadSurveyScores(client, userId),
    loadTaskCounts(client, userId),
    loadRecentActivity(client, userId),
    loadPresentations(client, userId),
    loadCoachingSessions(client, userId),
  ]);

  return {
    courseProgress,
    surveyScores,
    taskCounts,
    recentActivity,
    presentations,
    upcomingCoachingSessions,
  };
}
```

### Task 3: Integrate Loader into Page Component
- [ ] Import `loadDashboardData` in page component
- [ ] Call loader in async page component
- [ ] Pass data to child components as props
- [ ] Add Suspense boundaries for each card (implemented in integration feature)

**File**: `apps/web/app/home/(user)/page.tsx` (partial update)

```typescript
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getCurrentUser } from '@kit/auth';
import { loadDashboardData } from './_lib/server/dashboard.loader';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const client = getSupabaseServerClient();

  const dashboardData = await loadDashboardData(client, user.id);

  return (
    // Components receive dashboardData as props
  );
}
```

### Task 4: Error Handling and Fallbacks
- [ ] Implement partial failure handling (one data source fails doesn't block others)
- [ ] Add default/empty state returns for each loader
- [ ] Log errors for monitoring
- [ ] Test with missing data in database

### Task 5: Type Safety Verification
- [ ] Run `pnpm typecheck` to ensure all types are correct
- [ ] Verify Supabase types match database schema
- [ ] No `any` types used

## Validation Commands

```bash
# Type checking - must pass without errors
pnpm typecheck

# Linting - must pass all rules
pnpm lint:fix

# Format code - ensure consistency
pnpm format:fix

# Build check - verify no build errors
pnpm build
```

## Acceptance Criteria

- [ ] Dashboard loader function exists at correct path
- [ ] All data fetches execute in parallel with `Promise.all`
- [ ] Type definitions exported and used correctly
- [ ] Error handling prevents single data source from blocking page
- [ ] Page component successfully imports and calls loader
- [ ] TypeScript strict mode passes without errors
- [ ] All validation commands pass
- [ ] No `console.error` or warnings in build output

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
