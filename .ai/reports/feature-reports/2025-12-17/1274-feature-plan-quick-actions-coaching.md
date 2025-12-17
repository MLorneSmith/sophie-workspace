# Feature Plan: Quick Actions and Coaching Widget

**Issue**: #1274
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 3 (Activity & Actions)
**Effort**: S (Small)
**Dependencies**: #1269 (Dashboard Layout)
**Status**: Ready for Implementation

---

## Overview

Create two simple side-by-side widgets:
1. **Quick Actions Panel** - Navigation buttons to key features based on user state
2. **Coaching Sessions Widget** - Embeds a mini version of the existing Cal.com calendar iframe

Both are low-complexity features that leverage existing patterns.

## Solution Approach

### Quick Actions Widget

```tsx
// apps/web/app/home/(user)/_components/widgets/quick-actions-widget.tsx
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import Link from 'next/link';
import {
  Plus,
  Play,
  BarChart3,
  Storyboard,
} from 'lucide-react';

interface QuickActionsWidgetProps {
  userId: string;
}

export async function QuickActionsWidget({ userId }: QuickActionsWidgetProps) {
  const client = getSupabaseServerClient();

  // Fetch user state to determine contextual CTAs
  const [courseProgress, assessmentStatus, presentations] = await Promise.all([
    client
      .from('course_progress')
      .select('completion_percentage')
      .eq('user_id', userId)
      .single(),
    client
      .from('survey_responses')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single(),
    client
      .from('building_blocks_submissions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single(),
  ]);

  const actions = [
    {
      label: 'New Presentation',
      href: '/home/presentations/new',
      icon: Plus,
      variant: 'default' as const,
    },
    courseProgress.data && courseProgress.data.completion_percentage < 100
      ? {
          label: 'Continue Course',
          href: '/home/course',
          icon: Play,
          variant: 'secondary' as const,
        }
      : null,
    !assessmentStatus.data
      ? {
          label: 'Take Assessment',
          href: '/home/assessment',
          icon: BarChart3,
          variant: 'secondary' as const,
        }
      : null,
    presentations.data
      ? {
          label: 'View Storyboards',
          href: '/home/presentations',
          icon: Storyboard,
          variant: 'secondary' as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'secondary';
  }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(action => {
            const IconComponent = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant={action.variant}
                  className="w-full justify-start gap-2 text-xs h-auto py-2"
                  size="sm"
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Coaching Sessions Widget

```tsx
// apps/web/app/home/(user)/_components/widgets/coaching-widget.tsx
import 'server-only';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface CoachingWidgetProps {
  userId: string;
}

export async function CoachingWidget({ userId }: CoachingWidgetProps) {
  // Cal.com iframe embedding
  // No data fetching needed - Cal.com handles scheduling
  // Can optionally fetch next session from Cal.com API if integrated

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Coaching Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>Schedule 1-on-1 coaching sessions with our team.</p>
        </div>

        {/* Cal.com iframe would go here */}
        <div className="bg-muted rounded-lg p-4 min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click below to schedule a session
            </p>
          </div>
        </div>

        <Link href="/home/coaching">
          <Button className="w-full">
            Schedule Session
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

## Research Applied

### From Manifest
- **Quick Actions Pattern**: Contextual CTAs based on user state
- **Cal.com Integration**: Existing `calendar.tsx` uses Cal.com iframe pattern
- **Conditional Display**: Show/hide actions based on user progress
- **Static + Navigation**: Coaching widget is static navigation to main calendar page

### From Frontend Design Skill
- **shadcn/ui Components**: Card, Button from @kit/ui
- **Icon System**: Use lucide-react icons for visual clarity
- **Grid Layout**: 2-column grid for action buttons
- **Responsive Buttons**: Buttons sized appropriately for widget container
- **Color Variants**: Default (primary) for main action, secondary for others
- **Truncation**: Handle long button labels gracefully

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/widgets/quick-actions-widget.tsx` | Server component that renders contextual action buttons |
| `apps/web/app/home/(user)/_components/widgets/coaching-widget.tsx` | Server component that displays coaching sessions widget |

## Implementation Tasks

### Task 1: Create Quick Actions Widget
- [ ] Create file with `'use server'` directive
- [ ] Accept `userId` prop
- [ ] Query `course_progress` to check if in progress
- [ ] Query `survey_responses` to check if assessment completed
- [ ] Query `building_blocks_submissions` to check if presentations exist
- [ ] Use `Promise.all()` to fetch all data in parallel
- [ ] Filter out null/empty actions using `.filter(Boolean)`
- [ ] Create action array with conditional CTAs:
  - Always: "New Presentation"
  - If course < 100%: "Continue Course"
  - If no assessment: "Take Assessment"
  - If presentations exist: "View Storyboards"
- [ ] Render 2-column grid of buttons
- [ ] Use Button component with variant based on action type
- [ ] Import icons from lucide-react (Plus, Play, BarChart3, Storyboard)
- [ ] Wrap buttons in Link components for navigation
- [ ] Add `data-testid="quick-actions-widget"` for E2E tests

### Task 2: Create Coaching Widget
- [ ] Create file with `'use server'` directive
- [ ] Render simple card with calendar icon placeholder
- [ ] Add descriptive text about coaching sessions
- [ ] Add button to navigate to coaching page
- [ ] Placeholder for future Cal.com iframe integration
- [ ] Add `data-testid="coaching-widget"` for E2E tests

### Task 3: Verify Navigation Routes
- [ ] Verify route `/home/presentations/new` exists
- [ ] Verify route `/home/course` exists
- [ ] Verify route `/home/assessment` exists
- [ ] Verify route `/home/presentations` exists
- [ ] Verify route `/home/coaching` exists
- [ ] Test navigation works from widget buttons

### Task 4: Test User States
- [ ] Test widget with no course progress (show "Continue Course")
- [ ] Test widget with completed course (hide "Continue Course")
- [ ] Test widget with completed assessment (hide "Take Assessment")
- [ ] Test widget with presentations (show "View Storyboards")
- [ ] Test widget with no presentations (hide "View Storyboards")
- [ ] Verify all contextual logic works correctly

### Task 5: Styling and Responsive Layout
- [ ] Verify 2-column button grid on all screen sizes
- [ ] Test button truncation with long labels
- [ ] Verify icon sizing is consistent
- [ ] Test dark mode colors work correctly
- [ ] Verify gap and spacing are consistent with other widgets
- [ ] Test coaching placeholder is visually appropriate

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
# Verify "Quick Actions" widget displays
# Verify contextual buttons appear based on user state
# Click buttons to verify navigation works
# Verify "Coaching Sessions" widget displays
# Click "Schedule Session" button
```

## Acceptance Criteria

- [ ] Quick Actions widget displays contextual buttons
- [ ] "New Presentation" always displays
- [ ] "Continue Course" shows only if course not complete
- [ ] "Take Assessment" shows only if assessment not completed
- [ ] "View Storyboards" shows only if presentations exist
- [ ] Buttons navigate to correct routes
- [ ] 2-column grid displays correctly on all sizes
- [ ] Icons display correctly
- [ ] Coaching widget renders placeholder
- [ ] "Schedule Session" button navigates to coaching page
- [ ] Dark mode colors work correctly
- [ ] TypeScript passes with no errors
- [ ] Card styling matches other widgets
- [ ] All navigation routes exist and work
- [ ] E2E test can select widgets by data-testid

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No - existing patterns reused*
