# Feature Plan: Presentation Outline Table Widget

**Issue**: #1275
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 4 (Presentation Table)
**Effort**: M (Medium)
**Dependencies**: #1269 (Dashboard Layout)
**Status**: Ready for Implementation

---

## Overview

Create a full-width table widget displaying the user's presentation outlines from `building_blocks_submissions`. Shows presentation title, creation date, status, and quick actions. Uses existing table patterns from Shadcn UI. This widget spans the full width in row 3 of the dashboard grid.

## Solution Approach

### Component Architecture

Server component that fetches presentations and renders a data table:

```tsx
// apps/web/app/home/(user)/_components/widgets/presentation-table-widget.tsx
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Button } from '@kit/ui/button';
import Link from 'next/link';
import { Eye, Edit } from 'lucide-react';

interface PresentationTableWidgetProps {
  userId: string;
}

export async function PresentationTableWidget({ userId }: PresentationTableWidgetProps) {
  const client = getSupabaseServerClient();

  // Fetch user's presentations
  const { data: presentations, error } = await client
    .from('building_blocks_submissions')
    .select('id, title, created_at, updated_at, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !presentations || presentations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Presentations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No presentations yet.{' '}
            <Link href="/home/presentations/new" className="underline hover:no-underline">
              Create your first presentation
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Presentations</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {presentations.length} presentation{presentations.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentations.map(presentation => (
                <TableRow key={presentation.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {presentation.title}
                  </TableCell>
                  <TableCell>
                    {new Date(presentation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={getStatusBadgeClass(presentation.status)}>
                      {formatStatus(presentation.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/home/presentations/${presentation.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/home/presentations/${presentation.id}/outline`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusBadgeClass(status: string): string {
  const baseClass = 'inline-block px-2 py-1 rounded-full text-xs font-medium';
  const statusClasses: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return `${baseClass} ${statusClasses[status] || statusClasses.draft}`;
}
```

## Research Applied

### From Manifest
- **Data Source**: `building_blocks_submissions` table with columns: id, title, created_at, updated_at, status
- **Full Width Layout**: Widget spans 3 columns in row 3 of dashboard grid
- **Quick Actions**: Links to view detail page and edit outline
- **Server Component Pattern**: Fetch in server component, render static table
- **Empty State**: Handle users with no presentations

### From Frontend Design Skill
- **shadcn/ui Table**: Use Table, TableHeader, TableBody, TableRow, TableHead, TableCell from @kit/ui/table
- **Columns**: Title (truncated), Created Date, Status, Actions
- **Status Badge**: Color-coded status indicators (draft, in_review, published, archived)
- **Icons**: Eye (view) and Edit icons from lucide-react
- **Ghost Buttons**: Use variant="ghost" for action buttons to keep layout clean
- **Responsive**: Use overflow-x-auto for mobile scrolling
- **Date Formatting**: Use `.toLocaleDateString()` for consistent date display

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/widgets/presentation-table-widget.tsx` | Server component that fetches and displays presentation table |

### Modified Files

| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Add presentation table widget in row 3 spanning full width |

## Implementation Tasks

### Task 1: Create Presentation Table Widget
- [ ] Create file with `'use server'` directive
- [ ] Accept `userId` prop
- [ ] Query `building_blocks_submissions` table using Supabase server client
- [ ] Filter by `user_id` with `.eq('user_id', userId)`
- [ ] Order by `created_at` descending to show newest first
- [ ] Select columns: id, title, created_at, updated_at, status
- [ ] Handle error and empty cases with appropriate message
- [ ] Render Card with title and presentation count
- [ ] Render Shadcn Table component with columns
- [ ] Truncate long titles with max-w-md truncate classes
- [ ] Format created_at as local date string
- [ ] Render status with color-coded badges
- [ ] Add View button linking to presentation detail page
- [ ] Add Edit button linking to outline editor
- [ ] Make table responsive with overflow-x-auto
- [ ] Add `data-testid="presentation-table-widget"` for E2E tests

### Task 2: Helper Functions
- [ ] Create `formatStatus()` function to convert underscores to spaces and capitalize
- [ ] Create `getStatusBadgeClass()` function to map status to color classes
- [ ] Test with different status values (draft, in_review, published, archived)

### Task 3: Database Query Validation
- [ ] Verify `building_blocks_submissions` table exists in Supabase
- [ ] Verify columns: id, user_id, title, created_at, updated_at, status
- [ ] Verify status column values (draft, in_review, published, archived)
- [ ] Verify RLS policy allows user to read their own submissions
- [ ] Test query manually in Supabase console
- [ ] Ensure query returns empty array for users with no presentations

### Task 4: Navigation Route Validation
- [ ] Verify `/home/presentations/[id]` detail page exists
- [ ] Verify `/home/presentations/[id]/outline` editor page exists
- [ ] Test navigation links work from table
- [ ] Ensure routes pass presentation ID correctly

### Task 5: Table Styling and Responsive Layout
- [ ] Verify table displays correctly on desktop
- [ ] Test horizontal scrolling on mobile/tablet
- [ ] Verify status badges display in light and dark mode
- [ ] Test truncation of long titles works
- [ ] Verify button sizing and spacing
- [ ] Ensure header text is readable
- [ ] Test with 0, 1, 5, and 20+ presentations

### Task 6: Dashboard Integration
- [ ] Update dashboard page to include presentation table widget
- [ ] Add to row 3 with `col-span-1 md:col-span-2 lg:col-span-3`
- [ ] Add Suspense boundary with WidgetSkeleton
- [ ] Test layout is full-width on all screen sizes

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
# Verify "Your Presentations" widget displays
# Verify table shows presentations
# Verify status badges display correctly
# Verify date formatting is correct
# Test View and Edit buttons navigate correctly
# Test responsive layout (try on mobile/tablet)
# Test horizontal scroll on narrow screens
```

## Acceptance Criteria

- [ ] Widget fetches data from `building_blocks_submissions` table
- [ ] Table displays all user presentations
- [ ] Title column shows presentation titles
- [ ] Created date displays as formatted date
- [ ] Status displays with color-coded badges
- [ ] View button navigates to detail page
- [ ] Edit button navigates to outline editor
- [ ] Empty state displays for users with no presentations
- [ ] Table is full-width in dashboard grid
- [ ] Table is responsive (horizontal scroll on mobile)
- [ ] Long titles truncate with ellipsis
- [ ] Status badge colors work in light and dark mode
- [ ] TypeScript passes with no errors
- [ ] Card styling matches other widgets
- [ ] RLS protects query (user can only see their own presentations)
- [ ] E2E test can select widget by data-testid
- [ ] Presentations sorted by creation date (newest first)

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No - existing table patterns reused*
