---
name: slashcommand-writer
description: Create and improve Claude Code slash commands using project best practices. Analyzes patterns, guides structured creation/refactoring, validates output, and produces production-ready commands.
license: MIT
metadata:
  version: 1.2.0
  model: claude-opus-4-5-20251101
  timelessness_score: 8
---

# SlashCommand Writer

Create and improve production-ready Claude Code slash commands optimized for your project.

---

## Quick Start

### Create a New Command

```
/slashcommand-writer create a command to run database migrations safely
```

### Improve an Existing Command

```
/slashcommand-writer improve /commit
```

The skill will analyze existing patterns, guide you through creation or improvement, and validate the result.

---

## Triggers

### Creation Mode
- `/slashcommand-writer {goal}` - Full command creation workflow
- `create slash command` - Natural language activation
- `new command for {purpose}` - Purpose-first creation
- `write a command that...` - Descriptive trigger

### Improvement Mode
- `improve /command-name` - Improve a specific command
- `refactor /command-name` - Refactor command structure
- `optimize /command-name` - Optimize for performance/clarity
- `fix /command-name` - Fix issues in a command

| Mode | Input | Output | Quality Gate |
|------|-------|--------|--------------|
| Create | Command purpose | New `.md` file | Validated structure |
| Improve | Command name | Updated `.md` file | All issues resolved |

---

## Process Overview

### Creation Workflow

```
Your Request
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 1: ANALYSIS                                       │
│ • Analyze existing commands in .claude/commands/        │
│ • Identify command type (planning, execution, utility)  │
│ • Match project conventions and patterns                │
├─────────────────────────────────────────────────────────┤
│ Phase 2: DESIGN                                         │
│ • Interview for requirements if needed                  │
│ • Select appropriate template                           │
│ • Determine frontmatter settings                        │
├─────────────────────────────────────────────────────────┤
│ Phase 3: GENERATION                                     │
│ • Generate command with proper structure                │
│ • Include all required sections                         │
│ • Add $ARGUMENTS handling                               │
├─────────────────────────────────────────────────────────┤
│ Phase 4: VALIDATION                                     │
│ • Validate YAML frontmatter                             │
│ • Check required sections present                       │
│ • Verify integration points                             │
│ • Save to .claude/commands/                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Production-Ready Slash Command
```

### Improvement Workflow

```
Existing Command
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 1: ANALYZE                                        │
│ • Run validation and deep analysis                      │
│ • Check against best practices                          │
│ • Compare to similar high-quality commands              │
│ • Identify command type and expected patterns           │
├─────────────────────────────────────────────────────────┤
│ Phase 2: DIAGNOSE                                       │
│ • List specific issues with severity                    │
│ • Identify missing sections                             │
│ • Check model/tool appropriateness                      │
│ • Evaluate structure and clarity                        │
├─────────────────────────────────────────────────────────┤
│ Phase 3: RECOMMEND                                      │
│ • Prioritize issues by impact                           │
│ • Generate specific fix suggestions                     │
│ • Show before/after examples                            │
│ • Present to user for approval                          │
├─────────────────────────────────────────────────────────┤
│ Phase 4: IMPROVE                                        │
│ • Apply approved changes                                │
│ • Re-validate the command                               │
│ • Confirm all issues resolved                           │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Improved Slash Command
```

---

## Command Types

Select the appropriate type based on your command's purpose:

| Type | Purpose | Model | Complexity | Examples |
|------|---------|-------|------------|----------|
| **Planning** | Create implementation plans | `opus` | High | `/feature`, `/diagnose`, `/bug-plan` |
| **Execution** | Execute plans or actions | `opus` | Medium-High | `/implement`, `/commit` |
| **Utility** | Simple direct actions | `haiku` | Low | `/prime`, `/start`, `/tools` |
| **Routing** | Intelligent context loading | `haiku` | Medium | `/conditional_docs` |
| **Orchestration** | Multi-step coordination | `opus` | Very High | `/initiative`, `/feature-set` |

---

## Frontmatter Reference

Every command requires YAML frontmatter:

