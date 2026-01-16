# Perplexity Research: Claude Code Slash Commands Best Practices

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API and Search API (combined)

## Query Summary

Researched official best practices for creating Claude Code custom slash commands, including frontmatter fields, argument handling, model selection, tool restrictions, command structure patterns, and anti-patterns to avoid.

---

## 1. Official Documentation Findings

### Primary Source
The official documentation is available at **https://code.claude.com/docs/en/slash-commands** (Claude Code Docs).

### Command Location and Types

| Type | Location | Scope | Shown in /help |
|------|----------|-------|----------------|
| **Project Commands** | `.claude/commands/` | Repository-specific, shared with team | "(project)" |
| **Personal Commands** | `~/.claude/commands/` | User-specific, all projects | "(user)" |
| **Plugin Commands** | Plugin's `commands/` directory | Distributed via plugin marketplaces | Plugin name |
| **MCP Commands** | Dynamic from MCP servers | `/mcp__<server>__<prompt>` format | Server name |

### File Format
- **Extension**: `.md` (Markdown files)
- **Naming**: Filename (without `.md`) becomes command name
- **Structure**: Optional YAML frontmatter + Markdown content

---

## 2. Frontmatter Best Practices

### Available Frontmatter Fields

| Field | Purpose | Default | Required? |
|-------|---------|---------|-----------|
| `description` | Brief command description (shown in `/help` and used by SlashCommand tool) | First line of prompt | **Recommended** (required for SlashCommand tool) |
| `allowed-tools` | List of tools the command can use | Inherited from conversation | Optional |
| `argument-hint` | Autocomplete hint for arguments | None | Optional |
| `model` | Override model for this command | Inherited from conversation | Optional |
| `disable-model-invocation` | Prevent SlashCommand tool from invoking | `false` | Optional |

### Frontmatter Example (Comprehensive)

```yaml
---
description: Create a git commit with conventional commit format
argument-hint: [message]
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
model: claude-3-5-haiku-20241022
disable-model-invocation: false
---
Create a git commit with message: $ARGUMENTS
```

### Frontmatter Best Practices

1. **Always include `description`** - Required for SlashCommand tool programmatic invocation and improves discoverability in `/help`
2. **Keep descriptions concise** - They contribute to a 15,000-character budget across all commands
3. **Use `allowed-tools` for security** - Explicitly whitelist only necessary tools
4. **Set `model` for task-appropriate performance** - Use Haiku for simple tasks, Sonnet for daily work, Opus for complex reasoning
5. **Use `argument-hint` for usability** - Helps users understand expected inputs

---

## 3. Structure Best Practices

### Command Content Organization

```markdown
---
description: Brief description
allowed-tools: Tool1, Tool2
argument-hint: [expected-args]
---
# Context Section (optional)
- Current state: !`git status`
- File contents: @src/file.js

# Task Section
Clear instructions for Claude on what to do.

# Output Requirements (optional)
Specify expected output format.
```

### Key Structural Elements

| Element | Syntax | Purpose |
|---------|--------|---------|
| **File References** | `@filepath` or `@src/*.js` | Embed file contents |
| **Bash Execution** | `!command` | Execute shell command and embed output |
| **Arguments** | `$ARGUMENTS` or `$1`, `$2` | Capture user input |

### Structure Recommendations

1. **Use sections with headers** - Organize prompts into Context, Task, and Output sections
2. **Keep prompts focused** - One command, one purpose
3. **Include dynamic context** - Use `!git status` or `@file` to provide relevant context
4. **Be specific, not vague** - Clear instructions produce better results
5. **Make prompts testable** - Design for iterative refinement

---

## 4. Model Selection Guidelines

### When to Use Each Model

| Model | Use For | Example Commands |
|-------|---------|------------------|
| **Opus (4.5/4.1/4)** | Complex reasoning, architecture design, multi-step debugging | `/design-system`, `/refactor-architecture` |
| **Sonnet (4.5/4)** | Daily coding, feature development, refactoring, tests | `/implement`, `/review`, `/test` |
| **Haiku (4.5/3.5)** | Quick tasks, simple edits, syntax questions, summaries | `/explain`, `/format`, `/quick-fix` |

