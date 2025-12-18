# Feature Plan: Assessment Spider Card

**Issue**: #1283
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: S (Small)
**Dependencies**: #1281 (Dashboard Data Loader)

---

## Overview

Adapt the existing RadarChart component from the assessment survey section to display self-assessment survey category scores as a spider/radar diagram on the dashboard.

This is a **reuse pattern** - the RadarChart already exists and works at `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`. The feature involves creating a new dashboard card component that wraps this existing chart with appropriate theming and styling.

## Solution Approach

### Reuse Pattern

**Strategy**: Import existing RadarChart and wrap in dashboard Card component

The existing RadarChart implementation:
- Already handles category scores data structure
- Already uses ChartContainer for CSS variable theming
- Already implements radar/spider diagram correctly
- Already has tooltip support

**New wrapper component**: Dashboard card that:
- Accepts survey category scores (JSONB object)
- Passes formatted data to existing RadarChart
- Adds card header/footer with metadata
- Handles empty state (no survey completed)

### Key Implementation Details

1. **Data Format**
   - Input: `category_scores` JSONB from survey_responses table
   - Structure: `{ [category_name]: score (0-100), ... }`
   - Example: `{ "Communication": 75, "Leadership": 82, "Technical": 68 }`

2. **Component Structure**
   - Client component ("use client" directive)
   - Accept `scores` prop with category scores object
   - Import existing RadarChart component
   - Wrap in Card with header/footer

3. **Styling & Layout**
   - Use same chart styling as existing RadarChart
   - Card dimensions match other dashboard cards
   - Centered chart within container
   - Responsive to container size

4. **Empty State**
   - If `scores` is empty or undefined
   - Display placeholder message: "No assessment completed yet"
   - Link to assessment section to take survey

### Code Pattern

```typescript
'use client';

import { RadarChart } from '@app/home/(user)/assessment/survey/_components/radar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';

interface AssessmentSpiderCardProps {
  scores?: Record<string, number>;
}

export function AssessmentSpiderCard({ scores = {} }: AssessmentSpiderCardProps) {
  const hasScores = Object.keys(scores).length > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Self-Assessment</CardTitle>
        <CardDescription>Category scores</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <If condition={hasScores} fallback={<EmptyState />}>
          <RadarChart categoryScores={scores} />
        </If>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground text-center">
        No assessment completed yet
      </p>
      <Button variant="outline" asChild>
        <a href="/home/assessment">Take Assessment</a>
      </Button>
    </div>
  );
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/assessment-spider-card.tsx` | Dashboard card wrapper for radar chart |

### Reference Files (No modifications needed)
| File | Why Reference |
|------|----------------|
| `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Existing component to import and reuse |

## Implementation Tasks

### Task 1: Create dashboard card component
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/assessment-spider-card.tsx`
- [ ] Add `"use client"` directive
- [ ] Import existing RadarChart component
- [ ] Import Card, CardContent, CardHeader, CardTitle, CardDescription from @kit/ui
- [ ] Define TypeScript interface for props

### Task 2: Implement card structure
- [ ] Create Card wrapper with CardHeader section
- [ ] Add CardTitle: "Self-Assessment"
- [ ] Add CardDescription: "Category scores"
- [ ] Add CardContent for chart area

### Task 3: Implement data rendering
- [ ] Accept `scores` prop (Record<string, number>)
- [ ] Pass scores to existing RadarChart component
- [ ] Verify data format matches RadarChart expectations

### Task 4: Implement empty state
- [ ] Create EmptyState component for when no scores exist
- [ ] Display message: "No assessment completed yet"
- [ ] Add button linking to assessment page
- [ ] Use If component for conditional rendering

### Task 5: Styling and responsiveness
- [ ] Ensure chart dimensions match card
- [ ] Center chart within card area
- [ ] Responsive sizing (match other dashboard cards)
- [ ] Add appropriate spacing/padding

### Task 6: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test with sample category scores data
- [ ] Test with empty scores (empty state)
- [ ] Verify layout consistency with other dashboard cards

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] Component successfully imports and wraps existing RadarChart
- [ ] Displays spider diagram with category scores
- [ ] Empty state shown when no scores exist
- [ ] Card styling consistent with other dashboard cards
- [ ] Responsive layout adapts to container size
- [ ] Link to assessment section works
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
