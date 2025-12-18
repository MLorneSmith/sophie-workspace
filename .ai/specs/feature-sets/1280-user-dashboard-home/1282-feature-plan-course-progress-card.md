# Feature Plan: Course Progress Card

**Issue**: #1282
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: M (Medium)
**Dependencies**: #1281 (Dashboard Data Loader)

---

## Overview

Implement a RadialBarChart component displaying the user's overall course completion percentage as a visually striking circular gauge. The chart fills clockwise from the top (12 o'clock position), providing immediate visual feedback on learning progress.

Uses `recharts` RadialBarChart wrapped with shadcn/ui ChartContainer for consistent theming and CSS variable support.

## Solution Approach

### Design System

**Visual Pattern**: Radial progress gauge with:
- Outer ring (100%) for scale reference
- Inner ring showing actual completion percentage
- Center label with percentage value
- Smooth color transition (low % = warning color, high % = success color)
- Clockwise animation from top

**Technical Pattern**: Client component wrapping recharts with shadcn/ui chart utilities

### Key Implementation Details

1. **Chart Configuration**
   - `startAngle={90}` - Start at top (12 o'clock)
   - `endAngle={-270}` - End at bottom after full rotation (clockwise)
   - `innerRadius="60%"` - Inner radius for radial gauge effect
   - `outerRadius="100%"` - Full outer radius
   - Responsive container handled by ChartContainer

2. **Client Component Structure**
   - Add `"use client"` directive (required for interactive chart)
   - Accept `progress` prop with completion_percentage
   - Handle empty/loading states
   - Add tooltips for detail visibility

3. **Color Theming**
   - Use CSS variables from shadcn theme
   - Color transitions: 0% (red/warning) → 50% (yellow) → 100% (green/success)
   - Follow existing chart patterns from dashboard demo

4. **Data Transformation**
   - Convert percentage (0-100) to chart data format
   - Create radial bar data with single value
   - Add background bar for scale reference

### Code Pattern

```typescript
'use client';

import { useId } from 'react';
import { RadialBar, RadialBarChart, PolarAngleAxis, ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import { ChartConfig } from '@kit/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';

interface CourseProgressCardProps {
  progress: {
    completion_percentage: number;
    course_id?: string;
    started_at?: string;
  };
}

const chartConfig = {
  progress: {
    label: 'Completion',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function CourseProgressCard({ progress }: CourseProgressCardProps) {
  const id = useId();
  const percentage = progress?.completion_percentage ?? 0;

  // Transform percentage to chart data
  const chartData = [
    {
      name: 'Progress',
      value: percentage,
      fill: getColorByPercentage(percentage),
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Course Progress</CardTitle>
        <CardDescription>Overall completion</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={id}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
              angleAxisId={id}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value}%`}
                />
              }
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="text-center mt-4">
          <p className="text-3xl font-bold text-foreground">
            {percentage}%
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage === 0 ? 'Not started' : percentage === 100 ? 'Completed' : 'In progress'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getColorByPercentage(percentage: number): string {
  if (percentage === 0) return 'hsl(var(--destructive))';
  if (percentage < 50) return 'hsl(var(--chart-2))';
  if (percentage < 100) return 'hsl(var(--chart-3))';
  return 'hsl(var(--chart-1))';
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/course-progress-card.tsx` | RadialBarChart component for course progress display |

## Implementation Tasks

### Task 1: Create component scaffold
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/course-progress-card.tsx`
- [ ] Add `"use client"` directive
- [ ] Import recharts components: `RadialBar`, `RadialBarChart`, `PolarAngleAxis`
- [ ] Import shadcn/ui chart utilities: `ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartTooltipContent`
- [ ] Import shadcn/ui card components
- [ ] Define TypeScript interface for props

### Task 2: Create chart configuration and styling
- [ ] Define `chartConfig` with semantic colors
- [ ] Implement responsive container sizing
- [ ] Add CSS for center percentage display
- [ ] Define color transition function based on percentage

### Task 3: Implement radial chart rendering
- [ ] Set up RadialBarChart with `startAngle={90}` and `endAngle={-270}`
- [ ] Configure RadialBar with `cornerRadius={10}` for smooth edges
- [ ] Implement PolarAngleAxis (angle measurement from 0-100%)
- [ ] Add ChartTooltip with percentage formatting

### Task 4: Add percentage center display
- [ ] Create center overlay showing percentage text
- [ ] Add status label (Not started/In progress/Completed)
- [ ] Style percentage display with larger font
- [ ] Position absolutely over the chart

### Task 5: Handle edge cases and empty states
- [ ] Handle when `progress` is undefined/null
- [ ] Handle 0% completion (different styling)
- [ ] Handle 100% completion (celebration styling)
- [ ] Add loading skeleton placeholder

### Task 6: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test with 0%, 50%, 100% completion values
- [ ] Verify responsive layout on mobile/tablet/desktop

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] RadialBarChart renders with clockwise fill from top
- [ ] Progress fills from 0-100% correctly based on data
- [ ] Center displays percentage value and status
- [ ] Tooltip shows percentage on hover
- [ ] Colors transition logically: low % = red, mid % = yellow, high % = green
- [ ] Empty state handled (0% or no data shows gracefully)
- [ ] Responsive layout adapts to container size
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
