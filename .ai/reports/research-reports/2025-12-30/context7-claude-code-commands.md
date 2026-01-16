# Context7 Research: Claude Code Custom Commands

**Date**: 2025-12-30
**Agent**: context7-expert
**Libraries Researched**: anthropics/claude-code, davila7/claude-code-templates, wasabeef/claude-code-cookbook, anthropics/skills, disler/claude-code-hooks-mastery

## Query Summary

Searched for comprehensive documentation about Claude Code custom commands including:
- How to write custom commands
- Command file structure and format
- Best practices for command design
- Available variables and templating
- Command parameters and arguments
- Examples of well-designed commands

## Findings

### Command File Structure

**Location**: Commands are stored in `.claude/commands/` directory

```
.claude/commands/
├── review.md           # /review command
├── test.md             # /test command
├── deploy.md           # /deploy command
└── subdirectory/       # Namespaced commands
    ├── security.md     # /security (subdirectory namespace)
    └── style.md        # /style (subdirectory namespace)
```

**File Format**: Markdown files (`.md`) with YAML frontmatter

### YAML Frontmatter Configuration

The frontmatter must be at the very top of the file, enclosed in `---` delimiters:

```markdown
---
description: Clear description of what the command does
allowed-tools: Read, Grep, Bash(git:*)
argument-hint: [environment] [version]
model: sonnet
---

# Command instructions go here...
```

**Frontmatter Fields**:

| Field | Description | Example |
|-------|-------------|---------|
| `description` | Brief description shown in `/help` | `"Review code for security issues"` |
| `allowed-tools` | Pre-approved tools for the command | `Read, Grep, Bash(git:*)` |
| `argument-hint` | Shows expected arguments in help | `[environment] [version]` |
| `model` | Override model for this command | `sonnet`, `opus` |

### Tool Permission Patterns

```yaml
# Specific command patterns
allowed-tools: Bash(git:*), Bash(npm:*)

# All bash commands
allowed-tools: Bash(*)

# Multiple tools
allowed-tools: Read, Write, Edit, Grep

# Combined
allowed-tools: Read, Bash(kubectl:*), Bash(docker:*)
```

### Variable Substitution

**Argument Variables**:
- `$1`, `$2`, `$3`... - Positional arguments
- `$ARGUMENTS` - All arguments as a string

**Environment Variables**:
- `${CLAUDE_PLUGIN_ROOT}` - Root directory of the plugin
- `${FORMAT:-json}` - Environment variable with default
- `${MY_API_KEY}` - Reference environment variables

**File References**:
- `@$1` - Include file contents from argument path
- `@${CLAUDE_PLUGIN_ROOT}/config/$1.json` - Include config file

### Embedded Bash Execution

Use backticks with `!` prefix to execute commands inline:

```markdown
Current date: !`date`
Git branch: !`git branch --show-current`
Version: !`cat package.json | grep version`
Exit code: !`echo $?`
```

### Input Validation Pattern

```markdown
---
description: Deploy to environment with validation
argument-hint: [environment]
---

Validate environment: !`echo "$1" | grep -E "^(dev|staging|prod)$" || echo "INVALID"`

$IF($1 in [dev, staging, prod],
  Deploy to $1 environment using validated configuration,
  ERROR: Invalid environment '$1'. Must be one of: dev, staging, prod
)
```

### Complete Command Examples

**1. Simple Review Command**:
```markdown
---
description: Review code for security issues
allowed-tools: Read, Grep, Bash(git:*)
model: sonnet
---

Review this code for security vulnerabilities...
```

**2. Deploy Command with Arguments**:
```markdown
---
description: Deploy to specified environment
argument-hint: [environment] [version]
allowed-tools: Bash(kubectl:*), Read
---

Deploy to $1 environment using version $2

**Pre-deployment Checks:**
1. Verify $1 configuration exists
2. Check version $2 is valid
3. Verify cluster accessibility: !`kubectl cluster-info`

**Deployment Steps:**
1. Update deployment manifest with version $2
2. Apply configuration to $1
3. Monitor rollout status
4. Verify pod health
5. Run smoke tests

**Rollback Plan:**
Document current version for rollback if issues occur.

Proceed with deployment? (yes/no)
```

**3. Build Command with Plugin Resources**:
```markdown
---
description: Build and validate output
allowed-tools: Bash(*)
---

Build: !`bash ${CLAUDE_PLUGIN_ROOT}/scripts/build.sh`

Validate output:
- Exit code: !`echo $?`
- Output exists: !`test -d dist && echo "✓" || echo "✗"`
- File count: !`find dist -type f | wc -l`

Report build status and any validation failures.
```