### Model Selection Strategies

1. **Default to Sonnet** - Best balance of capability, speed, and cost
2. **Use Haiku for speed-critical commands** - Fast feedback loops
3. **Reserve Opus for complex reasoning** - Architecture, multi-file debugging
4. **Consider `opusplan` alias** - Opus for planning, Sonnet for execution

### Setting Model in Frontmatter

```yaml
---
model: claude-3-5-haiku-20241022  # Fast, simple tasks
---
```

```yaml
---
model: claude-sonnet-4-5-20250929  # Default for most tasks
---
```

```yaml
---
model: claude-opus-4-5-20251101  # Complex reasoning
---
```

---

## 5. Tool Restrictions (allowed-tools)

### Syntax for allowed-tools

```yaml
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*)
```

### Pattern Matching

| Pattern | Meaning |
|---------|---------|
| `Bash(git:*)` | Any bash command starting with `git` |
| `Bash(git add:*)` | Only `git add` commands |
| `Bash(npm test:*)` | Only `npm test` commands |
| `Read` | Allow file reading |
| `Write` | Allow file writing |

### Best Practices for Tool Restrictions

1. **Principle of least privilege** - Only allow necessary tools
2. **Use wildcard patterns wisely** - `Bash(git:*)` is broader than `Bash(git status:*)`
3. **Combine with permissions** - Use `/permissions` for global rules
4. **Test tool restrictions** - Verify commands work with restrictions in place

### Permission Rules for SlashCommand Tool

```
SlashCommand:/commit           # Exact match (no arguments)
SlashCommand:/review-pr:*      # Prefix match (with arguments)
```

---

## 6. Argument Handling

### Argument Placeholders

| Placeholder | Purpose | Example |
|-------------|---------|---------|
| `$ARGUMENTS` | Captures all text after command | `/fix $ARGUMENTS` -> all input |
| `$1`, `$2`, `$3` | Positional arguments | `/deploy $1 $2` -> env, version |

### Usage Examples

**Capture-all pattern:**
```markdown
---
argument-hint: [issue-description]
---
Fix the following issue: $ARGUMENTS
```

**Positional arguments:**
```markdown
---
argument-hint: [pr-number] [priority] [assignee]
---
Review PR #$1 with priority $2 and assign to $3.
```

### Best Practices

1. **Use `$ARGUMENTS` for simple cases** - Single input or free-form text
2. **Use positional `$1`, `$2` for structured input** - When order matters
3. **Provide `argument-hint`** - Users see hints during autocomplete
4. **Document expected formats** - In the command's description or body

---

## 7. Anti-Patterns to Avoid

### Common Mistakes

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **Exceeding character budget** | Commands truncated, "M of N commands" warning | Keep descriptions concise; adjust `SLASH_COMMAND_TOOL_CHAR_BUDGET` |
| **Missing `description`** | SlashCommand tool cannot invoke; poor discoverability | Always include description |
| **No `allowed-tools` for bash** | `!command` syntax fails | Add `allowed-tools: Bash(command:*)` |
| **Vague prompts** | Inconsistent results | Be specific and structured |
| **Complex multi-file logic** | Commands become unmaintainable | Use Agent Skills instead |
| **Mixing placeholder styles** | Substitution fails | Stick to `$ARGUMENTS` or `$1/$2` consistently |
| **No arguments when needed** | Users must edit prompts manually | Use `$ARGUMENTS` for dynamic input |
| **Name conflicts** | Requires disambiguation `/plugin:command` | Use subdirectories for namespacing |
| **Tool misuse without frontmatter** | Bash/file operations fail silently | Always define `allowed-tools` |
| **Defaulting to Opus** | Expensive, overkill for simple tasks | Match model to task complexity |

### What Makes Commands Ineffective

