# Chore: Fix "Get Started" button navigation on AI workspace dashboard

## Chore Description

The "Build New Presentation" card on the `/home/ai` route contains a "Get Started" button that incorrectly navigates users to `/home/ai/storyboard`. The correct destination should be `/home/ai/blocks` which contains the `BlocksMultistepForm` for starting a new presentation.

This is a simple one-line URL fix in the AIWorkspaceDashboard component.

## Relevant Files

Use these files to resolve the chore:

- **`apps/web/app/home/(user)/ai/_components/AIWorkspaceDashboard.tsx`** - Contains the "Get Started" button with the incorrect href on line 62. This is the only file that needs modification.
- **`apps/web/app/home/(user)/ai/blocks/page.tsx`** - The correct destination page (for reference/verification only).
- **`apps/web/app/home/(user)/ai/storyboard/page.tsx`** - The current incorrect destination (for reference only).

## Impact Analysis

This is an isolated UI navigation fix with no impact on other components or functionality.

### Dependencies Affected

- None. This is a static href value change with no dependent packages or modules.

### Risk Assessment

**Low Risk**:
- Single line change to a static href string
- No logic changes
- No database or API impact
- No state management impact
- Change is easily testable and reversible

### Backward Compatibility

- Fully backward compatible
- No breaking changes
- No migration needed
- No API versioning concerns

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/fix-get-started-navigation`
- [ ] Verify `/home/ai/blocks` page exists and loads correctly
- [ ] Confirm the current incorrect behavior by clicking "Get Started"

## Documentation Updates Required

- None required. This is a bug fix for incorrect navigation, not a feature change.

## Rollback Plan

- Revert the single line href change from `/home/ai/blocks` back to `/home/ai/storyboard`
- No database migrations or complex rollback procedures needed
- Git revert of the commit is sufficient

## Step by Step Tasks

### Step 1: Update the "Get Started" button href

In `apps/web/app/home/(user)/ai/_components/AIWorkspaceDashboard.tsx`:

- Locate line 62 containing `href="/home/ai/storyboard"`
- Change to `href="/home/ai/blocks"`

**Before:**
```tsx
<Link
  href="/home/ai/storyboard"
  className={buttonVariants({
    variant: "outline",
    className: "w-full",
  })}
>
  Get Started
</Link>
```

**After:**
```tsx
<Link
  href="/home/ai/blocks"
  className={buttonVariants({
    variant: "outline",
    className: "w-full",
  })}
>
  Get Started
</Link>
```

### Step 2: Run validation commands

Execute the validation commands below to ensure the change compiles correctly and doesn't break any existing tests.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Verify TypeScript compilation succeeds
pnpm typecheck

# Run linting to ensure code quality
pnpm lint

# Run unit tests for the web app
pnpm --filter web test:unit

# Build the application to verify no build errors
pnpm --filter web build
```

## Notes

- The third card ("Create Storyboard") on the same dashboard correctly links to `/home/ai/storyboard` and should remain unchanged
- The description text for "Build New Presentation" says "Start by creating a new presentation outline and storyboard" which may need updating in a future task to better reflect the blocks workflow, but that is out of scope for this chore
