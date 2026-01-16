# React Best Practices Audit Report

**Date:** 2026-01-15
**Skill Used:** `.claude/skills/react-best-practices` (Vercel React Best Practices)
**Rules Evaluated:** 45 rules across 8 categories

---

## Executive Summary

A comprehensive audit of the SlideHeroes codebase was conducted against Vercel's React Best Practices skill (45 rules across 8 categories). Overall, the codebase demonstrates **good fundamentals** with proper use of React.cache(), Promise.all() in many places, and correct optimizePackageImports configuration. However, there are several areas needing improvement.

| Priority | Category | Issues Found | Severity |
|----------|----------|-------------|----------|
| CRITICAL | Eliminating Waterfalls | 10+ | HIGH |
| CRITICAL | Bundle Size Optimization | 4 | LOW-MEDIUM |
| HIGH | Server-Side Performance | 10+ | MEDIUM-HIGH |
| MEDIUM-HIGH | Client-Side Data Fetching | 6 | MEDIUM |
| MEDIUM | Re-render Optimization | 8 | MEDIUM |
| MEDIUM | Rendering Performance | 4 | LOW-MEDIUM |

---

## 1. CRITICAL: Eliminating Waterfalls

### Sequential Awaits (Should Use Promise.all)

**High Priority Fixes:**

| File | Lines | Issue | Impact |
|------|-------|-------|--------|
| `apps/web/app/home/(user)/course/page.tsx` | 71-90 | 3 sequential DB queries (courseProgress, lessonProgress, quizAttempts) | 3x waterfall |
| `apps/web/app/home/(user)/assessment/survey/page.tsx` | 69-121 | 5 sequential awaits (auth, survey, questions, progress, sort) | 5x waterfall |
| `apps/web/app/home/(user)/assessment/page.tsx` | 24-59 | 3 sequential awaits (auth, survey, progress) | 3x waterfall |
| `apps/web/app/home/[account]/billing/page.tsx` | 39-51 | Workspace blocks billing data | 2-3x waterfall |
| `apps/web/app/home/(user)/course/certificate/page.tsx` | 63-81 | Sequential certificate + storage URL fetch | 2x waterfall |
| `apps/web/app/(marketing)/blog/page.tsx` | 22-79 | i18n blocks CMS content fetch | 2x waterfall |
| `apps/web/app/(marketing)/docs/page.tsx` | 8-21 | i18n blocks getDocs call | Minor waterfall |

**Example Fix for CoursePage:**

```typescript
// Before (sequential) - apps/web/app/home/(user)/course/page.tsx:71-90
const { data: courseProgress } = await supabase
  .from("course_progress")
  .select("*")
  .eq("user_id", user.id)
  .eq("course_id", decksForDecisionMakersCourse.id)
  .maybeSingle();

const { data: lessonProgress } = await supabase
  .from("lesson_progress")
  .select("*")
  .eq("user_id", user.id)
  .eq("course_id", decksForDecisionMakersCourse.id);

const { data: quizAttempts } = await supabase
  .from("quiz_attempts")
  .select("*")
  .eq("user_id", user.id)
  .eq("course_id", decksForDecisionMakersCourse.id);

// After (parallel)
const [courseProgressResult, lessonProgressResult, quizAttemptsResult] =
  await Promise.all([
    supabase.from("course_progress").select("*")
      .eq("user_id", user.id)
      .eq("course_id", decksForDecisionMakersCourse.id)
      .maybeSingle(),
    supabase.from("lesson_progress").select("*")
      .eq("user_id", user.id)
      .eq("course_id", decksForDecisionMakersCourse.id),
    supabase.from("quiz_attempts").select("*")
      .eq("user_id", user.id)
      .eq("course_id", decksForDecisionMakersCourse.id)
  ]);

const { data: courseProgress } = courseProgressResult;
const { data: lessonProgress } = lessonProgressResult;
const { data: quizAttempts } = quizAttemptsResult;
```

---

## 2. CRITICAL: Bundle Size Optimization

### ✅ Good: optimizePackageImports Configured