**4. Interactive Setup Command**:
```markdown
---
description: Interactive setup command
allowed-tools: AskUserQuestion, Write
---

# Interactive Plugin Setup

Use the AskUserQuestion tool to ask:

**Question 1 - Deployment target:**
- header: "Deploy to"
- question: "Which deployment platform will you use?"
- options:
  - AWS (Amazon Web Services with ECS/EKS)
  - GCP (Google Cloud with GKE)
  - Azure (Microsoft Azure with AKS)
  - Local (Docker on local machine)

Based on the answers, generate configuration file...
```

### Namespaced Commands

Organize commands into subdirectories for namespacing:

```
.claude/commands/
├── review/
│   ├── security.md    # /security (namespace: review)
│   └── style.md       # /style (namespace: review)
└── deploy/
    ├── staging.md     # /staging (namespace: deploy)
    └── prod.md        # /prod (namespace: deploy)
```

Commands appear in `/help` with their namespace: `(plugin:plugin-name:review)`

### Plugin Manifest Configuration

For plugins with custom command paths:

```json
{
  "commands": "./custom-commands"
}
```

Or multiple paths:

```json
{
  "commands": [
    "./commands",
    "./admin-commands",
    "./experimental-commands"
  ]
}
```

### Testing Commands

**Manual Validation**:
```bash
# Check YAML frontmatter
head -n 20 .claude/commands/my-command.md | grep -A 10 "^---"

# Verify frontmatter markers (should be 2)
head -n 20 .claude/commands/my-command.md | grep -c "^---"

# Check file location
test -f .claude/commands/my-command.md && echo "Found" || echo "Missing"

# Test in debug mode
claude --debug
> /help  # Look for your command
> /my-command arg1 arg2
```

**Debugging Tips**:
```bash
# Check allowed-tools
grep "allowed-tools" .claude/commands/my-command.md

# Verify argument syntax
grep '\$1' .claude/commands/my-command.md

# Check debug logs
tail -f ~/.claude/debug-logs/latest
```

### Best Practices

1. **Clear Descriptions**: Write concise descriptions that explain when to use the command
2. **Minimal Tool Permissions**: Only request tools actually needed
3. **Input Validation**: Validate arguments before executing operations
4. **Error Handling**: Include fallback behavior and clear error messages
5. **Documentation**: Include usage examples in the command body
6. **Namespace Organization**: Group related commands in subdirectories
7. **Smart Defaults**: Use parameter expansion for defaults: `${FORMAT:-json}`

### Command Discovery

Commands are auto-discovered from:
- `.claude/commands/` - Project-level commands
- `~/.claude/commands/` - Personal user commands
- Plugin `commands/` directory - Plugin-provided commands

All `.md` files in these locations become available as slash commands.

## Key Takeaways

- Commands are Markdown files with YAML frontmatter in `.claude/commands/`
- Use `description` for help text, `allowed-tools` for permissions, `argument-hint` for usage
- Arguments accessed via `$1`, `$2`, etc. or `$ARGUMENTS`
- Inline bash execution with `!`backticks`
- File inclusion with `@filepath` syntax
- Environment variables with `${VAR}` or `${VAR:-default}`
- Plugin resources via `${CLAUDE_PLUGIN_ROOT}`
- Validate inputs before executing destructive operations
- Organize related commands in subdirectories for namespacing

## Code Examples

### Minimal Command
```markdown
---
description: Simple greeting
---

Say hello to the user and ask how you can help.
```

### Full-Featured Command
```markdown
---
description: Comprehensive code review with security focus
argument-hint: [file-or-directory]
allowed-tools: Read, Grep, Bash(git:*)
model: opus
---

# Code Review: @$1

## Context
Current branch: !`git branch --show-current`
Recent commits: !`git log --oneline -5`

## Review Checklist
1. Security vulnerabilities (injection, XSS, CSRF)
2. Input validation and sanitization
3. Error handling and logging
4. Performance implications
5. Code style and maintainability

## Analysis
Analyze the code in @$1 for the above concerns.
Provide specific line references and suggested fixes.

## Output Format
- Critical issues: Must fix before merge
- Warnings: Should address but not blocking
- Suggestions: Nice to have improvements
```

## Sources

- anthropics/claude-code via Context7
- davila7/claude-code-templates via Context7
- wasabeef/claude-code-cookbook via Context7
- anthropics/skills via Context7
- disler/claude-code-hooks-mastery via Context7
