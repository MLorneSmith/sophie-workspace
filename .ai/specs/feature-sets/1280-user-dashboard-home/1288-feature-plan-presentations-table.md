# Feature Plan: Presentations Table

**Issue**: #1288
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: M (Medium)
**Dependencies**: #1281 (Dashboard Data Loader)

---

## Overview

Full-width table displaying user's presentation outlines with title, creation date, and quick buttons to edit outline and manage rows. Serves as a dashboard view of the user's active presentations for quick navigation without visiting the full canvas page.

Table is sorted by creation date (newest first) for easy access to recently worked-on presentations.

## Solution Approach

### Component Structure

**Table Layout**:
- Full-width spanning all 3 columns
- Column headers: Title, Created, Actions
- Rows: One per presentation
- Empty state: "No presentations yet" with CTA

**Columns**:
1. **Title**: Presentation outline title with truncation
2. **Created**: Formatted creation date (e.g., "Dec 18, 2025")
3. **Actions**:
   - "Edit Outline" button (primary action)
   - Dropdown menu with "Manage", "Duplicate", "Delete"

### Data Format

Input from `loadPresentations()`:
```typescript
Array<{
  id: string;
  title: string;
  outline?: string;
  storyboard?: string;
  created_at: string; // ISO date
}>
```

### Key Implementation Details

1. **Client Component** (Recommended)
   - Add `"use client"` directive for interactivity
   - Accept presentations array prop
   - Handle sorting and filtering

2. **Table Implementation**
   - Use shadcn/ui Table components
   - Responsive: horizontal scroll on mobile
   - Header sticky (optional, for large lists)

3. **Date Formatting**
   - Format: "Dec 18, 2025"
   - Hover tooltip: Full timestamp
   - Use date-fns for formatting

4. **Title Display**
   - Truncate long titles (line-clamp-1)
   - Hover tooltip: Full title
   - Click navigates to presentation

5. **Action Buttons**
   - "Edit Outline" primary button
   - Dropdown menu with:
     - "View Full Presentation"
     - "Duplicate"
     - "Delete"
   - Keyboard accessible

6. **Sorting**
   - Sorted by created_at descending (newest first)
   - No user sorting (simpler UX)

### Code Pattern

```typescript
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Edit, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { If } from '@kit/ui/if';
import Link from 'next/link';

interface Presentation {
  id: string;
  title: string;
  outline?: string;
  storyboard?: string;
  created_at: string;
}

interface PresentationsTableProps {
  presentations: Presentation[];
}

export function PresentationsTable({ presentations = [] }: PresentationsTableProps) {
  const sorted = [...presentations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const hasPresentations = sorted.length > 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Presentations</CardTitle>
        <CardDescription>Your outline collection</CardDescription>
      </CardHeader>

      <CardContent>
        <If condition={hasPresentations} fallback={<EmptyState />}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((presentation) => (
                  <PresentationRow
                    key={presentation.id}
                    presentation={presentation}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </If>
      </CardContent>
    </Card>
  );
}

function PresentationRow({ presentation }: { presentation: Presentation }) {
  const createdDate = format(new Date(presentation.created_at), 'MMM d, yyyy');
  const createdTime = format(new Date(presentation.created_at), 'PPpp');

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium line-clamp-1 max-w-md" title={presentation.title}>
            {presentation.title || 'Untitled Presentation'}
          </span>
          <span className="text-xs text-muted-foreground">ID: {presentation.id}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground" title={createdTime}>
        {createdDate}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="default"
            asChild
            title="Edit presentation outline"
          >
            <Link href={`/home/canvas/${presentation.id}?section=outline`}>
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Edit</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" title="More options">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={`/home/canvas/${presentation.id}`}>
                  View Full Presentation
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/home/canvas/${presentation.id}?action=duplicate`}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                asChild
              >
                <button onClick={() => handleDelete(presentation.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <p className="text-sm text-muted-foreground">
        No presentations yet. Create one to get started!
      </p>
      <Button asChild>
        <Link href="/home/canvas">
          New Presentation
        </Link>
      </Button>
    </div>
  );
}

async function handleDelete(presentationId: string) {
  // Delete action will be implemented with server action
  // This is a placeholder for the implementation
  console.log('Delete presentation:', presentationId);
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/presentations-table.tsx` | Full-width presentations table |

### Server Actions (Separate File)
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_lib/server/presentations-server-actions.ts` | Delete and other mutation actions |

## Implementation Tasks

### Task 1: Create component scaffold
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/presentations-table.tsx`
- [ ] Add `"use client"` directive
- [ ] Import Table components from @kit/ui
- [ ] Import Button, DropdownMenu components from @kit/ui
- [ ] Import icons from lucide-react
- [ ] Define TypeScript interfaces

### Task 2: Create table structure
- [ ] Use shadcn/ui Table components
- [ ] Create table headers: Title, Created, Actions
- [ ] Implement table body with presentation rows
- [ ] Ensure responsive layout (scroll on mobile)

### Task 3: Implement presentation rows
- [ ] Create `PresentationRow` component
- [ ] Display title with truncation and tooltip
- [ ] Display creation date (formatted)
- [ ] Show presentation ID in subtle text
- [ ] Test with various title lengths

### Task 4: Implement action buttons
- [ ] "Edit Outline" button (primary, navigates to canvas)
- [ ] Dropdown menu with:
     - "View Full Presentation"
     - "Duplicate"
     - "Delete" (with destructive styling)
- [ ] Proper icons for each action
- [ ] Hover states and keyboard navigation

### Task 5: Implement empty state
- [ ] Show message when no presentations
- [ ] Display "New Presentation" button
- [ ] Link to canvas creation page

### Task 6: Implement sorting and filtering
- [ ] Sort by creation date (newest first)
- [ ] No interactive sorting (keep simple)
- [ ] Handle title truncation for long names

### Task 7: Server actions for mutations
- [ ] Create separate file for delete action
- [ ] Implement delete with proper RLS
- [ ] Handle error states
- [ ] Optional: Implement duplicate action

### Task 8: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test with 0 presentations (empty state)
- [ ] Test with various presentation counts
- [ ] Test with long titles (truncation)
- [ ] Test all action links and buttons
- [ ] Verify responsive layout

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] Table displays all presentations
- [ ] Sorted by creation date (newest first)
- [ ] Title column shows full title on hover
- [ ] Date column formatted as "MMM d, yyyy"
- [ ] "Edit Outline" button navigates correctly
- [ ] Dropdown menu shows all actions
- [ ] Delete action removes presentation
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Empty state shown when no presentations
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
