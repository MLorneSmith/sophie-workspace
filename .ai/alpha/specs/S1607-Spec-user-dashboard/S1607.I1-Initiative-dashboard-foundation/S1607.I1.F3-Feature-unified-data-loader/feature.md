# Feature: Unified Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I1 |
| **Feature ID** | S1607.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Create a unified dashboard data loader that fetches all 7 widget data sources in parallel using Promise.all(). The loader uses React's cache() for per-request memoization and follows the existing loader patterns in the codebase. Initially returns mock data that matches TypeScript interfaces.

## User Story
**As a** developer building dashboard widgets
**I want to** have a unified data loader with parallel fetching
**So that** the dashboard loads quickly and data is type-safe

## Acceptance Criteria

### Must Have
- [ ] Loader exports `loadDashboardData()` function using React cache()
- [ ] Uses Promise.all() for parallel fetching of all 7 data sources
- [ ] Each individual loader function returns type-safe mock data
- [ ] Error handling returns null for graceful widget degradation
- [ ] Loader integrated into page.tsx for Suspense streaming
- [ ] Exports DashboardData type for page component

### Nice to Have
- [ ] Structured logging for loader errors
- [ ] Individual loader functions documented with JSDoc

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | Loader function with cache() | New |
| **Data** | 7 individual fetch functions | New |
| **Database** | Mock data (future: Supabase RPC) | Placeholder |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing loader patterns (load-user-workspace.ts). Use Promise.all() for 60-80% faster load times. Server-only imports for security. Mock data matches future database schema.

### Key Architectural Choices
1. React cache() wrapper prevents duplicate fetches within same request
2. Promise.all() runs all 7 fetches in parallel
3. Individual loader functions can be replaced with real queries incrementally
4. Error handling returns null, widgets display empty states

### Trade-offs Accepted
- Mock data only for now - real queries deferred to widget implementations (I2-I5)

## Dependencies

### Blocks
- None

### Blocked By
- F1: Dashboard Page & Grid Layout (provides page structure to integrate loader)

### Parallel With
- F2: Widget Card Shells (can develop simultaneously after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Main loader with cache()

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and call loadDashboardData()
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Accept data prop

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create loader file structure**: dashboard-page.loader.ts with imports and cache wrapper
2. **Implement individual loaders (7)**: Mock data functions for each widget type
3. **Implement Promise.all orchestration**: Combine all loaders with error handling
4. **Integrate into page.tsx**: Call loader and pass data to grid
5. **Update dashboard-grid**: Accept DashboardData prop and distribute to widgets

### Suggested Order
1. Create loader file with cache wrapper skeleton
2. Implement 7 individual mock data functions
3. Add Promise.all orchestration
4. Integrate into page.tsx
5. Update grid to accept and distribute data

## Loader Architecture

```typescript
// dashboard-page.loader.ts
import 'server-only';
import { cache } from 'react';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import type { DashboardData } from '../types/dashboard.types';

export const loadDashboardData = cache(dashboardLoader);

async function dashboardLoader(): Promise<DashboardData> {
  const client = getSupabaseServerClient();

  const [
    recentActivity,
    quickStats,
    progressOverview,
    upcomingEvents,
    teamStatus,
    resourceUsage,
    activityFeed,
  ] = await Promise.all([
    loadRecentActivity(client),
    loadQuickStats(client),
    loadProgressOverview(client),
    loadUpcomingEvents(client),
    loadTeamStatus(client),
    loadResourceUsage(client),
    loadActivityFeed(client),
  ]);

  return {
    recentActivity,
    quickStats,
    progressOverview,
    upcomingEvents,
    teamStatus,
    resourceUsage,
    activityFeed,
  };
}
```

## Mock Data Specifications

Each loader function returns mock data matching TypeScript interfaces:

| Loader | Mock Data |
|--------|-----------|
| `loadRecentActivity` | 5 sample activity items |
| `loadQuickStats` | Static counts (10, 25, 5) |
| `loadProgressOverview` | 75% completion |
| `loadUpcomingEvents` | 3 sample events |
| `loadTeamStatus` | Online: 3, Away: 2, Offline: 5 |
| `loadResourceUsage` | 65% storage used |
| `loadActivityFeed` | 10 sample feed items |

## Validation Commands
```bash
# Verify loader file exists
ls apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Verify loader uses cache()
grep -r "cache(" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Verify Promise.all pattern
grep -r "Promise.all" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Verify TypeScript compiles
pnpm --filter web typecheck

# Verify page calls loader
grep -r "loadDashboardData" apps/web/app/home/\(user\)/page.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Types: `apps/web/app/home/(user)/_lib/types/dashboard.types.ts`
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
