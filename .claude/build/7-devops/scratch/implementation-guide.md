# Sprint Execution: Implementation Guide

This guide provides detailed instructions for implementing user stories during sprint execution using Claude Code.

## Overview

Sprint execution is where planned stories become working features. This phase emphasizes:

- Test-Driven Development (TDD)
- Following existing patterns
- Maintaining code quality
- Continuous progress tracking

## Pre-Implementation Checklist

Before starting any implementation:

1. **Load Context**

   ```bash
   # Load project standards
   /read CLAUDE.md

   # Load story context
   /read .claude/contexts/story-{id}/context.md

   # Load technical notes
   /read .claude/contexts/story-{id}/technical-notes.md

   # Load progress
   /read .claude/contexts/story-{id}/progress.md
   ```

2. **Review Similar Implementations**

   - Find patterns in existing codebase
   - Identify reusable components
   - Understand project conventions

3. **Set Up Feature Branch**

   ```bash
   git checkout -b feature/story-{id}-{brief-description}
   ```

## Implementation Workflow

### Step 1: Test-Driven Development

**Write Tests First**:

1. **Unit Tests** for business logic:

   ```typescript
   // Example: apps/web/app/home/(user)/editor/_actions/generate-content.test.ts
   describe('generateContentAction', () => {
     it('should validate input with Zod schema', async () => {
       // Test implementation
     });

     it('should generate content within 5 seconds', async () => {
       // Test implementation
     });
   });
   ```

2. **Integration Tests** for workflows:

   ```typescript
   // Example: apps/web/app/home/(user)/editor/editor.integration.test.ts
   describe('Editor Content Generation', () => {
     it('should allow user to generate and apply content', async () => {
       // Test implementation
     });
   });
   ```

### Step 2: Implement Features

**Follow Project Standards**:

1. **Server Actions** with enhanceAction:

   ```typescript
   // apps/web/app/home/(user)/editor/_actions/generate-content.action.ts
   export const generateContentAction = enhanceAction(
     async (data, user) => {
       const parsed = generateContentSchema.parse(data);

       // Implementation following security standards
       // Never expose API keys, always validate input

       return {
         content: generatedContent,
         usage: aiUsage,
       };
     },
     {
       auth: true,
       ratelimit: {
         key: 'ai-content-generation',
         limit: 10,
         window: '1h',
       },
     },
   );
   ```

2. **React Components** (prefer Server Components):

   ```typescript
   // apps/web/app/home/(user)/editor/_components/ContentGenerator.tsx
   export async function ContentGenerator({ slideId }: Props) {
     // Server Component implementation
     const user = await getCurrentUser();

     return (
       <ContentGeneratorClient
         userId={user.id}
         slideId={slideId}
       />
     );
   }
   ```

3. **Database Operations** with RLS:

   ```typescript
   // packages/supabase/src/queries/ai-usage.queries.ts
   export async function trackAIUsage(
     client: SupabaseClient,
     usage: AIUsageInput,
   ) {
     // Always respect RLS policies
     const { data, error } = await client
       .from('ai_usage')
       .insert(usage)
       .select()
       .single();

     if (error) throw new AIUsageError(error);
     return data;
   }
   ```

### Step 3: Validate Implementation

Run these checks after each implementation step:

```bash
# Run tests
pnpm test

# Check types
pnpm typecheck

# Fix linting
pnpm lint:fix

# Run specific test file
pnpm test apps/web/app/home/(user)/editor/_actions/generate-content.test.ts
```

### Step 4: Update Progress

After completing each task:

1. **Update GitHub Issue**:

   - Check off completed task
   - Add implementation notes if needed

2. **Update Progress File**:

   ```markdown
   # .claude/contexts/story-{id}/progress.md

   ## Completed Tasks

   - [x] Create generateContentAction with Zod validation - 2024-01-15
   - [x] Implement ContentGeneratorDialog component - 2024-01-15

   ## Technical Decisions

   - Used Portkey AI Gateway for content generation
   - Implemented rate limiting at 10 requests per hour
   - Added usage tracking for billing
   ```