```yaml
---
description: Short description for command registry (max 200 chars)
argument-hint: [placeholder-text]  # Shows in autocomplete
model: opus | sonnet | haiku       # Model selection
allowed-tools: [Tool1, Tool2]       # Optional: restrict tools
disable-model-invocation: false     # Optional: prevent SlashCommand tool invocation
---
```

### Available Frontmatter Fields

| Field | Purpose | Required? |
|-------|---------|-----------|
| `description` | Brief description (shown in `/help`, required for SlashCommand tool) | **Yes** |
| `model` | Override model (`haiku`, `sonnet`, `opus`) | Recommended |
| `allowed-tools` | Whitelist tools for this command | Optional |
| `argument-hint` | Autocomplete hint for arguments | Optional |
| `disable-model-invocation` | Prevent programmatic invocation | Optional |

### Model Selection Guide

| Model | Use For | Examples |
|-------|---------|----------|
| `haiku` | Quick tasks, simple edits, speed-critical | `/prime`, `/start`, `/tools` |
| `sonnet` | Daily coding, feature development (balanced) | `/review`, `/test` |
| `opus` | Complex reasoning, architecture, multi-step | `/feature`, `/implement`, `/diagnose` |

**Decision guide:**
- Default to `sonnet` for balance of capability and speed
- Use `haiku` for simple utility commands (< 30 lines)
- Reserve `opus` for complex planning and reasoning

### Common Tool Restrictions

```yaml
# Read-only research
allowed-tools: [Read, Grep, Glob, Bash, Task]

# Full development
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite]

# Git operations only
allowed-tools: [Bash(git add:*), Bash(git commit:*), Bash(git diff:*), Bash(git status:*), Read, Grep]

# Minimal
allowed-tools: [Read, Grep, Glob]
```

### Character Budget Warning

All commands share a **15,000-character budget** for the SlashCommand tool. If exceeded:
- Commands may be truncated
- Warning: "M of N commands loaded"

**Best practices:**
- Keep descriptions concise (< 100 chars ideal)
- Avoid verbose command bodies
- Use `@file` references instead of inline content

---

## Dynamic Content

Commands can embed dynamic content using special syntax:

### File References (`@filepath`)

Embed file contents directly into the command:

```markdown
# Context
Current config: @apps/web/.env.local
Schema: @apps/web/supabase/schemas/*.sql

# Task
Review the configuration above...
```

**Patterns:**
- `@filepath` - Single file
- `@src/*.js` - Glob pattern
- `@package.json` - Relative to project root

### Bash Execution (`!command`)

Execute a command and embed its output:

```markdown
# Current State
- Branch: !`git branch --show-current`
- Status: !`git status --porcelain`
- Recent commits: !`git log --oneline -5`

# Task
Based on the state above...
```

**Note:** Requires `allowed-tools: Bash(command:*)` for the embedded command to work.

---

## Argument Handling

### Argument Placeholders

| Placeholder | Purpose | Use Case |
|-------------|---------|----------|
| `$ARGUMENTS` | Captures ALL text after command | Free-form input |
| `$1` | First positional argument | Structured input |
| `$2` | Second positional argument | Multiple params |
| `$3` | Third positional argument | Complex commands |

### Examples

**Free-form (recommended for most cases):**
```markdown
---
argument-hint: [issue-description]
---
Fix the following issue: $ARGUMENTS
```

**Positional arguments:**
```markdown
---
argument-hint: [pr-number] [priority]
---
Review PR #$1 with priority $2.
```

**Best practices:**
- Use `$ARGUMENTS` for simple, single-input commands
- Use `$1`, `$2` when order matters and inputs are distinct
- Always provide `argument-hint` for discoverability
- Don't mix styles in the same command

---

## Required Sections

### Essential (All Commands)

| Section | Purpose | Required |
|---------|---------|----------|
| `# Title` | Command name | Yes |
| `## Instructions` | Core guidance | Yes |
| `$ARGUMENTS` | Input handling | Yes (if accepting input) |
| `## Report` | Output format | Yes |

### Common (Most Commands)

| Section | Purpose | When to Use |
|---------|---------|-------------|
| `## Variables` | Extract from input | When parsing complex input |
| `## Relevant Files` | Focus areas | When researching codebase |
| `## Format` / `## Template` | Output structure | When generating artifacts |
| `## Pre-X Checklist` | Validation steps | For critical workflows |

