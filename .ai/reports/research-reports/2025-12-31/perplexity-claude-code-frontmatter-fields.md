# Perplexity Research: Claude Code Slash Command Frontmatter Fields

**Date**: 2025-12-31
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched whether `color` and `DisplayName` are valid YAML frontmatter fields for Claude Code slash commands in the `.claude/commands/` directory.

## Key Findings

### Answer: NO - These fields are NOT valid for slash commands

**`color` and `DisplayName` are NOT valid frontmatter fields for Claude Code slash commands.** These fields only apply to **agents (subagents)**, not commands.

### Valid Frontmatter Fields for Slash Commands

| Field | Required | Description |
|-------|----------|-------------|
| `description` | Recommended | Brief description shown in `/help` or used in context |
| `allowed-tools` | No | Tools the command can use (inherits from conversation) |
| `argument-hint` | No | Autocomplete hints for arguments (e.g., `[pr-number] [priority]`) |
| `model` | No | Model to use (`sonnet`, `haiku`, `opus`; inherits from conversation) |
| `disable-model-invocation` | No | Set to `true` to hide from SlashCommand tool |

### Where `color` IS Valid: Agent/Subagent Files

The `color` field is specifically for **agents** stored in `.claude/agents/` (not commands). Available colors:
- `blue`, `cyan`, `green`, `yellow`, `magenta`, `red`, `purple`, `orange`, `pink`

Agent frontmatter includes:
- `name` (required)
- `description` (required) 
- `model` (required for agents)
- `color` (optional - visual identifier in terminal)
- `tools` (optional)
- `skills` (optional)
- `permissionMode` (optional)

### `DisplayName` Status

**`DisplayName` is not a valid field for either commands or agents.** The command/agent name is derived from the filename:
- `optimize.md` becomes `/optimize` command
- `code-reviewer.md` becomes `code-reviewer` agent

There is an open feature request (GitHub issue #1370) asking for description metadata to distinguish custom commands in the dropdown menu, but this has not been implemented yet.

## File Type Summary

| File Type | Location | `color` Valid | `DisplayName` Valid |
|-----------|----------|---------------|---------------------|
| Commands | `.claude/commands/` | NO | NO |
| Agents | `.claude/agents/` | YES | NO |
| Skills | `.claude/skills/` | NO | NO |

## Sources & Citations

1. [Claude Code Commands Guide - Steve Kinney](https://stevekinney.com/courses/ai-development/claude-code-commands)
2. [GitHub Issue #1370 - Feature Request: Add description metadata](https://github.com/anthropics/claude-code/issues/1370)
3. [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
4. [Claude Code Frontmatter Reference - Claude Skills](https://claude-plugins.dev/skills/@ryugen04/dotfiles/claude-code-frontmatter)
5. [Agent Development - Claude Skills](https://claude-plugins.dev/skills/@anthropics/claude-code/agent-development)
6. [Command Development - Claude Skills](https://claude-plugins.dev/skills/@Microck/ordinary-claude-skills/command-development)

## Key Takeaways

- **Slash commands** (`.claude/commands/`) only support: `description`, `allowed-tools`, `argument-hint`, `model`, `disable-model-invocation`
- **Agents/subagents** (`.claude/agents/`) support: `name`, `description`, `model`, `color`, `tools`, `skills`, `permissionMode`
- The `color` field is agent-specific for terminal visual identification
- `DisplayName` is not a valid field for any Claude Code file type
- Command names are derived from filenames, not frontmatter

## Related Searches

If needed for follow-up:
- Claude Code plugins frontmatter
- Claude Code skills YAML fields
- MCP server prompt configuration
