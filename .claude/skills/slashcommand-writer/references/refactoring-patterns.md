# Slash Command Refactoring Patterns

Common patterns for improving existing slash commands.

---

## Pattern 1: Add Missing Frontmatter

**Problem**: Command has no YAML frontmatter or incomplete frontmatter.

**Before**:
```markdown
# My Command

Do something useful.
```

**After**:
```markdown
---
description: Do something useful with proper configuration
model: haiku
allowed-tools: [Bash]
---

# My Command

Do something useful.
```

**Checklist**:
- [ ] Add `description` (< 200 chars)
- [ ] Add `model` (haiku or opus)
- [ ] Add `allowed-tools` if restricting
- [ ] Add `argument-hint` if accepting input

---

## Pattern 2: Fix Model Mismatch

**Problem**: Simple command using expensive model, or complex command using weak model.

### Utility Using Opus

**Before**:
```yaml
---
description: List Docker containers
model: opus
---
```

**After**:
```yaml
---
description: List Docker containers
model: haiku
---
```

### Complex Planning Using Haiku

**Before**:
```yaml
---
description: Create comprehensive feature implementation plan
model: haiku
---
```

**After**:
```yaml
---
description: Create comprehensive feature implementation plan
model: opus
---
```

**Decision Guide**:
| Command Characteristics | Recommended Model |
|------------------------|-------------------|
| < 30 lines, simple bash | haiku |
| Status/info queries | haiku |
| Routing/classification | haiku |
| Multi-step planning | opus |
| Code generation | opus |
| Interview workflows | opus |

---

## Pattern 3: Add Structured Instructions

**Problem**: Instructions are vague or unstructured.

**Before**:
```markdown
## Instructions

Do the thing. Make sure it works. Handle errors.
```

**After**:
```markdown
## Instructions

1. **Validate input**: Check that $ARGUMENTS contains required data
   - If missing, prompt user for input
   - If invalid format, show expected format

2. **Execute operation**: Run the main command
   ```bash
   example-command --flag value
   ```

3. **Handle errors**: If the command fails
   - Check common causes (permissions, missing deps)
   - Provide actionable error message

4. **Report results**: Show outcome to user
```

**Principles**:
- Use numbered steps for sequential actions
- Bold step titles for scanability
- Include code examples where helpful
- Add error handling guidance

---

## Pattern 4: Add Report Section

**Problem**: Command has no output guidance.

**Before**:
```markdown
## Instructions

1. Do step 1
2. Do step 2
```

**After**:
```markdown
## Instructions

1. Do step 1
2. Do step 2

## Report

After completion:
- Summarize what was accomplished
- List any files created or modified
- Note any warnings or follow-up actions needed
```

---

## Pattern 5: Add Input Handling

**Problem**: Command expects input but doesn't handle $ARGUMENTS.

**Before**:
```markdown
---
description: Process the user's request
argument-hint: [request-description]
---

# Process Request

## Instructions

1. Understand the request
2. Process it
```

**After**:
```markdown
---
description: Process the user's request
argument-hint: [request-description]
---

# Process Request

Process: $ARGUMENTS

## Instructions

1. **Parse the request** from $ARGUMENTS above
   - Extract key information
   - Identify request type

2. **Process the request**
   - Execute appropriate action

## Report

Summarize what was processed and the outcome.
```

---

## Pattern 6: Add Integration Points

**Problem**: Command could benefit from project integrations.

### Add Conditional Documentation

**Before**:
```markdown
## Instructions

1. Research the codebase
2. Implement the feature
```

**After**:
```markdown
## Instructions

1. **Load relevant context**:
   ```bash
   slashCommand /conditional_docs implement "[brief summary]"
   ```

2. **Read suggested documents** before proceeding

3. **Research the codebase**
   - Use Task with `subagent_type=Explore`

4. **Implement the feature**
```

### Add GitHub Integration