### Advanced (Complex Commands)

| Section | Purpose | When to Use |
|---------|---------|-------------|
| `## GitHub Issue Creation` | GH CLI integration | When creating issues |
| Integration with `/conditional_docs` | Context loading | For domain-specific work |
| `## Validation Commands` | Quality gates | For implementation commands |

---

## Instructions

### Phase 1: Analysis

1. **Understand the request**: Parse the user's goal and extract:
   ```typescript
   const commandName = '[kebab-case-name]';     // e.g., "run-tests"
   const commandPurpose = '[description]';       // What it does
   const commandType = '[planning|execution|utility|routing|orchestration]';
   const acceptsInput = boolean;                 // Needs $ARGUMENTS?
   ```

2. **Analyze existing commands**: Scan `.claude/commands/` for patterns:
   ```bash
   ls .claude/commands/*.md
   ```

3. **Check for similar commands**: Avoid duplicating existing functionality:
   ```bash
   grep -l "<keyword>" .claude/commands/*.md
   ```

### Phase 2: Design

4. **Determine command type** using the Command Types table above

5. **Select model**: Use the Model Selection Guide

6. **Interview if needed**: For complex commands, ask:
   - What specific actions should this command perform?
   - What input does it need ($ARGUMENTS)?
   - What output/report should it generate?
   - Should it integrate with GitHub?
   - Should it load conditional documentation?

7. **Plan sections**: Based on command type, determine which sections to include

### Phase 3: Generation

8. **Generate frontmatter**: Create valid YAML:
   ```yaml
   ---
   description: [concise description < 200 chars]
   argument-hint: [placeholder showing expected input]
   model: [haiku|opus based on complexity]
   allowed-tools: [appropriate tool list]
   ---
   ```

9. **Generate command body** following the appropriate template from `assets/templates/`

10. **Add $ARGUMENTS handling** at appropriate location:
    ```markdown
    ## Input
    $ARGUMENTS
    ```

### Phase 4: Validation

11. **Validate structure** using the validation script:
    ```bash
    python3 .claude/skills/slashcommand-writer/scripts/validate_command.py \
      .claude/commands/<command-name>.md
    ```

12. **Save command** to `.claude/commands/<command-name>.md`

13. **For nested commands** (subcommands), save to `.claude/commands/<parent>/<child>.md`

---

## Improvement Instructions

When improving an existing command, follow this workflow:

### Phase 1: Analyze

1. **Locate the command**: Find the command file:
   ```bash
   # For /command-name, look in:
   .claude/commands/command-name.md
   # Or for subcommands:
   .claude/commands/parent/child.md
   ```

2. **Run deep analysis**:
   ```bash
   python3 .claude/skills/slashcommand-writer/scripts/analyze_command.py \
     .claude/commands/<command-name>.md
   ```

3. **Read the command** and understand its purpose, structure, and current issues

4. **Compare to exemplars**: Find similar well-structured commands to use as reference:
   - Planning commands: `/feature`, `/diagnose`
   - Execution commands: `/implement`, `/commit`
   - Utility commands: `/prime`, `/start`

### Phase 2: Diagnose

5. **Categorize issues** by severity:

   | Severity | Description | Examples |
   |----------|-------------|----------|
   | **Critical** | Command won't work | Missing frontmatter, invalid YAML |
   | **High** | Major quality issues | Wrong model, missing Instructions |
   | **Medium** | Best practice violations | No Report section, vague steps |
   | **Low** | Minor improvements | Formatting, clarity enhancements |

6. **Check against best practices** (see `references/best-practices.md`):
   - Frontmatter completeness
   - Model appropriateness
   - Section structure
   - Input handling
   - Integration patterns

7. **Identify missing elements**:
   - Required sections for command type
   - Integration points (GitHub, conditional_docs, etc.)
   - Error handling
   - Report section

### Phase 3: Recommend

8. **Prioritize fixes** by impact:
   - Fix critical issues first
   - Then high-severity issues
   - Medium and low can be batched

