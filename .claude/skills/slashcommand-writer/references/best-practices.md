# Slash Command Best Practices

Comprehensive guide to writing effective Claude Code slash commands.

---

## Command Naming

### Conventions

| Pattern | Use For | Examples |
|---------|---------|----------|
| `verb` | Actions | `commit`, `start`, `build` |
| `verb-noun` | Specific actions | `run-tests`, `fix-docker` |
| `noun` | Resources | `tools`, `config` |
| `noun-verb` | Resource actions | `database-reset`, `supabase-seed` |

### Guidelines

- Use kebab-case: `my-command` not `myCommand` or `my_command`
- Keep names short: 1-3 words maximum
- Make names descriptive but concise
- Avoid abbreviations unless universally understood

### Bad Names

| Bad | Why | Better |
|-----|-----|--------|
| `do-thing` | Too vague | `create-migration` |
| `cmd` | Abbreviation | `command` or specific name |
| `test-all-the-things` | Too long | `test` or `run-tests` |
| `myNewCommand` | Wrong case | `my-new-command` |

---

## Frontmatter Best Practices

### Description

```yaml
# Good - specific and actionable
description: Create database migration from schema changes

# Bad - vague
description: Does database stuff
```

- Keep under 200 characters
- Start with action verb
- Be specific about what it does
- Don't include "slash command" or "command"

### Model Selection

| Complexity | Model | Reasoning |
|------------|-------|-----------|
| Simple script execution | `haiku` | Fast, cheap, sufficient |
| Status/info queries | `haiku` | No complex reasoning needed |
| Code generation | `opus` | Quality matters |
| Multi-step planning | `opus` | Complex reasoning required |
| Interview workflows | `opus` | Needs nuanced understanding |
| Routing/classification | `haiku` | Pattern matching, fast |

### Argument Hints

```yaml
# Good - shows expected format
argument-hint: [issue-number]
argument-hint: [feature-description]
argument-hint: [command] [task-description]

# Bad - not helpful
argument-hint: [input]
argument-hint: [args]
```

### Tool Restrictions

```yaml
# Principle of least privilege - only what's needed
allowed-tools: [Read, Grep, Glob]  # Read-only research

# Full access when needed
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite]

# Specific bash commands
allowed-tools: [Bash(git add:*), Bash(git commit:*)]
```

---

## Structure Best Practices

### Section Order

Recommended order for maximum clarity:

1. **Title** - What this command is
2. **Brief description** - One-liner (optional)
3. **Usage** - How to invoke (for complex commands)
4. **Instructions** - Step-by-step process
5. **Variables** - Extracted from input (if applicable)
6. **Relevant Files** - Focus areas (if applicable)
7. **Format/Template** - Output structure (if applicable)
8. **Integration** - GitHub, other commands (if applicable)
9. **Report** - What to show user

### Instructions Section

```markdown
## Instructions

IMPORTANT: Key constraints or context (use sparingly)

1. **First step**: Clear description
   - Sub-detail if needed
   - Code example if helpful

2. **Second step**: Clear description
   ```bash
   # Include examples
   example command
   ```

3. **Third step**: Clear description
```

Guidelines:
- Use numbered steps for sequential actions
- Bold step titles for scanability
- Include code examples where helpful
- Add `IMPORTANT:` for critical constraints
- Keep steps atomic and actionable

### Report Section

```markdown
## Report

After completion:

1. **Summarize** the work in bullet points
2. **Include** relevant paths or links
3. **Report** any issues or follow-ups
```

---

## Input Handling

### $ARGUMENTS

Place `$ARGUMENTS` where the input should be processed:

```markdown
## Input
$ARGUMENTS

## Instructions
1. Parse the input from the Input section above...
```

Or inline:

```markdown
# Command Title

Execute the following: $ARGUMENTS

## Instructions
...
```

### Variable Extraction

For complex inputs, extract variables:

```markdown
## Instructions

1. **Parse input**. Extract from $ARGUMENTS:
   ```typescript
   const title = '[extracted title]';
   const type = '[feature|bug|chore]';
   const priority = '[high|medium|low]';
   ```
```

