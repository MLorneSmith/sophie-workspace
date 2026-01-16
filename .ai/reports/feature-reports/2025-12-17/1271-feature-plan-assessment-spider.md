# Feature Plan: Assessment Spider Widget

**Issue**: #1271
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 2 (Data Visualization)
**Effort**: S (Small)
**Dependencies**: #1269 (Dashboard Layout)
**Status**: Ready for Implementation

---

## Overview

Create a widget wrapper around the existing `radar-chart.tsx` component. This is a minimal new code feature - just a server component that fetches the user's latest `survey_responses.category_scores` and renders the existing RadarChart component. Demonstrates component reuse pattern for dashboard widgets.

## Solution Approach

### Component Architecture

Single server component that wraps the existing RadarChart:

```tsx
// apps/web/app/home/(user)/_components/widgets/assessment-spider-widget.tsx
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { RadarChart } from '~/components/assessment/survey/_components/radar-chart';

interface AssessmentSpiderWidgetProps {
  userId: string;
}

export async function AssessmentSpiderWidget({ userId }: AssessmentSpiderWidgetProps) {
  const client = getSupabaseServerClient();

  // Fetch latest survey response with category scores
  const { data: surveyResponse, error } = await client
    .from('survey_responses')
    .select('id, category_scores, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !surveyResponse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete your assessment to see your insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform category_scores to radar chart format
  const chartData = Object.entries(surveyResponse.category_scores || {}).map(
    ([category, score]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      value: Number(score),
      fullMark: 100,
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assessment Insights</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Updated {new Date(surveyResponse.created_at).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="flex justify-center">
        <RadarChart data={chartData} />
      </CardContent>
    </Card>
  );
}
```

## Research Applied

### From Manifest
- **Component Reuse**: Existing RadarChart at `assessment/survey/_components/radar-chart.tsx` is production-ready
- **Data Source**: Query `survey_responses` table with `category_scores` JSONB column
- **Latest Score**: Order by `created_at` descending and limit to 1
- **Empty State**: Handle users who haven't completed assessment
- **Server Component Pattern**: Fetch in server component, pass transformed data to existing client component

### From Frontend Design Skill
- **shadcn/ui Integration**: Use Card, CardHeader, CardTitle, CardContent from @kit/ui
- **Minimal New Code**: Leverage existing RadarChart component - no custom chart implementation needed
- **Data Transformation**: Convert JSONB category_scores to chart data format
- **Spacing**: CardContent with flex justify-center for chart alignment

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/widgets/assessment-spider-widget.tsx` | Server component that fetches assessment data and renders RadarChart |

### Modified Files

None - direct component reuse from existing pattern

## Implementation Tasks

### Task 1: Create Assessment Spider Widget
- [ ] Create file with `'use server'` directive
- [ ] Accept `userId` prop
- [ ] Query `survey_responses` table using Supabase server client
- [ ] Filter by `user_id` with `.eq('user_id', userId)`
- [ ] Order by `created_at` descending to get latest
- [ ] Use `.limit(1)` and `.single()` to fetch single row
- [ ] Handle error and null cases with empty state
- [ ] Extract `category_scores` from response (JSONB object)
- [ ] Transform to chart data format: `[{ category, value, fullMark }, ...]`
- [ ] Format date display with `toLocaleDateString()`
- [ ] Render Card with title and subtitle showing date
- [ ] Import RadarChart from existing location
- [ ] Pass chartData to RadarChart component
- [ ] Add `data-testid="assessment-spider-widget"` for E2E tests

### Task 2: Verify Existing RadarChart Component
- [ ] Locate existing RadarChart at `assessment/survey/_components/radar-chart.tsx`
- [ ] Review component API to understand required props
- [ ] Verify it accepts data array with `{ category, value, fullMark }` structure
- [ ] Confirm component is client component (can be used in server component)
- [ ] Check if any customization needed for dashboard context
- [ ] Test existing component renders correctly

### Task 3: Database Query Validation
- [ ] Verify `survey_responses` table exists in Supabase
- [ ] Verify columns: `id`, `user_id`, `category_scores` (JSONB), `created_at`
- [ ] Verify category_scores structure (object with category keys and numeric values)
- [ ] Verify RLS policy allows user to read their own responses
- [ ] Test query manually in Supabase console
- [ ] Ensure query returns null for users without assessments (not error)

### Task 4: Data Transformation
- [ ] Create test data with different category_scores
- [ ] Verify transformation handles all category names
- [ ] Test with uppercase/lowercase mixed category names
- [ ] Verify numeric conversion of scores
- [ ] Test edge cases (missing categories, null values)

## Validation Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint:fix

# Build
pnpm build

# Local testing
pnpm dev
# Navigate to /home
# Verify "Assessment Insights" widget displays
# Verify spider diagram shows assessment scores
# Verify date displays correctly
# Check that existing RadarChart renders properly
```

## Acceptance Criteria

- [ ] Widget fetches latest assessment from `survey_responses` table
- [ ] RadarChart displays assessment category scores
- [ ] Component reuses existing RadarChart without modification
- [ ] Empty state displays for users without completed assessment
- [ ] Date displays correctly (updated date of assessment)
- [ ] Chart renders within card container
- [ ] Category names display correctly in radar chart
- [ ] Dark mode colors work correctly
- [ ] TypeScript passes with no errors
- [ ] Card styling matches other widgets
- [ ] RLS protects query (user can only see their own responses)
- [ ] E2E test can select widget by data-testid

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No - existing component pattern reused*