9. **Generate specific recommendations**:
   ```markdown
   ## Recommended Changes

   ### Critical
   1. **Add YAML frontmatter** - Command has no frontmatter
      - Add: `description`, `model`, `allowed-tools`

   ### High
   2. **Change model to haiku** - Simple utility using opus
      - Current: `model: opus`
      - Recommended: `model: haiku`

   ### Medium
   3. **Add Report section** - No output guidance
      - Add `## Report` section describing expected output
   ```

10. **Show before/after examples** for significant changes:
    ```markdown
    ### Before
    ```yaml
    model: opus
    ```

    ### After
    ```yaml
    model: haiku  # Utility command, haiku is sufficient
    ```
    ```

11. **Present to user for approval** before making changes

### Phase 4: Improve

12. **Apply approved changes** using the Edit tool

13. **Re-run validation**:
    ```bash
    python3 .claude/skills/slashcommand-writer/scripts/validate_command.py \
      .claude/commands/<command-name>.md
    ```

14. **Confirm all issues resolved**:
    - All critical/high issues fixed
    - Validation passes
    - Command follows best practices

15. **Report improvements made**:
    ```markdown
    ## Improvements Applied

    | Issue | Severity | Status |
    |-------|----------|--------|
    | Missing frontmatter | Critical | Fixed |
    | Wrong model | High | Fixed |
    | No Report section | Medium | Fixed |

    Command now passes validation with no errors.
    ```

---

## Integration Patterns

### Conditional Documentation Loading

For commands that need domain context:

```markdown
## Instructions

3. **Load relevant context documentation**:
   ```bash
   slashCommand /conditional_docs <command-type> "[brief summary of task]"
   ```
   Read each suggested document before proceeding.
```

### GitHub CLI Integration

For commands that create GitHub issues:

```markdown
## GitHub Issue Creation

```bash
gh issue create \
  --repo slideheroes/2025slideheroes \
  --title "<Type>: <title>" \
  --body "<issue-content>" \
  --label "type:<type>" \
  --label "status:<status>" \
  --label "priority:<priority>"
```
```

### Agent Delegation

For commands that spawn sub-agents:

```markdown
## Instructions

Use the Task tool with appropriate subagent_type:
- `subagent_type=Explore` for codebase research
- `subagent_type=context7-expert` for library documentation
- `subagent_type=perplexity-expert` for web research
```

### TodoWrite Integration

For commands with multiple steps:

```markdown
## Instructions

For implementations with 3+ steps, use TodoWrite:
- Create todos at the start
- Mark exactly ONE as in_progress
- Mark completed immediately after finishing
```

---

## When to Use Skills vs Commands

| Criterion | Slash Command | Agent Skill |
|-----------|---------------|-------------|
| **File count** | Single `.md` file | Multi-file with references |
| **Invocation** | Explicit (`/command`) | Auto-discovery by Claude |
| **Complexity** | Simple prompts | Complex workflows |
| **Scripts** | Not supported | Python scripts, validation |
| **Resources** | Inline only | Templates, assets, docs |
| **Use case** | Quick tasks, utilities | Sophisticated automation |

**Decision guide:**
- Start with a slash command
- Upgrade to a skill when you need: scripts, multiple reference files, or complex multi-phase workflows

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Missing `description` | SlashCommand tool can't invoke; poor discoverability | Always include description |
| Exceeding character budget | Commands truncated, warnings shown | Keep descriptions < 100 chars |
| Using `opus` for simple tasks | Wastes tokens/money | Use `haiku` for utilities |
| `!command` without allowed-tools | Bash execution fails | Add `allowed-tools: Bash(cmd:*)` |
| Vague, unstructured prompts | Inconsistent results | Use clear sections and steps |
| No `$ARGUMENTS` when needed | Users must edit prompts manually | Add argument handling |
| Mixing `$ARGUMENTS` and `$1` | Substitution confusion | Use one style consistently |
| Name conflicts with plugins | Requires `/plugin:command` disambiguation | Use subdirectory namespacing |
| Complex multi-file logic | Commands become unmaintainable | Use Agent Skills instead |
| Static prompts without context | Missing relevant state | Use `@file` or `!git status` |
| Overly long descriptions | Hits 15K character budget | Keep descriptions concise |
| Missing tool restrictions | Security risk, silent failures | Use `allowed-tools` for bash |

---

## Validation

Before saving, verify:

- [ ] YAML frontmatter is valid and includes all required fields
- [ ] `description` is < 200 characters
- [ ] `model` is appropriate for complexity
- [ ] `allowed-tools` is specified if restricting tools
- [ ] `## Instructions` section is present and clear
- [ ] `$ARGUMENTS` is handled if command accepts input
- [ ] `## Report` section describes expected output
- [ ] No duplicate of existing command functionality
- [ ] File saved to correct location