### Optional Arguments

Handle optional arguments gracefully:

```markdown
## Instructions

1. **Parse arguments**:
   - If no arguments provided, prompt user for input
   - If issue number provided, fetch from GitHub
   - If description provided, use directly
```

---

## Integration Patterns

### Conditional Documentation

Always load relevant context for domain-specific work:

```markdown
## Instructions

3. **Load relevant context**:
   ```bash
   slashCommand /conditional_docs <type> "[summary]"
   ```

4. **Read each suggested document** before proceeding
```

### GitHub CLI

Standard patterns for GitHub integration:

```markdown
## GitHub Integration

### Create Issue
```bash
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "<Type>: <title>" \
  --body "<content>" \
  --label "type:<type>,status:ready"
```

### Update Issue
```bash
gh issue edit <number> \
  --add-label "status:in-progress" \
  --remove-label "status:ready"
```

### Close Issue
```bash
gh issue close <number> --comment "Completed."
```
```

### Agent Delegation

Use Task tool for complex sub-tasks:

```markdown
## Instructions

5. **Research codebase**:
   Use Task with `subagent_type=Explore` for open-ended exploration

6. **Get library documentation**:
   Use Task with `subagent_type=context7-expert` for official docs

7. **Search for solutions**:
   Use Task with `subagent_type=perplexity-expert` for web research
```

### TodoWrite

For multi-step implementations:

```markdown
## Instructions

7. **Track progress** (for 3+ step implementations):
   - Create todos at the start
   - Mark exactly ONE as in_progress
   - Mark completed immediately after finishing
   - Never batch complete multiple tasks
```

---

## Error Handling

### Graceful Degradation

```markdown
## Instructions

3. **Load configuration** (with fallback):
   ```bash
   # Try to load config, use defaults if not found
   cat .claude/config/settings.yaml 2>/dev/null || echo "Using defaults"
   ```
```

### User Guidance

```markdown
## Error Handling

### If X fails:
1. Check Y
2. Try Z
3. If still failing, ask user for guidance

### If no input provided:
Prompt user: "Please provide [required input]"
```

### Validation Gates

```markdown
## Validation

Before proceeding, ensure:
- [ ] All required inputs are present
- [ ] Dependencies are available
- [ ] Environment is correctly configured

If validation fails, stop and report the issue.
```

---

## Common Anti-Patterns

### Vague Instructions

```markdown
# Bad
## Instructions
Do the thing and make it work.

# Good
## Instructions
1. **Read the configuration** from `.claude/config/settings.yaml`
2. **Extract the database URL** from the `database` section
3. **Run the migration** using `pnpm migrate`
```

### Missing Context

```markdown
# Bad
## Instructions
1. Update the file

# Good
## Instructions
1. **Update the configuration file** at `apps/web/.env.local`:
   - Add the new API key
   - Update the base URL
```

### Over-Engineering

```markdown
# Bad - too complex for simple task
---
description: List files
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, MCPTool]
---

# Good - minimal for simple task
---
description: List files
model: haiku
allowed-tools: [Bash]
---
```

### No Report

```markdown
# Bad - no feedback
## Instructions
1. Do thing
2. Done

# Good - clear feedback
## Report
- Summarize what was done
- Show relevant output
- Note any issues or follow-ups
```

---

## Testing Your Command

### Manual Testing

1. Invoke the command with typical input
2. Invoke with edge case input (empty, very long, special chars)
3. Verify output matches expectations
4. Check that all sections are executed

### Validation Script

```bash
python3 .claude/skills/slashcommand-writer/scripts/validate_command.py \
  .claude/commands/my-command.md
```

### Review Checklist

- [ ] Frontmatter is valid YAML
- [ ] Description is clear and < 200 chars
- [ ] Model is appropriate for complexity
- [ ] Instructions are numbered and clear
- [ ] $ARGUMENTS is handled if command accepts input
- [ ] Report section describes expected output
- [ ] No duplicate of existing functionality
- [ ] Integration points work correctly
