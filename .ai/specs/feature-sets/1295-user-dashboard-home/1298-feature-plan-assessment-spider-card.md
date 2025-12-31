# Feature Plan: Assessment Spider Card

**Issue**: #1298
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 2
**Effort**: M (Medium)
**Dependencies**: #1296 (Dashboard Data Loader)

---

## Overview

Client component displaying skills assessment radar chart using Recharts RadarChart with shadcn ChartContainer. Shows self-assessment results from survey responses in a spider/radar diagram format. Reuses existing pattern from the assessment survey feature.

## Solution Approach

**Component Pattern**: Client Component with Recharts Radar Chart

- Use `ChartContainer` from shadcn/ui for chart wrapper
- Recharts `RadarChart` component for spider diagram visualization
- Display 5-7 skill categories with scores (0-100)
- Interactive tooltips on hover
- Link to retake assessment if outdated
- Responsive sizing within dashboard grid

**Key Design Decisions**:
- Client component required for Recharts interactivity
- Reuse existing chart pattern from assessment module
- ChartContainer for consistent styling
- Fixed aspect ratio prevents layout shift
- Handle incomplete/missing survey data

## Research Applied

### From Manifest
- Reuse existing `RadarChart` pattern from `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Reuse `useSurveyScores` hook for data fetching
- Spider diagram requires 5+ skill dimensions
- Handle case where survey not yet completed

### From Skills
- Client component pattern for interactive charts
- Recharts best practices for radar charts
- Tailwind CSS responsive grid sizing

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/assessment-spider-card.tsx` | Assessment spider diagram card |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and render AssessmentSpiderCard in dashboard |

## Implementation Tasks

### Task 1: Create Assessment Spider Card Component
- [ ] Import `ChartContainer` from shadcn
- [ ] Import `RadarChart`, `Radar`, `PolarGrid`, `PolarAngleAxis` from Recharts
- [ ] Accept `SurveyScores` data as props
- [ ] Extract skill scores and map to chart format
- [ ] Configure radar chart with skill categories
- [ ] Add tooltips for score details
- [ ] Include card header with "Skills Assessment" title
- [ ] Style with shadcn Card component

**File**: `apps/web/app/home/(user)/_components/assessment-spider-card.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { SurveyScores } from '../_lib/types/dashboard.types';

interface AssessmentSpiderCardProps {
  data: SurveyScores;
}

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
};

export function AssessmentSpiderCard({ data }: AssessmentSpiderCardProps) {
  if (!data.scores || data.scores.length === 0) {
    return (
      <Card className="h-[320px] flex items-center justify-center">
        <CardContent>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              No assessment completed yet
            </p>
            <Button>Take Assessment</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.scores.map((item) => ({
    skill: item.skill,
    score: item.score,
  }));

  return (
    <Card className="h-[320px] flex flex-col">
      <CardHeader>
        <CardTitle>Skills Assessment</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <Radar
                name="Skills"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Task 2: Handle Data Transformation
- [ ] Map survey response data to radar chart format
- [ ] Ensure score values are 0-100 range
- [ ] Handle missing skill data gracefully
- [ ] Add meaningful skill labels

### Task 3: Handle Empty States
- [ ] Display CTA when no assessment taken
- [ ] Show "Retake Assessment" button if outdated
- [ ] Handle partial assessment data

### Task 4: Responsive Design
- [ ] Ensure chart responsive within grid column
- [ ] Test on mobile viewport
- [ ] Verify fixed height prevents layout shift

### Task 5: Type Safety
- [ ] Ensure `SurveyScores` type correctly imported
- [ ] Add TypeScript interfaces for Recharts data
- [ ] No `any` types

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
```

## Acceptance Criteria

- [ ] Component exists at `apps/web/app/home/(user)/_components/assessment-spider-card.tsx`
- [ ] Displays radar chart using Recharts
- [ ] Shows skill scores from survey responses
- [ ] Component receives data from dashboard loader via props
- [ ] Empty state shows CTA when no assessment taken
- [ ] Interactive tooltips display score details
- [ ] Fixed height container prevents layout jank
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass
- [ ] Chart is responsive and visible on all screen sizes

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