**Before**:
```markdown
## Instructions

1. Create the plan
2. Done
```

**After**:
```markdown
## Instructions

1. Create the plan

2. **Create GitHub issue**:
   ```bash
   gh issue create \
     --repo MLorneSmith/2025slideheroes \
     --title "Feature: <title>" \
     --body "<plan-content>" \
     --label "type:feature"
   ```

## Report

- Summarize the plan
- Report the GitHub issue #
```

### Add TodoWrite for Multi-Step

**Before**:
```markdown
## Instructions

1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5
```

**After**:
```markdown
## Instructions

For implementations with multiple steps, use TodoWrite:
- Create todos at the start for all major tasks
- Mark exactly ONE as in_progress while working
- Mark completed immediately after finishing

1. **Step 1**
2. **Step 2**
3. **Step 3**
4. **Step 4**
5. **Step 5**
```

---

## Pattern 7: Improve Clarity

**Problem**: Instructions are ambiguous or assume knowledge.

### Remove Jargon

**Before**:
```markdown
Run the RLS policy against the tenant schema with proper RBAC.
```

**After**:
```markdown
Run the Row Level Security policy:
```bash
# This ensures users can only access their own data
pnpm --filter web supabase migration up
```
```

### Add Context

**Before**:
```markdown
Update the config file.
```

**After**:
```markdown
Update the configuration file at `apps/web/.env.local`:
- Add the new API key under `NEXT_PUBLIC_API_KEY`
- Ensure the value matches your dashboard settings
```

### Specify Paths

**Before**:
```markdown
Check the schema file.
```

**After**:
```markdown
Check the schema file at `apps/web/supabase/schemas/01-accounts.sql`.
```

---

## Pattern 8: Add Error Handling

**Problem**: Command doesn't handle failure cases.

**Before**:
```markdown
## Instructions

1. Run the command
   ```bash
   some-command
   ```
```

**After**:
```markdown
## Instructions

1. Run the command:
   ```bash
   some-command
   ```

   **If this fails:**
   - Check that dependencies are installed: `pnpm install`
   - Verify environment variables are set
   - Check logs at `/tmp/command.log`
```

---

## Pattern 9: Restructure for Command Type

**Problem**: Command structure doesn't match its type.

### Utility → Add ## Run

**Before**:
```markdown
## Instructions

Execute `docker ps`.
```

**After**:
```markdown
## Run

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Report

Display the container status table.
```

### Planning → Add Plan Format

**Before**:
```markdown
## Instructions

Create a plan for the feature.
```

**After**:
```markdown
## Instructions

Create a plan using the format below.

## Plan Format

```md
# Feature: <name>

## Summary
<what this feature does>

## Tasks
1. [ ] Task 1
2. [ ] Task 2

## Validation
- `pnpm typecheck`
- `pnpm test`
```
```

---

## Pattern 10: Consolidate Redundancy

**Problem**: Command has repeated or redundant content.

**Before**:
```markdown
## Instructions

1. Check that you're on the right branch
2. Make sure you're on the correct branch
3. Verify the branch is correct
4. Do the actual work
```

**After**:
```markdown
## Pre-Check

- [ ] Verify you're on the correct git branch

## Instructions

1. Do the actual work
```

---

## Quick Reference

| Issue | Pattern | Key Change |
|-------|---------|------------|
| No frontmatter | Pattern 1 | Add YAML block |
| Wrong model | Pattern 2 | Match complexity |
| Vague instructions | Pattern 3 | Number + bold |
| No output guidance | Pattern 4 | Add ## Report |
| Lost input | Pattern 5 | Handle $ARGUMENTS |
| Missing context | Pattern 6 | Add integrations |
| Unclear steps | Pattern 7 | Specify paths/details |
| No error handling | Pattern 8 | Add failure cases |
| Wrong structure | Pattern 9 | Match command type |
| Redundant content | Pattern 10 | Consolidate |