Your `apps/web/next.config.mjs` (lines 75-83) correctly configures:

```javascript
optimizePackageImports: [
  "recharts",
  "lucide-react",
  "@radix-ui/react-icons",
  "@radix-ui/react-avatar",
  "@radix-ui/react-select",
  "date-fns",
  ...INTERNAL_PACKAGES,
]
```

### ⚠️ Opportunities: Dynamic Imports for Heavy Components

| File | Component | Recommendation |
|------|-----------|----------------|
| `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Recharts RadarChart | Use `next/dynamic` |
| `apps/web/app/home/(user)/admin/ai-usage/_components/usage-dashboard.tsx` | Recharts charts | Use `next/dynamic` |
| `apps/web/app/admin/api-usage/_components/usage-dashboard.tsx` | Recharts charts | Use `next/dynamic` |
| `apps/dev-tool/app/components/components/chart-story.tsx` | Multiple Recharts | Use `next/dynamic` |

**Example Fix:**

```typescript
// Before (static import)
import { UsageDashboard } from './_components/usage-dashboard';

// After (dynamic import)
import dynamic from 'next/dynamic';

const UsageDashboard = dynamic(
  () => import('./_components/usage-dashboard').then(m => m.UsageDashboard),
  {
    loading: () => <ChartSkeleton />,
    ssr: true
  }
);
```

---

## 3. HIGH: Server-Side Performance

### Missing React.cache() on Auth Functions

These files use `requireUser()` directly instead of the cached `requireUserInServerComponent()`:

| File | Line | Current Code |
|------|------|--------------|
| `apps/web/app/home/(user)/ai/blocks/page.tsx` | 23 | `await requireUser(client)` |
| `apps/web/app/home/(user)/course/certificate/page.tsx` | 32 | `await requireUser(supabase)` |
| `apps/web/app/home/(user)/course/page.tsx` | 30 | `await requireUser(supabase)` |
| `apps/web/app/join/page.tsx` | 44 | `await requireUser(client)` |
| `apps/web/app/identities/page.tsx` | 114 | `await requireUser(client)` |

**Fix:** Replace with:

```typescript
// Before
const auth = await requireUser(client);

// After
const user = await requireUserInServerComponent();
```

### Missing `after()` for Non-Blocking Operations

Logging operations block responses in these API routes:

| File | Lines | Blocking Operation |
|------|-------|-------------------|
| `apps/web/app/api/ai/generate-ideas/route.ts` | 122-131 | `logger.info("AI Request Metrics:", {...})` |
| `apps/web/app/api/ai/simplify-text/route.ts` | 76-83 | `logger.info("AI Simplify Text Metrics:", {...})` |
| `apps/web/app/api/courses/[courseId]/lessons/route.ts` | 20-40 | Multiple logger calls |
| `apps/web/app/api/ai-usage/session-cost/route.ts` | 60-67, 90-95 | `logger.error(...)` |
| `apps/web/app/api/billing/webhook/route.ts` | 35, 39 | `logger.info(...)` |

**Fix Example:**

```typescript
import { after } from 'next/server';

// Before (blocking)
logger.info("AI Request Metrics:", { duration, model, tokens });
return NextResponse.json({ success: true, data });

// After (non-blocking)
after(async () => {
  logger.info("AI Request Metrics:", { duration, model, tokens });
});
return NextResponse.json({ success: true, data });
```

---

## 4. MEDIUM-HIGH: Client-Side Data Fetching

### useEffect + fetch Anti-Pattern (Should Use TanStack Query)

| File | Lines | Issue | useState Count |
|------|-------|-------|----------------|
| `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts` | 23-108 | Manual fetch + state | 5 |
| `apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx` | 44-71 | Manual fetch + state | 3 |
| `apps/web/app/home/(user)/ai/storyboard/_components/presentation-selector.tsx` | 43-66 | Manual fetch + state | 4 |

**Example Fix for use-survey-scores.ts:**

```typescript
// Before (manual - 108 lines)
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);
const [categoryScores, setCategoryScores] = useState<CategoryScores>({});
const [highestCategory, setHighestCategory] = useState<string>("");
const [lowestCategory, setLowestCategory] = useState<string>("");