1. **Static prompts without context** - Missing `@file` or `!git status`
2. **Overly long descriptions** - Hits character budget
3. **No error handling guidance** - Claude doesn't know what to do on failure
4. **Missing test instructions** - Commands can't be verified
5. **Over-reliance on LLM creativity** - Too little structure

---

## 8. Advanced Patterns

### Subdirectory Organization (Namespacing)

```
.claude/commands/
├── frontend/
│   ├── component.md     # /component (project:frontend)
│   └── test.md          # /test (project:frontend)
├── backend/
│   ├── api.md           # /api (project:backend)
│   └── migration.md     # /migration (project:backend)
└── git/
    ├── commit.md        # /commit (project:git)
    └── pr.md            # /pr (project:git)
```

### Multi-Step Workflow Pattern

```markdown
---
description: Complete PR workflow from branch to merge
allowed-tools: Bash(git:*), Bash(gh:*)
argument-hint: [feature-name]
---
# Context
- Current branch: !`git branch --show-current`
- Status: !`git status --porcelain`

# Workflow
1. Create feature branch: git checkout -b feature/$ARGUMENTS
2. Stage all changes: git add -A
3. Create commit with conventional format
4. Push to remote: git push -u origin HEAD
5. Create PR using gh cli
```

### SlashCommand Tool Integration

To enable programmatic invocation by Claude:

1. **Include `description` in frontmatter** (required)
2. **Reference commands by name in CLAUDE.md**:
   ```
   > Run /write-unit-test when you are about to start writing tests.
   ```
3. **Control with permissions**:
   ```
   /permissions
   # Allow: SlashCommand:/commit:*
   # Deny: SlashCommand:/deploy
   ```

### Combining with Hooks

```bash
# PostToolUse hook to run linter after file edits
# .claude/hooks/post-tool-use.sh
if [[ "$TOOL_NAME" == "Write" ]]; then
  pnpm lint:fix
fi
```

### Skills vs Slash Commands Decision Tree

| Criterion | Slash Command | Agent Skill |
|-----------|---------------|-------------|
| Single file | Yes | No |
| Explicit invocation | Yes | No (auto-discovery) |
| Simple prompt | Yes | No |
| Multi-file resources | No | Yes |
| Scripts/validation | No | Yes |
| Complex workflows | No | Yes |

---

## Sources & Citations

1. **Official Claude Code Documentation**: https://code.claude.com/docs/en/slash-commands
2. **Claude Code Model Configuration**: https://support.claude.com/en/articles/11940350-claude-code-model-configuration
3. **Choosing the Right Model**: https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
4. **Steve Kinney's Claude Code Commands Guide**: https://stevekinney.com/courses/ai-development/claude-code-commands
5. **Custom Slash Commands Tutorial**: https://en.bioerrorlog.work/entry/claude-code-custom-slash-command
6. **eesel AI Complete Guide**: https://www.eesel.ai/blog/slash-commands-claude-code
7. **eesel AI Model Selection Guide**: https://www.eesel.ai/blog/claude-code-model-selection
8. **GitHub Issue on Frontmatter**: https://github.com/davila7/claude-code-templates/issues/65

---

## Key Takeaways

1. **Location matters**: Project commands in `.claude/commands/`, personal in `~/.claude/commands/`
2. **Frontmatter is essential**: Always include `description`; use `allowed-tools` for bash commands
3. **Match model to task**: Haiku for speed, Sonnet for balance, Opus for complexity
4. **Use arguments dynamically**: `$ARGUMENTS` for simple, `$1/$2` for structured input
5. **Avoid anti-patterns**: Keep descriptions concise, don't exceed character budgets, structure prompts clearly
6. **Know when to upgrade**: Complex multi-file workflows belong in Agent Skills, not slash commands
7. **Test and iterate**: Commands should be testable and refined based on outputs
8. **Enable SlashCommand tool**: Add `description` and reference commands in CLAUDE.md for programmatic use

---

## Related Searches

- Claude Code Agent Skills best practices
- Claude Code hooks integration patterns
- Claude Code MCP server command patterns
- Claude Code plugin development guide
