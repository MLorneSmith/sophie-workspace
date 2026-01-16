# Planning Command Template

Use this template for commands that create implementation plans (feature, bug, chore planning).

---

## Template

```markdown
---
description: <Brief description of what this command plans>
argument-hint: [description-or-issue-number]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# <Command Title>

Create a plan for: $ARGUMENTS

## Instructions

IMPORTANT: You're creating a plan, not implementing. The plan will be used by /implement later.

1. **Interview user** (if needed). Ask for:
   - Description of what needs to be done
   - Priority level (critical/high/medium/low)
   - Any constraints or requirements

2. **Parse input**. Extract variables:
   ```typescript
   const title = '[Brief title for GitHub]';
   const type = '[feature|bug|chore]';
   const priority = '[critical|high|medium|low]';
   ```

3. **Load relevant context**:
   ```bash
   slashCommand /conditional_docs <command-type> "[brief summary]"
   ```

4. **Read suggested documents** from conditional_docs output

5. **Research the codebase**:
   - Use Task tool with `subagent_type=Explore` for open-ended exploration
   - Follow existing patterns and conventions
   - Identify affected files and dependencies

6. **Create the plan** in `.ai/reports/<type>-reports/YYYY-MM-DD/`:
   - **Initial filename**: `pending-<type>-plan-<slug>.md`
   - Use the `Plan Format` below
   - Replace all <placeholders> with actual content

7. **Create GitHub issue** using the `GitHub Issue Creation` section

8. **Report results** following the `Report` section

## Relevant Files

Focus on these areas:
- `README.md` - Project overview
- `apps/web/` - Main application
- `.ai/ai_docs/` - Context documentation

## Plan Format

```md
# <Type>: <Title>

## Summary
<Brief description of what this plan covers>

## Problem Statement
<What problem does this solve?>

## Solution Approach
<How will we solve it?>

## Affected Files
<List files that will be modified or created>

## Step by Step Tasks
### Step 1: <First task>
- [ ] Sub-task 1
- [ ] Sub-task 2

### Step 2: <Second task>
- [ ] Sub-task 1

## Testing Strategy
<How will we verify this works?>

## Validation Commands
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm build`

## Notes
<Any additional context or considerations>
```

## GitHub Issue Creation

```bash
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "<Type>: <title>" \
  --body "<issue-content>" \
  --label "type:<type>" \
  --label "status:ready" \
  --label "priority:<priority>"

# After creating, rename the plan file
mv .ai/reports/<type>-reports/<date>/pending-<type>-plan-<slug>.md \
   .ai/reports/<type>-reports/<date>/<issue-number>-<type>-plan-<slug>.md
```

## Report

- Summarize the plan in bullet points
- Include path to plan file: `.ai/reports/<type>-reports/YYYY-MM-DD/<issue#>-<type>-plan-<slug>.md`
- Report the GitHub issue #
```

---

## Customization Points

1. **Plan Format**: Modify sections based on your workflow needs
2. **Relevant Files**: Update to match your project structure
3. **GitHub Labels**: Adjust label scheme for your repository
4. **Validation Commands**: Add project-specific validation steps