useEffect(() => {
  async function fetchScores() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("survey_responses")...
      // ... complex state updates
    } finally {
      setIsLoading(false);
    }
  }
  if (userId && surveyId) fetchScores();
}, [userId, surveyId, supabase]);

// After (TanStack Query - ~20 lines)
import { useQuery } from '@tanstack/react-query';

export function useSurveyScores(userId: string, surveyId: string) {
  return useQuery({
    queryKey: ['survey-scores', userId, surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("category_scores, highest_scoring_category, lowest_scoring_category")
        .eq("user_id", userId)
        .eq("survey_id", surveyId)
        .single();

      if (error) throw error;
      return {
        categoryScores: data?.category_scores ?? {},
        highestCategory: data?.highest_scoring_category ?? '',
        lowestCategory: data?.lowest_scoring_category ?? '',
      };
    },
    enabled: !!userId && !!surveyId,
  });
}
```

### Redundant State Synchronization

| File | Lines | Issue |
|------|-------|-------|
| `apps/web/app/home/(user)/assessment/survey/_components/survey-summary.tsx` | 29-72 | Hook data synced to redundant local state |

---

## 5. MEDIUM: Re-render Optimization

### Object Dependencies in useEffect

| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| `apps/web/app/home/(user)/ai/storyboard/_lib/providers/storyboard-provider.tsx` | 182-187 | Full `storyboard` object in deps | Use specific primitive fields |
| `apps/web/app/(marketing)/_components/debug-providers.tsx` | 13-25 | `queryClient` object in deps | Use ref or remove |

**Example:**

```typescript
// Before (object dependency)
useEffect(() => {
  if (storyboard && currentPresentationId) {
    debouncedSaveStoryboard(storyboard);
  }
}, [debouncedSaveStoryboard, storyboard, currentPresentationId]);

// After (primitive dependency)
const storyboardId = storyboard?.id;
useEffect(() => {
  if (storyboard && currentPresentationId) {
    debouncedSaveStoryboard(storyboard);
  }
}, [debouncedSaveStoryboard, storyboardId, currentPresentationId]);
```

### useCallback Recreated on State Change

| File | Lines | Issue |
|------|-------|-------|
| `apps/web/app/home/(user)/ai/canvas/_lib/contexts/save-context.tsx` | 41-65 | `saveStatus` in useCallback deps causes cascading re-renders |

**Fix:** Use functional setState or ref:

```typescript
// Before
const manualSave = useCallback(async () => {
  if (saveStatus === "saving") return;
  // ...
}, [saveStatus]); // Recreated on every saveStatus change!

// After
const saveStatusRef = useRef(saveStatus);
useEffect(() => { saveStatusRef.current = saveStatus; }, [saveStatus]);

const manualSave = useCallback(async () => {
  if (saveStatusRef.current === "saving") return;
  // ...
}, []); // Stable reference
```

### Unnecessary State Subscriptions

| File | Lines | Issue |
|------|-------|-------|
| `apps/web/app/home/(user)/ai/canvas/_components/canvas-page.tsx` | 24-25 | `useSearchParams()` subscription when only `id` is read |

---

## 6. MEDIUM: Rendering Performance

### Static JSX Not Hoisted (Recreated Every Render)

| File | Lines | Component |
|------|-------|-----------|
| `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` | 197-220 | Loading skeleton |
| `apps/web/app/(marketing)/page.tsx` | 48-89, 123, 184, 268 | Multiple inline skeletons |

**Fix:** Extract to separate components:

```typescript
// Before (inline, recreated every render)
if (isLoading) {
  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex h-full w-full flex-col space-y-4">
          <div className="bg-muted/40 h-6 w-20 animate-pulse rounded" />
          {/* ... more skeleton JSX */}
        </div>
      ))}
    </div>
  );
}

// After (extracted, stable reference)
const KanbanBoardSkeleton = () => (
  <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
    {COLUMNS.map((column) => (
      <div key={column.id} className="flex h-full w-full flex-col space-y-4">
        <div className="bg-muted/40 h-6 w-20 animate-pulse rounded" />
        {/* ... */}
      </div>
    ))}
  </div>
);

