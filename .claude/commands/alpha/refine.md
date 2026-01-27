---
description: Debug and fine-tune Alpha implementation after review
argument-hint: <S#|spec-#> [--issue "description"] [--feature S#.I#.F#]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, Skill, WebFetch]
---

# Alpha Refinement Command

Debug and fine-tune an Alpha implementation after human review. This command pulls the alpha branch locally and provides targeted debugging, leveraging the spec/initiative/feature/task context.

**Arguments:**
- `<spec-id>` - Required. Spec ID in format `S1362` or `1362`
- `--issue "description"` - Optional. Description of the issue to fix
- `--feature <S#.I#.F#>` - Optional. Scope refinement to a specific feature

## Context

This command works locally on your machine. Your job is to:
1. Fetch and checkout the alpha branch
2. Understand the reported issue
3. Diagnose the root cause using appropriate skills
4. Fix the issue
5. Verify the fix using existing verification commands
6. Commit and push the fix

## Phase 0: Setup & Load Context

**FIRST**: Record the current branch so we can offer to return to it later:
```bash
ORIGINAL_BRANCH=$(git branch --show-current)
```

1. **Parse arguments**:
   ```typescript
   const args = '$ARGUMENTS'.split(/\s+/);
   const specId = args[0]; // S1362 or 1362
   let issueDescription = '';
   let featureId = '';

   // Parse --issue "description"
   const issueIndex = args.indexOf('--issue');
   if (issueIndex !== -1) {
     // Extract quoted string
     const rest = '$ARGUMENTS'.slice('$ARGUMENTS'.indexOf('--issue') + 7).trim();
     const match = rest.match(/^"([^"]+)"/);
     issueDescription = match ? match[1] : args[issueIndex + 1] || '';
   }

   // Parse --feature S#.I#.F#
   const featureIndex = args.indexOf('--feature');
   if (featureIndex !== -1 && args[featureIndex + 1]) {
     featureId = args[featureIndex + 1];
   }
   ```

2. **Load spec manifest**:
   Use Glob to find the spec directory:
   ```
   Glob pattern: .ai/alpha/specs/*S{specId}*-Spec-*/spec-manifest.json
   ```

   Read the spec-manifest.json to get:
   - Branch name (from `sandbox.branch_name`)
   - Feature list (from `feature_queue`)
   - Research directory (from `metadata.research_dir`)

3. **Checkout the alpha branch locally**:

   **IMPORTANT**: Before switching branches, check for uncommitted changes:
   ```bash
   # Check current branch and status
   git branch --show-current
   git status --porcelain
   ```

   If there are uncommitted changes, ask user what to do:
   - Stash changes (`git stash`)
   - Abort and let user handle manually

   **Fetch and checkout the alpha branch**:
   ```bash
   # Fetch latest from remote
   git fetch origin

   # Checkout the alpha branch (branch name from spec-manifest.json)
   git checkout <branch_name>

   # Pull latest changes
   git pull origin <branch_name>

   # Install dependencies (in case they changed)
   pnpm install
   ```

   If the branch doesn't exist locally but exists on remote:
   ```bash
   git checkout -b <branch_name> origin/<branch_name>
   ```

4. **Load feature context** (if --feature provided):
   - Find the feature in `feature_queue`
   - Read the feature's `tasks.json` for verification commands
   - Note relevant files and patterns

5. **Get or ask for issue description**:
   If `--issue` was not provided, use AskUserQuestion:
   ```
   question: "What issue would you like to fix?"
   header: "Issue"
   options:
     - label: "Visual/UI bug"
       description: "Something doesn't render correctly"
     - label: "Functional issue"
       description: "Something doesn't work as expected"
     - label: "Performance problem"
       description: "Page is slow or unresponsive"
     - label: "Other"
       description: "Describe the issue"
   ```

## Phase 1: Diagnosis

Based on the issue type, invoke the appropriate skill:

### Issue Type Detection

| Issue Keywords | Type | Skill to Invoke |
|---------------|------|-----------------|
| "rendering", "layout", "CSS", "doesn't show", "hidden" | Visual | frontend-debugging |
| "design", "colors", "spacing", "responsive", "mobile" | Design | frontend-design |
| "component", "React", "state", "props", "hook" | React | react-best-practices |
| "slow", "loading", "timeout", "performance" | Performance | frontend-debugging |
| "doesn't work", "broken", "error", "bug" | Functional | (no skill, trace code) |

### Skill Invocation

**For Visual/UI issues**:
```
Invoke Skill tool:
  skill: "frontend-debugging"

The skill will guide you through:
- Browser inspection with agent-browser or Playwright
- Console error analysis
- Network request inspection
- CSS debugging
```

**For Design issues**:
```
Invoke Skill tool:
  skill: "frontend-design"

The skill will guide you through:
- Design system adherence
- Responsive breakpoints
- Spacing and typography
- Color consistency
```

**For React issues**:
```
Invoke Skill tool:
  skill: "react-best-practices"

The skill will guide you through:
- Component structure analysis
- State management patterns
- Performance optimization
- Hook usage patterns
```

### Visual Debugging (for UI issues)

If the issue involves visual rendering, use agent-browser:

```bash
# Start dev server if not running
pnpm dev &

# Wait for server
sleep 10

# Open the affected page
agent-browser open http://localhost:3000/[route]

# Wait for page load
agent-browser wait 3000

# Get accessibility tree snapshot
agent-browser snapshot -i -c

# Check for specific elements
agent-browser is visible "Expected Text"
agent-browser find role button "Button Label"

# Capture screenshot
agent-browser screenshot .ai/alpha/validation/refine-before.png
```

