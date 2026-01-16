# Feature Plan: Presentations Table

**Issue**: #1303
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 2
**Effort**: M (Medium)
**Dependencies**: #1296 (Dashboard Data Loader)

---

## Overview

Server component with shadcn Table displaying user's saved presentations from building_blocks_submissions. Shows title, type, audience, last modified date with action buttons. Full width display under the first row of dashboard components. Includes quick button to edit presentation outline.

## Solution Approach

**Component Pattern**: Server Component with Data Table

- Use shadcn Table component for structured data display
- Display columns: Title, Type, Audience, Last Modified, Actions
- Include "Edit" button for each presentation
- Show presentation count badge
- Sort by last modified (newest first)
- Implement simple pagination or "View All" link
- Responsive layout full-width

**Key Design Decisions**:
- Server component for table data fetching
- Use shadcn Table for consistent styling
- Actions column for quick edit access
- Sort by most recently modified
- Show summary count at top
- Full width across dashboard

## Research Applied

### From Manifest
- Presentations stored in `building_blocks_submissions` table
- Query by user_id with RLS
- Include title, type, audience, last_modified fields
- Sort by last_modified descending

### From Skills
- Server components for data tables
- Shadcn table component patterns
- Responsive table layouts

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/presentations-table.tsx` | Presentations data table component |
| `apps/web/app/home/(user)/_lib/server/presentations.loader.ts` | Server function for loading presentations |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and render PresentationsTable in dashboard |

## Implementation Tasks

### Task 1: Create Data Loader
- [ ] Query presentations from `building_blocks_submissions` table
- [ ] Filter by user_id
- [ ] Sort by last_modified descending
- [ ] Limit to first 10 for dashboard view
- [ ] Return typed Presentation[] data

**File**: `apps/web/app/home/(user)/_lib/server/presentations.loader.ts`

```typescript
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/lib/database.types';
import type { Presentation } from '../types/dashboard.types';

export async function loadPresentations(
  client: SupabaseClient<Database>,
  userId: string,
  limit: number = 10,
): Promise<Presentation[]> {
  try {
    // Query building_blocks_submissions table
    // Filter by user_id
    // Sort by last_modified DESC
    // Limit to specified count
    // Return Presentation[] data
    return [];
  } catch (error) {
    console.error('Failed to load presentations:', error);
    return [];
  }
}
```

### Task 2: Create Presentations Table Component
- [ ] Import Table components from shadcn
- [ ] Accept `Presentation[]` data as props
- [ ] Define table columns: Title, Type, Audience, Modified, Actions
- [ ] Display presentation count summary
- [ ] Add Edit button for each row
- [ ] Format dates with relative time display
- [ ] Style with alternating row colors

**File**: `apps/web/app/home/(user)/_components/presentations-table.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Edit2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { Presentation } from '../_lib/types/dashboard.types';

interface PresentationsTableProps {
  presentations: Presentation[];
}

export function PresentationsTable({
  presentations,
}: PresentationsTableProps) {
  if (presentations.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>My Presentations</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No presentations yet. Start creating your first presentation!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>
          My Presentations ({presentations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentations.map((presentation) => (
                <TableRow key={presentation.id}>
                  <TableCell className="font-medium">
                    {presentation.title}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded bg-muted text-xs">
                      {presentation.type}
                    </span>
                  </TableCell>
                  <TableCell>{presentation.audience}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(
                      new Date(presentation.lastModified),
                      { addSuffix: true }
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link
                          href={`/home/(user)/presentations/${presentation.id}/edit`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link
                          href={`/home/(user)/presentations/${presentation.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
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
```

### Task 3: Column Configuration
- [ ] Define presentation title column
- [ ] Add type badge (e.g., "Pitch", "Executive Summary")
- [ ] Show audience (e.g., "Internal", "Client")
- [ ] Display last modified date with relative formatting
- [ ] Include actions column

### Task 4: Action Buttons
- [ ] Add Edit button for each presentation
- [ ] Add View button to preview
- [ ] Link Edit to presentation editor
- [ ] Link View to presentation view/slideshow
- [ ] Test navigation on all buttons

### Task 5: Empty State and Summary
- [ ] Display friendly message when no presentations
- [ ] Show presentation count in header
- [ ] Provide CTA to create first presentation
- [ ] Test with various data sets

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
```

## Acceptance Criteria

- [ ] Component exists at `apps/web/app/home/(user)/_components/presentations-table.tsx`
- [ ] Displays presentations in table format
- [ ] Shows columns: Title, Type, Audience, Modified, Actions
- [ ] Edit button navigates to presentation editor
- [ ] View button shows presentation
- [ ] Empty state displayed when no presentations
- [ ] Presentation count shown in header
- [ ] Component receives data from dashboard loader via props
- [ ] Full-width layout below dashboard cards
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass
- [ ] Table is responsive on mobile

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
