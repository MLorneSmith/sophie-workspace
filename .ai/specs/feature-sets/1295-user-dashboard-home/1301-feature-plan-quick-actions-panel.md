# Feature Plan: Quick Actions Panel

**Issue**: #1301
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 2
**Effort**: S (Small)
**Dependencies**: #1296 (Dashboard Data Loader)

---

## Overview

Server component with CTA buttons linking to key user routes. Context-aware based on user state. Shows actions like "Continue Course", "New Presentation", "Complete Assessment", and "Review Storyboard" based on what the user needs to do next.

## Solution Approach

**Component Pattern**: Server Component with Conditional CTAs

- Display context-aware action buttons
- Show "Continue Course" if course in progress
- Show "New Presentation" always available
- Show "Complete Assessment" if not completed
- Show "Review Storyboard" if drafts exist
- Button grid layout for easy scanning
- Icons from lucide-react for visual recognition

**Key Design Decisions**:
- Server component for no client overhead
- Query user state to determine which CTAs to show
- Prioritize most relevant actions (continue > start)
- Fixed height prevents layout shift
- Links to related features

## Research Applied

### From Manifest
- Quick actions should be context-aware based on user progress
- Prioritize completion of current tasks
- Always offer "New" actions (presentation, task, etc.)
- Use existing route patterns from navigation config

### From Skills
- Server components for static navigation
- Button groups with icons
- Shadcn components for consistent styling

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` | Quick actions button panel |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and render QuickActionsPanel in dashboard |

## Implementation Tasks

### Task 1: Create Quick Actions Panel Component
- [ ] Import Button, Card components from shadcn
- [ ] Accept dashboard data as props
- [ ] Determine which actions to show based on user state
- [ ] Create buttons for each action with icons
- [ ] Add links to respective feature routes
- [ ] Display in grid layout
- [ ] Add tooltips or descriptions for each action

**File**: `apps/web/app/home/(user)/_components/quick-actions-panel.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import {
  BookOpen,
  FileText,
  Award,
  LayoutGrid,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import type { CourseProgress, Presentation } from '../_lib/types/dashboard.types';

interface QuickActionsPanelProps {
  courseInProgress: boolean;
  assessmentCompleted: boolean;
  hasPresentationDrafts: boolean;
}

export function QuickActionsPanel({
  courseInProgress,
  assessmentCompleted,
  hasPresentationDrafts,
}: QuickActionsPanelProps) {
  const actions = [];

  if (courseInProgress) {
    actions.push({
      label: 'Continue Course',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/home/(user)/course',
      variant: 'default' as const,
    });
  }

  actions.push({
    label: 'New Presentation',
    icon: <Plus className="w-4 h-4" />,
    href: '/home/(user)/presentations/new',
    variant: 'outline' as const,
  });

  if (!assessmentCompleted) {
    actions.push({
      label: 'Take Assessment',
      icon: <Award className="w-4 h-4" />,
      href: '/home/(user)/assessment',
      variant: 'outline' as const,
    });
  }

  if (hasPresentationDrafts) {
    actions.push({
      label: 'Review Storyboard',
      icon: <LayoutGrid className="w-4 h-4" />,
      href: '/home/(user)/presentations',
      variant: 'outline' as const,
    });
  }

  return (
    <Card className="h-[320px] flex flex-col">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            asChild
            variant={action.variant}
            className="w-full justify-start gap-2"
          >
            <Link href={action.href}>
              {action.icon}
              <span className="flex-1 text-left">{action.label}</span>
            </Link>
          </Button>
        ))}

        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No quick actions available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 2: Determine Action Visibility Logic
- [ ] Check if course is in progress
- [ ] Check if assessment completed
- [ ] Check if presentation drafts exist
- [ ] Prioritize "continue" actions over "start" actions
- [ ] Always show "New Presentation" button

### Task 3: Add Icons and Styling
- [ ] Use lucide-react icons for visual recognition
- [ ] Match button styles to dashboard design
- [ ] Use color variants to indicate priority
- [ ] Ensure hover states work correctly

### Task 4: Links and Navigation
- [ ] Link each button to correct route
- [ ] Verify routes exist in app
- [ ] Use Next.js Link for client-side navigation
- [ ] Test navigation on all buttons

### Task 5: Type Safety
- [ ] Add TypeScript interfaces for props
- [ ] No `any` types
- [ ] Proper typing for action objects

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
```

## Acceptance Criteria

- [ ] Component exists at `apps/web/app/home/(user)/_components/quick-actions-panel.tsx`
- [ ] Displays context-aware action buttons
- [ ] Shows "Continue Course" when course in progress
- [ ] Shows "Take Assessment" if not completed
- [ ] Shows "New Presentation" always
- [ ] Shows "Review Storyboard" if drafts exist
- [ ] All buttons link to correct routes
- [ ] Fixed height prevents layout jank
- [ ] Icons display correctly
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
