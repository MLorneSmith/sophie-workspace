# Perplexity Research: Claude Code CLI Plugin Installation Scopes

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched whether Claude Code CLI plugins can be installed at the project level (in the project's `.claude` folder) rather than at the user level (`~/.claude/plugins`), including configuration syntax, directory structure, and differences between scopes.

## Findings

### 1. Project-Level Plugin Installation: YES, Supported

Claude Code officially supports project-level plugin installation through scopes. Plugins can be installed with different scopes that control their visibility and sharing:

| Scope | Purpose | Storage Location | Sharing |
|-------|---------|------------------|---------|
| **user** | Personal plugins across all projects | `~/.claude/settings.json`, `~/.claude/plugins/` | Private to user |
| **project** | Team-shared plugins for repository | `.claude/settings.json` (project root) | Committed to repo, shared with collaborators |
| **local** | Personal overrides for specific repo | `.claude/settings.local.json` | Git-ignored, private to local machine |
| **managed** | Enterprise admin-controlled | System directories | Read-only, cannot be overridden |

### 2. Configuration Syntax

#### CLI Installation with Scope
```bash
# Install plugin at project level (shared with team)
claude plugin install formatter@your-org --scope project

# Install plugin at local level (personal, repo-specific)
claude plugin install debug-tools@marketplace --scope local

# Install plugin at user level (default, all projects)
claude plugin install my-plugin@marketplace --scope user
```

#### Interactive UI
Use `/plugin` command in Claude Code TUI to interactively select scope during installation.

### 3. Directory Structure

```
Project Root/
├── .claude/
│   ├── settings.json          # Project-scoped settings (committed)
│   ├── settings.local.json    # Local-scoped settings (git-ignored)
│   ├── agents/                # Project-scoped subagents
│   └── commands/              # Project-scoped slash commands

User Home/
├── ~/.claude/
│   ├── settings.json          # User-scoped settings
│   ├── plugins/               # User-scoped plugin cache
│   │   └── cache/             # Plugin installation cache
│   └── agents/                # User-scoped subagents
```

### 4. Settings File Format

The `enabledPlugins` property in `settings.json` controls which plugins are enabled:

```json
{
  "enabledPlugins": {
    "plugin-name@marketplace-name": true,
    "another-plugin@org": false
  }
}
```

**Precedence**: Local scope overrides Project scope overrides User scope (command-line args override all).

### 5. Plugins vs Standalone Configuration

| Approach | Slash Command Names | Best For |
|----------|---------------------|----------|
| **Standalone** (`.claude/` directory) | `/hello` | Personal workflows, project-specific customizations, quick experiments |
| **Plugins** (`.claude-plugin/plugin.json`) | `/plugin-name:hello` | Sharing with teammates, distributing to community, versioned releases |

### 6. Known Issues and Workarounds

#### Bug: `/plugin` Command Scope Not Working (as of v2.0.14)
There is a reported bug where the `/plugin` command does not properly respect scoping options. Changes always apply to `~/.claude/settings.json` (user level) instead of the specified scope.

**Workaround**: Manually edit the `enabledPlugins` property in your project-level settings files:
- Edit `.claude/settings.json` for project scope
- Edit `.claude/settings.local.json` for local scope

#### Feature Request Status
The project-level plugin scoping feature exists in documentation but may not be fully implemented in the CLI. This is not a regression - it appears the feature was designed but not correctly implemented.

### 7. Plugin Development for Project-Level Distribution

To create a plugin that can be shared at project level:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest (required)
├── commands/            # Slash commands as Markdown files
├── agents/              # Custom agent definitions
├── skills/              # Agent Skills with SKILL.md files
├── hooks/               # Event handlers in hooks.json
└── .mcp.json            # MCP server configurations
```

**plugin.json manifest**:
```json
{
  "name": "my-plugin",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  }
}
```

### 8. Testing Plugins Locally

```bash
# Load plugin from local directory during development
claude --plugin-dir ./my-plugin
```

## Sources & Citations

1. **Claude Code Settings Documentation**: https://code.claude.com/docs/en/settings
   - Comprehensive scope documentation
   - Settings file format and hierarchy
   
2. **Claude Code Plugins Documentation**: https://code.claude.com/docs/en/plugins
   - Plugin development guide
   - Migration from standalone to plugins
   - Directory structure specifications

3. **GitHub Issue #9426**: Plugin Management Issues in Claude Code Marketplace
   - Documents Windows-specific plugin management bugs
   - Inconsistent plugin state issues
   
4. **Blog Post**: Claude Code Plugin Scoping Bug (malidrive.com.tr)
   - Documents the `/plugin` command scope bug
   - Provides workaround via manual settings editing
   - Version: Claude Code 2.0.14

5. **Third-Party Tool (bwc-cli)**: buildwithclaude.com/docs/cli
   - Alternative CLI for managing Claude Code configuration
   - Supports `--scope project`, `--scope user`, `--scope local` flags

## Key Takeaways

1. **YES**, project-level plugin installation is officially supported in Claude Code documentation through the `--scope project` flag and `.claude/settings.json` configuration.

2. **Configuration locations**:
   - Project: `.claude/settings.json` (committed, shared with team)
   - Local: `.claude/settings.local.json` (git-ignored, personal)
   - User: `~/.claude/settings.json` (global, all projects)

3. **Known bug**: The `/plugin` command may not properly respect scope flags (as of v2.0.14). Workaround is to manually edit settings files.

4. **Alternative approach**: Use standalone configuration in `.claude/` directory (commands, agents, skills) for project-specific customizations without needing the plugin system.

5. **Third-party tools** like `bwc-cli` provide additional scope management capabilities that may work around the official CLI limitations.

## Related Searches

- Claude Code plugin marketplace setup
- Claude Code enterprise managed settings
- Claude Code MCP server project-level configuration
- Converting standalone .claude/ configs to plugins