// In component:
if (isLoading) return <KanbanBoardSkeleton />;
```

### Multiple useState (Should Consolidate)

| File | Lines | useState Count | Recommendation |
|------|-------|----------------|----------------|
| `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx` | 266-271 | 4 related states | Consolidate to state object |
| `apps/web/app/home/(user)/ai/storyboard/_lib/providers/storyboard-provider.tsx` | 73-81 | 6 related states | Consolidate to state object |

---

## Positive Findings ✅

The codebase does many things well:

1. **React.cache() is properly used** in loaders:
   - `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts:24`
   - `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts:18`
   - `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts:13`
   - `apps/web/lib/server/require-user-in-server-component.ts:14`

2. **Promise.all()** is used correctly in many places for parallel fetching

3. **optimizePackageImports** is configured for heavy libraries (recharts, lucide-react, radix-ui, date-fns)

4. **SVG animations** are correctly applied to wrapper divs, not directly to SVGs

5. **Conditional rendering** mostly uses proper patterns (`length > 0` checks)

6. **Analytics** is properly deferred in `apps/web/components/analytics-provider.tsx`

7. **Chart UI wrapper** in `packages/ui/src/shadcn/chart.tsx` uses correct namespace import pattern

---

## Recommended Action Plan

### Phase 1: High Impact (1-2 days)

1. **Parallelize sequential awaits** in:
   - `apps/web/app/home/(user)/course/page.tsx`
   - `apps/web/app/home/(user)/assessment/page.tsx`
   - `apps/web/app/home/(user)/assessment/survey/page.tsx`
   - `apps/web/app/home/[account]/billing/page.tsx`

2. **Replace `requireUser()` calls** with `requireUserInServerComponent()` in:
   - `apps/web/app/home/(user)/ai/blocks/page.tsx`
   - `apps/web/app/home/(user)/course/page.tsx`
   - `apps/web/app/home/(user)/course/certificate/page.tsx`
   - `apps/web/app/join/page.tsx`
   - `apps/web/app/identities/page.tsx`

3. **Add `after()` to logging** in API routes:
   - `apps/web/app/api/ai/generate-ideas/route.ts`
   - `apps/web/app/api/ai/simplify-text/route.ts`
   - `apps/web/app/api/courses/[courseId]/lessons/route.ts`
   - `apps/web/app/api/billing/webhook/route.ts`

### Phase 2: Medium Impact (2-3 days)

1. **Refactor to TanStack Query**:
   - `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts`
   - `apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx`
   - `apps/web/app/home/(user)/ai/storyboard/_components/presentation-selector.tsx`

2. **Fix object dependencies** in useEffect hooks:
   - `apps/web/app/home/(user)/ai/storyboard/_lib/providers/storyboard-provider.tsx`

3. **Extract inline skeletons** to separate components:
   - `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`
   - `apps/web/app/(marketing)/page.tsx`

### Phase 3: Cleanup (1 day)

1. **Consolidate multiple useState** declarations:
   - `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx`
   - `apps/web/app/home/(user)/ai/storyboard/_lib/providers/storyboard-provider.tsx`

2. **Add dynamic imports** for chart components

3. **Fix useCallback dependency issues** in `save-context.tsx`

---

## Metrics to Track

After implementing fixes, measure:

- **Page Load Time** for Course, Assessment, and Billing pages (expect 40-60% improvement)
- **Time to First Byte (TTFB)** for API routes with logging (expect 10-30% improvement)
- **Bundle Size** before/after dynamic imports (`pnpm analyze`)
- **Re-render counts** in React DevTools for storyboard provider

---

## References

- Vercel React Best Practices Skill: `.claude/skills/react-best-practices/`
- [Vercel Blog: How We Optimized Package Imports](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Vercel Blog: How We Made the Dashboard 2x Faster](https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast)
- [Next.js after() API](https://nextjs.org/docs/app/api-reference/functions/after)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
