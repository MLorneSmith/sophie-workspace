# Execution Command Template

Use this template for commands that execute plans or perform actions (implement, commit, deploy).

---

## Template

```markdown
---
description: <Brief description of what this command executes>
argument-hint: [issue-number-or-input]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite]
---

# <Command Title>

Execute: $ARGUMENTS

## Instructions

IMPORTANT: You're executing a plan that has already been designed.
IMPORTANT: Follow the steps exactly, in order.
IMPORTANT: ALL validation commands MUST pass before marking complete.

1. **Fetch the plan** (if from GitHub issue):
   ```bash
   gh issue view <issue-number> \
     --repo MLorneSmith/2025slideheroes \
     --json body,title,labels,url \
     --jq '{body: .body, title: .title, labels: [.labels[].name], url: .url}'
   ```

2. **Parse plan data**:
   ```typescript
   const planTitle = '[Title from issue]';
   const planType = '[bug-fix|feature|chore]';
   const issueNumber = '[GitHub issue number]';
   ```

3. **Mark issue as in-progress** (if from GitHub):
   ```bash
   gh issue edit <issue-number> \
     --repo MLorneSmith/2025slideheroes \
     --add-label "status:in-progress" \
     --remove-label "status:ready"
   ```

4. **Load relevant context**:
   ```bash
   slashCommand /conditional_docs implement "[brief summary]"
   ```

5. **Read suggested documents** from conditional_docs

6. **Review the plan**:
   - Read the entire plan carefully
   - Understand all steps and validation commands
   - Use TodoWrite for 3+ step implementations

7. **Execute the plan**:
   - Follow "Step by Step Tasks" in order
   - Mark exactly ONE task as in_progress
   - Complete each task before moving to next

8. **Run validation commands**:
   - Execute ALL validation commands from the plan
   - EVERY command must pass without errors
   - Fix any issues before proceeding

9. **Commit changes** (if applicable):
   ```bash
   /commit <agent-name> <type> <scope>
   ```

10. **Update GitHub issue**:
    ```bash
    gh issue comment <issue-number> \
      --repo MLorneSmith/2025slideheroes \
      --body "Implementation complete. See completion report."

    gh issue edit <issue-number> \
      --repo MLorneSmith/2025slideheroes \
      --add-label "status:review" \
      --remove-label "status:in-progress"

    gh issue close <issue-number> --repo MLorneSmith/2025slideheroes
    ```

## Pre-Execution Checklist

- [ ] Verified on correct git branch
- [ ] Read and understood the entire plan
- [ ] Reviewed all validation commands
- [ ] Development environment is set up
- [ ] Created TodoWrite tasks (if 3+ steps)

## Report

After completion:

1. **Gather git statistics**:
   ```bash
   git diff --stat
   git log --oneline -5
   ```

2. **Summarize work completed**:
   - List key changes made
   - Note any deviations from plan
   - List follow-up items (if any)

3. **Display to user**:
   - Summary of work done
   - GitHub issue # (if applicable)
   - Files changed statistics
```

---

## Customization Points

1. **GitHub Integration**: Adjust for your repository and workflow
2. **Validation Commands**: Add project-specific checks
3. **Commit Format**: Modify for your commit conventions
4. **Status Labels**: Update for your label scheme