### Code Tracing (for functional issues)

For functional issues, trace the code path:

1. **Identify entry point** - Find the component or function that handles the behavior
2. **Read related files** - Examine imports, hooks, and data flow
3. **Check console/network** - Look for runtime errors
4. **Verify data flow** - Ensure props and state are correct

## Phase 2: Fix Implementation

After diagnosis, implement the fix:

1. **Create TodoWrite tasks** for the fix:
   - Break down the fix into atomic steps
   - Mark each step as you complete it

2. **Edit files** to implement the fix:
   - Follow existing code patterns
   - Keep changes minimal and focused
   - Add comments if the fix is non-obvious

3. **Test the fix locally**:
   - Reload the page in agent-browser
   - Verify the issue is resolved
   - Check for regressions

## Phase 3: Verification

Run verification commands from tasks.json:

```bash
# Always run typecheck
pnpm typecheck

# Always run lint
pnpm lint

# Run feature-specific verification commands if available
# (from tasks.json verification_command fields)
```

### Visual Verification (for UI fixes)

```bash
# Capture after screenshot
agent-browser open http://localhost:3000/[route]
agent-browser wait 3000
agent-browser screenshot .ai/alpha/validation/refine-after.png

# Verify the fix
agent-browser is visible "Expected Element"
```

## Phase 4: Commit & Report

After verification passes:

1. **Stage changes**:
   ```bash
   git add -A
   ```

2. **Create commit**:
   ```bash
   git commit -m "fix(alpha): [brief description of fix]

   Issue: [issue description]
   Type: [visual|functional|performance|design]

   - [Bullet point of change 1]
   - [Bullet point of change 2]

   [agent: alpha-refine]"
   ```

3. **Push to remote**:
   ```bash
   git push origin HEAD
   ```

4. **Report summary**:
   Output a summary of:
   - Issue that was fixed
   - Root cause
   - Changes made
   - Files modified
   - Verification results

## Skill Invocation Quick Reference

Use the Skill tool to invoke these skills based on issue type:

```markdown
# Visual/UI bugs
IF issue contains ["rendering", "layout", "CSS", "doesn't show", "hidden", "display"]:
    Invoke Skill: frontend-debugging

# Design quality issues
IF issue contains ["design", "colors", "spacing", "responsive", "mobile", "style"]:
    Invoke Skill: frontend-design

# React/component issues
IF issue contains ["component", "React", "state", "props", "hook", "rerender"]:
    Invoke Skill: react-best-practices

# Performance issues
IF issue contains ["slow", "loading", "timeout", "performance", "lag"]:
    Invoke Skill: frontend-debugging (Lighthouse mode)
```

## Error Handling

### Diagnosis fails
If you cannot identify the root cause:
1. Gather more context with console logs
2. Check browser dev tools via agent-browser
3. Ask user for clarification if needed

### Fix doesn't work
If your fix doesn't resolve the issue:
1. Revert the change
2. Re-diagnose with more context
3. Try alternative approach
4. If blocked, report the blocker

### Verification fails
If verification commands fail after the fix:
1. Review the error messages
2. Fix any type or lint errors
3. Ensure the fix is complete
4. Retry verification

## Example Session

```
=== Alpha Refinement ===
Spec: S1362 - User Dashboard
Issue: "Login button doesn't render on mobile"

[Phase 0: Setup & Load Context]
✓ Found spec directory
✓ Loaded spec-manifest.json
✓ Branch: alpha/spec-S1362
✓ Checking for uncommitted changes... none found
✓ Fetching from remote...
✓ Checked out alpha/spec-S1362
✓ Running pnpm install...

[Phase 1: Diagnosis]
Detected issue type: Visual
Invoking skill: frontend-debugging

[Skill: frontend-debugging]
Checking mobile viewport...
agent-browser open http://localhost:3000/login --viewport 375x667
agent-browser snapshot -i -c

Found: Button has `hidden md:block` class
Root cause: Tailwind responsive class hiding button on mobile

[Phase 2: Fix Implementation]
Editing: apps/web/app/(auth)/login/_components/login-form.tsx
- Changed: `hidden md:block` → `block`

[Phase 3: Verification]
✓ pnpm typecheck passed
✓ pnpm lint passed
✓ agent-browser is visible "Login" - passed

[Phase 4: Commit & Report]
✓ Committed: fix(alpha): show login button on mobile
✓ Pushed to alpha/spec-S1362

=== Refinement Complete ===
Issue: Login button doesn't render on mobile
Root cause: Tailwind responsive class `hidden md:block`
Fix: Changed to `block` for all viewports
Files: apps/web/app/(auth)/login/_components/login-form.tsx
```

## Phase 5: Cleanup (Optional)

After refinement is complete, offer to return to the original branch:

```bash
# Ask user if they want to return to original branch
# If yes:
git checkout <original_branch>
```

Use AskUserQuestion:
```
question: "Return to your original branch?"
header: "Cleanup"
options:
  - label: "Yes, return to [original_branch]"
    description: "Switch back to the branch you were on before"
  - label: "No, stay on alpha branch"
    description: "Continue working on the alpha branch"
```

## Arguments

Spec ID: $ARGUMENTS
