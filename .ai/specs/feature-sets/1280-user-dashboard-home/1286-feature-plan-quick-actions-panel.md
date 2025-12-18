# Feature Plan: Quick Actions Panel

**Issue**: #1286
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: S (Small)
**Dependencies**: None

---

## Overview

Contextual action buttons for common user tasks based on user state. Displays primary CTAs (Call-To-Actions) that help users quickly navigate to important features:
- "Continue Course" (if course in progress)
- "New Presentation"
- "Complete Assessment" (if not completed)
- "Review Storyboard" (if draft presentations exist)

Buttons are static links, making this component independent and implementable without data dependencies.

## Solution Approach

### Component Structure

**Button Grid**:
- 2x2 grid of action buttons (responsive: stacks on mobile)
- Each button 50% width on desktop, 100% on mobile
- Primary button highlighted (most important action)
- Secondary buttons with outline variant

**Button Strategy**:
- Primary: "New Presentation" (most common action)
- Secondary: "Complete Assessment", "Continue Course", "Review Storyboard"
- Icons for quick visual recognition
- Links to appropriate dashboard sections

### Button Definitions

| Button | Link | Icon | Variant | Logic |
|--------|------|------|---------|-------|
| Continue Course | `/home/courses` | Play | primary | Always show |
| New Presentation | `/home/canvas` | Plus | default | Always show |
| Complete Assessment | `/home/assessment` | CheckCircle2 | secondary | Always show* |
| Review Storyboard | `/home/canvas?filter=draft` | BookOpen | secondary | Always show* |

*Note: Always show - conditional rendering can be added in integration phase if needed

### Key Implementation Details

1. **Static Component**
   - No data fetching required
   - Server or client component (simple, can be either)
   - Just links and styling

2. **Button Layout**
   - Grid with `grid-cols-2` on desktop
   - Stack to `grid-cols-1` on mobile
   - Gap between buttons for spacing

3. **Button Styling**
   - Primary: `variant="default"` (filled)
   - Secondary: `variant="outline"` (outlined)
   - Medium size: `size="lg"` for dashboard
   - Icons on left, label on right

4. **Iconography**
   - Play icon (Play) - Continue learning
   - Plus icon (Plus) - Create new
   - Check icon (CheckCircle2) - Complete task
   - Book icon (BookOpen) - Review content

### Code Pattern

```typescript
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Play, Plus, CheckCircle2, BookOpen } from 'lucide-react';
import Link from 'next/link';

export function QuickActionsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {/* Row 1 */}
          <Button variant="default" size="lg" asChild>
            <Link href="/home/canvas">
              <Plus className="w-4 h-4 mr-2" />
              New Presentation
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/home/courses">
              <Play className="w-4 h-4 mr-2" />
              Continue Course
            </Link>
          </Button>

          {/* Row 2 */}
          <Button variant="outline" size="lg" asChild>
            <Link href="/home/assessment">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Assessment
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/home/canvas?filter=draft">
              <BookOpen className="w-4 h-4 mr-2" />
              Storyboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/quick-actions-panel.tsx` | Static action button grid |

## Implementation Tasks

### Task 1: Create component scaffold
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/quick-actions-panel.tsx`
- [ ] Import Button component from @kit/ui
- [ ] Import Card components from @kit/ui
- [ ] Import icons (Plus, Play, CheckCircle2, BookOpen) from lucide-react
- [ ] Import Link from next/link

### Task 2: Create button grid layout
- [ ] Create Card wrapper with header
- [ ] Add CardTitle: "Quick Actions"
- [ ] Add CardDescription: "Get started"
- [ ] Create grid with `grid-cols-2` (responsive to `grid-cols-1` on mobile)
- [ ] Add appropriate gap spacing

### Task 3: Implement action buttons
- [ ] "New Presentation" button - primary variant, `/home/canvas`
- [ ] "Continue Course" button - outline variant, `/home/courses`
- [ ] "Complete Assessment" button - outline variant, `/home/assessment`
- [ ] "Review Storyboard" button - outline variant, `/home/canvas?filter=draft`
- [ ] Add appropriate icons for each button

### Task 4: Button styling and spacing
- [ ] Use `size="lg"` for medium button size
- [ ] Align icons on left with text on right
- [ ] Ensure consistent spacing between buttons
- [ ] Buttons should fill available width in grid cell

### Task 5: Responsive layout
- [ ] Test on mobile (should stack vertically)
- [ ] Test on tablet (2-column grid)
- [ ] Test on desktop (2-column grid)
- [ ] Verify button labels don't truncate

### Task 6: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test all links navigate correctly
- [ ] Test responsive layout on different screen sizes
- [ ] Verify button hover states work
- [ ] Verify button styling matches design system

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] Displays 4 action buttons in 2x2 grid
- [ ] Primary button ("New Presentation") highlighted
- [ ] Secondary buttons use outline variant
- [ ] All buttons have appropriate icons
- [ ] Links navigate to correct URLs
- [ ] Responsive layout (2-col desktop, 1-col mobile)
- [ ] Button spacing and sizing consistent
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
