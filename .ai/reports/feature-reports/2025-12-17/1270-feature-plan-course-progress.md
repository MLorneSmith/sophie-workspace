# Feature Plan: Course Progress Widget

**Issue**: #1270
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 2 (Data Visualization)
**Effort**: M (Medium)
**Dependencies**: #1269 (Dashboard Layout)
**Status**: Ready for Implementation

---

## Overview

Create a widget displaying overall course completion using Recharts RadialBarChart. The widget fetches completion percentage from the `course_progress` table and displays it in a polished radial progress visualization. This demonstrates the chart integration pattern that other data visualization widgets will follow.

## Solution Approach

### Component Architecture

The widget will consist of two components:
1. **CourseProgressWidget**: Server component that fetches data
2. **CourseProgressChart**: Client component that renders the Recharts RadialBarChart

### Data Fetching (Server Component)

```tsx
// apps/web/app/home/(user)/_components/widgets/course-progress-widget.tsx
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { CourseProgressChart } from './course-progress-chart';
import type { Database } from '~/lib/database.types';

interface CourseProgressWidgetProps {
  userId: string;
}

export async function CourseProgressWidget({ userId }: CourseProgressWidgetProps) {
  const client = getSupabaseServerClient();

  const { data: courseProgress, error } = await client
    .from('course_progress')
    .select('completion_percentage, total_lessons, completed_lessons')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Return empty state for users with no progress
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No course progress yet. Start your first lesson to see progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const percentage = courseProgress?.completion_percentage ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Course Progress</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {Math.round(percentage)}% complete
        </p>
      </CardHeader>
      <CardContent className="flex justify-center">
        <CourseProgressChart percentage={percentage} />
      </CardContent>
    </Card>
  );
}
```

### Chart Component (Client Component)

```tsx
// apps/web/app/home/(user)/_components/widgets/course-progress-chart.tsx
'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@kit/ui/chart';

const chartConfig = {
  progress: {
    label: 'Progress',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface CourseProgressChartProps {
  percentage: number;
}

export function CourseProgressChart({ percentage }: CourseProgressChartProps) {
  const data = [
    {
      name: 'progress',
      value: percentage,
      fill: 'hsl(var(--primary))',
    },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          angleAxisId={0}
          dataKey="value"
          cornerRadius={10}
          label={{
            position: 'center',
            fill: 'hsl(var(--foreground))',
            fontSize: 24,
            fontWeight: 'bold',
            value: `${percentage.toFixed(0)}%`,
          }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
      </RadialBarChart>
    </ChartContainer>
  );
}
```

## Research Applied

### From Manifest
- **Radial Progress Pattern**: Use RadialBarChart from Recharts (not custom SVG)
- **Chart Integration**: Use `ChartContainer`, `ChartConfig`, `ChartTooltip` from `@kit/ui/chart`
- **Data Source**: Query `course_progress` table with `user_id` filter (RLS protects query)
- **Empty State**: Handle users with no progress gracefully with explanatory message
- **Server Component Pattern**: Fetch data in server component, pass to client chart component

### From Frontend Design Skill
- **shadcn/ui Integration**: Use Card, CardHeader, CardTitle, CardContent from @kit/ui
- **Responsive Chart**: Chart sized at 200x200px within card, centered
- **Color System**: Use `hsl(var(--primary))` for semantic color that respects dark mode
- **Typography**: Use text-lg for title, text-sm text-muted-foreground for subtitle
- **Spacing**: CardContent with flex justify-center, gap between title and percentage

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/widgets/course-progress-widget.tsx` | Server component that fetches course progress data |
| `apps/web/app/home/(user)/_components/widgets/course-progress-chart.tsx` | Client component that renders Recharts RadialBarChart |

## Implementation Tasks

### Task 1: Create Course Progress Widget (Server Component)
- [ ] Create file with `'use server'` directive
- [ ] Accept `userId` prop
- [ ] Query `course_progress` table using Supabase server client
- [ ] Filter by `user_id` with `.eq('user_id', userId)`
- [ ] Use `.single()` to fetch single row
- [ ] Extract `completion_percentage` from response
- [ ] Handle error state with empty state UI
- [ ] Render Card with header showing title and percentage
- [ ] Pass percentage to chart component
- [ ] Add `data-testid="course-progress-widget"` for E2E tests

### Task 2: Create Course Progress Chart (Client Component)
- [ ] Create file with `'use client'` directive
- [ ] Import Recharts components (RadialBarChart, RadialBar, PolarAngleAxis)
- [ ] Import ChartContainer and related components from @kit/ui/chart
- [ ] Define `chartConfig` with semantic colors
- [ ] Accept `percentage` prop (0-100)
- [ ] Create data array with single object for radial bar
- [ ] Configure RadialBarChart with innerRadius, outerRadius
- [ ] Set startAngle to 90, endAngle to -270 (full circle)
- [ ] Add PolarAngleAxis with domain [0, 100]
- [ ] Add RadialBar with label showing percentage
- [ ] Add ChartTooltip with custom content
- [ ] Ensure chart is responsive within 200x200px container
- [ ] Test with different percentage values (0%, 50%, 100%)

### Task 3: Database Query Validation
- [ ] Verify `course_progress` table exists in Supabase
- [ ] Verify columns: `user_id`, `completion_percentage`, `total_lessons`, `completed_lessons`
- [ ] Verify RLS policy allows user to read their own progress
- [ ] Test query manually in Supabase console
- [ ] Ensure query returns null for users without progress (not error)

### Task 4: Styling and Responsiveness
- [ ] Ensure card has consistent padding with other widgets
- [ ] Test chart rendering on mobile (ensure 200x200px fits)
- [ ] Test on tablet and desktop
- [ ] Verify colors work in light and dark mode
- [ ] Verify tooltip displays on hover
- [ ] Ensure font sizes are readable

## Validation Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint:fix

# Build
pnpm build

# Local testing - verify widget appears and loads data
pnpm dev
# Navigate to /home
# Verify "Course Progress" widget displays
# Verify percentage displays correctly
# Verify radial chart renders
# Verify chart is responsive
# Check browser console for errors
# Test tooltip on hover
```

## Acceptance Criteria

- [ ] Widget fetches data from `course_progress` table
- [ ] RadialBarChart displays course completion percentage
- [ ] Chart shows correct percentage (0-100%)
- [ ] Chart is responsive within card container
- [ ] Empty state displays for users with no progress
- [ ] Percentage displays as text above/in chart
- [ ] Chart tooltip displays on hover
- [ ] Dark mode colors work correctly
- [ ] TypeScript passes with no errors
- [ ] Card styling matches other widgets
- [ ] RLS protects query (user can only see their own progress)
- [ ] E2E test can select widget by data-testid

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No additional research - manifest provided chart patterns*
