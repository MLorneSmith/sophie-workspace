# Context7 Research: Claude Code Slash Command Frontmatter Fields

**Date**: 2025-12-31
**Agent**: context7-expert
**Libraries Researched**: anthropics/claude-code, websites/code_claude

## Query Summary

Researched valid frontmatter fields for Claude Code custom slash commands (.md files in .claude/commands/). Specifically investigated whether "color" and "DisplayName"/"displayName" are valid fields.

## Findings

### Valid Frontmatter Fields for Slash Commands

Based on the official Claude Code documentation from anthropics/claude-code, the following are the **only documented valid frontmatter fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `description` | String | No | First line of command prompt | Brief description shown in `/help` output (~60 chars recommended) |
| `allowed-tools` | String or Array | No | Inherits from conversation | Restricts which tools the command can use |
| `model` | String | No | Inherits from conversation | Which Claude model to use (`haiku`, `sonnet`, `opus`) |
| `argument-hint` | String | No | None | Documents expected arguments, e.g., `[pr-number] [priority]` |
| `disable-model-invocation` | Boolean | No | false | Prevents the model from programmatically invoking the command |
| `name` | String | No | Derived from filename | Command name (used in plugins/skills) |

### Regarding "color" Field

**NOT a valid field.** There is no mention of a "color" field anywhere in the Claude Code documentation. The field does not appear in:
- The frontmatter reference documentation
- Any code examples
- The validation scripts

### Regarding "DisplayName" or "displayName" Field

**NOT a valid field.** There is no mention of "DisplayName" or "displayName" anywhere in the Claude Code documentation. The documentation only references:
- `description` - for command description text shown in `/help`
- `name` - for command name (primarily in plugin/skill contexts)

The command name displayed to users is derived from the **filename** of the .md file (e.g., `review.md` becomes `/review`).

## Example: Complete Valid Frontmatter

```yaml
---
description: Deploy application to environment
argument-hint: [app-name] [environment] [version]
allowed-tools: Bash(kubectl:*), Bash(helm:*), Read
model: sonnet
disable-model-invocation: false
---
```

## Key Takeaways

1. **Only 5-6 documented frontmatter fields exist** for Claude Code slash commands
2. **"color" is NOT a valid field** - not mentioned anywhere in documentation
3. **"DisplayName"/"displayName" is NOT a valid field** - the display name is derived from the filename
4. **All frontmatter fields are optional** - a command can work with just the prompt content
5. **`name` field** is only documented for plugin/skill commands, not standard slash commands

## Allowed-Tools Patterns

The `allowed-tools` field supports several patterns:

```yaml
# Single tool
allowed-tools: Read

# Multiple tools (comma-separated)
allowed-tools: Read, Write, Edit

# Multiple tools (array)
allowed-tools:
  - Read
  - Write
  - Bash(git:*)

# Bash with command filter
allowed-tools: Bash(git:*)
allowed-tools: Bash(npm:*)
allowed-tools: Bash(docker:*)

# All tools (not recommended)
allowed-tools: "*"
```

## Model Values

Valid model values:
- `haiku` - Fast, efficient for simple tasks
- `sonnet` - Balanced performance (default)
- `opus` - Maximum capability for complex tasks

## Sources

- [anthropics/claude-code](https://github.com/anthropics/claude-code) - Official Claude Code repository
  - `plugins/plugin-dev/skills/command-development/references/frontmatter-reference.md`
  - `plugins/plugin-dev/skills/command-development/README.md`
  - `plugins/plugin-dev/skills/command-development/SKILL.md`
- [code.claude.com](https://code.claude.com) - Official Claude Code documentation website
  - `/docs/en/slash-commands`
  - `/docs/en/common-workflows`
  - `/docs/en/skills`