---

## Scripts

### validate_command.py

Validates command structure and frontmatter:

```bash
python3 .claude/skills/slashcommand-writer/scripts/validate_command.py \
  .claude/commands/my-command.md
```

**Exit Codes:**
- `0` - Valid command
- `1` - Error (invalid syntax, missing sections)
- `10` - Validation warnings (non-critical issues)

### analyze_command.py

Deep analysis for improvement workflow:

```bash
python3 .claude/skills/slashcommand-writer/scripts/analyze_command.py \
  .claude/commands/my-command.md
```

**Features:**
- Detects command type automatically
- Compares against best practices
- Identifies missing sections for command type
- Checks model appropriateness
- Evaluates structure quality
- Generates prioritized improvement recommendations

**Output Modes:**
- Default: Human-readable analysis report
- `--json`: Machine-readable JSON output
- `--brief`: Summary only (for CI/CD)

---

## Templates

Templates are available in `assets/templates/`:

| Template | Use For |
|----------|---------|
| `planning-command.md` | Feature/bug/chore planning commands |
| `execution-command.md` | Implementation/execution commands |
| `utility-command.md` | Simple utility commands |
| `routing-command.md` | Context/classification routing |
| `orchestration-command.md` | Multi-phase coordination |

---

## Examples

### Simple Utility Command

```markdown
---
description: List all running Docker containers with health status
model: haiku
allowed-tools: [Bash]
---

# Docker Status

Show status of all Docker containers.

## Run

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Report

Display the container status table to the user.
```

### Planning Command

```markdown
---
description: Create a database migration plan for schema changes
argument-hint: [migration-description]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# Migration Planning

Create a plan for database migration: $ARGUMENTS

## Instructions

1. **Analyze current schema** in `apps/web/supabase/schemas/`
2. **Research existing migrations** in `apps/web/supabase/migrations/`
3. **Plan migration steps** following project conventions
4. **Generate migration plan** using the format below

## Plan Format

```md
# Migration: [Name]

## Changes
- [List schema changes]

## Steps
1. [Step 1]
2. [Step 2]

## Rollback Plan
- [Rollback instructions]
```

## Report

- Summarize the migration plan
- List affected tables
- Note any risks or considerations
```

---

## Extension Points

1. **New Templates**: Add templates to `assets/templates/` for new command types
2. **Validation Rules**: Extend `scripts/validate_command.py` with project-specific checks
3. **Pattern Detection**: Add pattern analysis for new command categories
4. **Integration Points**: Add new integration patterns (e.g., Slack, Jira)

---

## Related Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- Existing commands: `.claude/commands/*.md`
- Command profiles: `.claude/config/command-profiles.yaml`
- SkillCreator skill: `.claude/skills/skillcreator/SKILL.md`

---

## Changelog

### v1.2.0 (Current)
- Enhanced analysis with research-based best practices
- Added `!command` without `allowed-tools` check
- Added `$ARGUMENTS`/`$1` mixing detection
- Added character budget warnings (15k budget)
- Added static prompt detection (no dynamic content)
- Added Dynamic Content section (`@file`, `!command`)
- Added Skills vs Commands decision guide
- Expanded Anti-Patterns to 12 items from research
- New score categories: tools, input, size

### v1.1.0
- Added improvement workflow for existing commands
- Added `analyze_command.py` for deep analysis
- Added `refactoring-patterns.md` reference
- New triggers for improve/refactor/optimize/fix modes
- Severity-based issue categorization
- Before/after examples in recommendations

### v1.0.0
- Initial release
- Support for 5 command types
- Validation script
- Templates for all types
- Integration patterns documented