## Common Implementation Patterns

### Server Actions Pattern

```typescript
// Always use enhanceAction wrapper
export const myAction = enhanceAction(
  async (input, user) => {
    // 1. Validate input with Zod
    const validated = mySchema.parse(input);

    // 2. Perform business logic
    const result = await businessLogic(validated, user);

    // 3. Return typed response
    return result;
  },
  {
    auth: true, // Require authentication
    ratelimit: {
      /* config */
    }, // Add rate limiting
  },
);
```

### Component Pattern

```typescript
// Server Component (default)
export async function MyServerComponent({ id }: Props) {
  const data = await fetchData(id);

  return <MyClientComponent data={data} />;
}

// Client Component (only when needed)
'use client';

export function MyClientComponent({ data }: Props) {
  const [state, setState] = useState(data);

  // Interactive logic here
  return <div>{/* UI */}</div>;
}
```

### Error Handling Pattern

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // User-friendly error messages
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: 'Please check your input and try again'
    };
  }

  // Log technical details, return friendly message
  console.error('Operation failed:', error);
  return {
    success: false,
    error: 'Something went wrong. Please try again.'
  };
}
```

## Quality Standards Checklist

Before marking a task complete:

- [ ] **Tests**: All tests pass (unit and integration)
- [ ] **Types**: No TypeScript errors (no 'any' types)
- [ ] **Security**: RLS enforced, no API keys exposed
- [ ] **Validation**: All inputs validated with Zod
- [ ] **Performance**: No obvious bottlenecks
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Documentation**: Code comments where needed
- [ ] **Patterns**: Follows existing codebase patterns

## Creating Pull Request

When all tasks in a story are complete:

```bash
# Ensure all changes committed
git add .
git commit -m "feat: implement {story-title}

- Add {feature-1}
- Implement {feature-2}
- Update {component}

Closes #{story-number}"

# Push and create PR
git push origin feature/story-{id}-{description}
gh pr create \
  --title "feat: {story-title}" \
  --body "## Summary\n\nImplements #{story-number}\n\n## Changes\n- {change-1}\n- {change-2}\n\n## Testing\n- All tests pass\n- Manual testing completed" \
  --assignee @me
```

## Common Issues and Solutions

### Issue: Context Loading Takes Too Long

**Solution**: Create a session setup script:

```bash
# .claude/contexts/story-{id}/setup.sh
#!/bin/bash
echo "Loading context for Story {id}..."
cat CLAUDE.md
cat .claude/contexts/story-{id}/context.md
cat .claude/contexts/story-{id}/technical-notes.md
cat .claude/contexts/story-{id}/progress.md
```

### Issue: Tests Failing Due to Mocks

**Solution**: Use proper test utilities:

```typescript
import { createMockUser } from '@/tests/factories/user';
import { createMockSupabaseClient } from '@/tests/mocks/supabase';
```

### Issue: Type Errors with Server Actions

**Solution**: Ensure proper typing:

```typescript
import { ActionResponse } from '@/types/actions';

export const myAction = enhanceAction<InputType, ActionResponse<OutputType>>(
  async (input, user) => {
    // Implementation
  },
);
```

## Post-Implementation

After PR is merged:

1. **Update Story Status**: Automatically moves to "Done"
2. **Document Learnings**: Add to retrospective notes
3. **Clean Up**: Delete feature branch
4. **Prepare Next Story**: Load context for next implementation

## Resources

- **Testing Guide**: `.claude/docs/testing/context/test-driven-development.md`
- **Pattern Library**: `.claude/docs/common-patterns.md`
- **Debugging Guide**: `.claude/docs/debugging/debugging-system-overview.md`
- **Performance Guide**: `.claude/docs/architecture/performance-optimization.md`
