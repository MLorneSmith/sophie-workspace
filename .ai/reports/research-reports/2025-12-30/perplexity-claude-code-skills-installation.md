# Perplexity Research: Claude Code CLI Custom Skills Installation

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched how to install and configure custom skills in Claude Code CLI, including file locations, file format structure, GitHub repository installation, and configuration requirements.

## Findings

### 1. Skill File Locations

Skills can be stored in four locations, with priority from highest to lowest:

| Location | Path | Applies To |
|----------|------|------------|
| **Enterprise** | Managed settings (admin-provisioned) | All users in organization |
| **Personal** | ~/.claude/skills/ | You, across all projects |
| **Project** | .claude/skills/ | Anyone working in the repository |
| **Plugin** | Bundled with plugins in skills/ directory | Anyone with plugin installed |

**Priority Rule**: If two skills have the same name, higher priority wins (enterprise > personal > project > plugin).

### 2. File Format and Structure

#### Required File: SKILL.md

Every skill requires a SKILL.md file (case-sensitive) with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions

Provide clear, step-by-step guidance for Claude.

## Examples

Show concrete examples of using this Skill.
```

#### YAML Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Lowercase letters, numbers, hyphens only (max 64 chars). Should match directory name. |
| description | Yes | What the skill does and when to use it (max 1024 chars). Claude uses this for auto-discovery. |
| allowed-tools | No | Restrict which tools the skill can use (security feature) |

#### Multi-File Skill Structure

```
my-skill/
├── SKILL.md           (required - overview and navigation)
├── reference.md       (detailed API docs - loaded when needed)
├── examples.md        (usage examples - loaded when needed)
└── scripts/
    └── helper.py      (utility script - executed, not loaded)
```

Claude discovers supporting files through links in your SKILL.md.

### 3. Installing Skills from GitHub Repositories

#### Method 1: Manual Clone and Copy

No built-in git clone command exists. Manual process:

```bash
# Clone the repository
git clone https://github.com/owner/skill-repo.git /tmp/skill-repo

# Copy skill directory to personal skills folder
cp -r /tmp/skill-repo/my-skill ~/.claude/skills/

# Or copy to project skills folder
cp -r /tmp/skill-repo/my-skill .claude/skills/

# Reload skills in Claude Code
/reload-skills
```

#### Method 2: Plugin Marketplace (Recommended for Curated Skills)

```bash
# Add a marketplace
/plugin marketplace add anthropics/claude-code
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# List available plugins
/plugin

# Install a specific plugin (includes skills)
/plugin install plugin-name@marketplace

# Examples:
/plugin install commit-commands@anthropics/claude-code
/plugin install spec-kit@dev-gom

# Update marketplaces
/plugin marketplace update
```

#### Method 3: Pre-Built Skills via /plugins Command

```bash
# Launch Claude Code
claude

# Access plugins menu
/plugins

# Select "Anthropic Agent Skills"
# Choose skill packs (e.g., "document-skills")
# Install and restart
```

### 4. Configuration and Enabling

#### Verifying Skills Are Loaded

```bash
# In Claude Code, ask:
What Skills are available?

# Or run in debug mode to see loading:
claude --debug
```

#### Reloading Skills After Changes

```bash
/reload-skills
```

#### Using Skills with Subagents

Skills are NOT automatically inherited by subagents. To give a custom subagent access to skills, define them in .claude/agents/:

```yaml
# .claude/agents/my-agent.yaml
name: my-agent
skills:
  - skill-name-1
  - skill-name-2
```

Built-in agents (Explore, Plan, Verify) and the Task tool do NOT have access to your skills.

#### Project Settings for Team Setups

Add to .claude/settings.json for auto-configuration across team.

### 5. How Skills Work (Discovery Model)

1. **Discovery**: At startup, Claude loads only name and description of each available skill (keeps startup fast)
2. **Activation**: When request matches a skill description, Claude asks to use it (confirmation prompt before full SKILL.md loads)
3. **Execution**: Claude follows the skill instructions, loading referenced files or running bundled scripts

Skills are **model-invoked**: Claude decides which skills to use based on your request. You do not explicitly call skills.

### 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not loading | Check file path is exactly SKILL.md (case-sensitive) |
| YAML errors | Ensure --- starts on line 1, no blank lines before, use spaces not tabs |
| Skill not triggering | Improve the description field with keywords users would naturally say |
| Scripts not running | Add execute permissions: chmod +x scripts/*.py |
| Plugin skills not appearing | Clear cache then reinstall |
| Multiple skills conflict | Make descriptions more distinct |

Run debug mode for detailed errors:
```bash
claude --debug
```

## Sources and Citations

- https://code.claude.com/docs/en/skills (Official Anthropic Skills Documentation)
- https://support.claude.com/en/articles/12512180-using-skills-in-claude (Claude Support - Using Skills)
- https://skywork.ai/blog/how-to-use-skills-in-claude-code-install-path-project-scoping-testing/ (Skills Tutorial)
- https://dev.to/shahidkhans/from-zero-to-ai-powered-developer-your-complete-claude-code-cli-setup-guide-4l9i (Claude Code Setup Guide)

## Key Takeaways

1. **Personal skills**: Store in ~/.claude/skills/skill-name/SKILL.md
2. **Project skills**: Store in .claude/skills/skill-name/SKILL.md
3. **File format**: YAML frontmatter with name and description, followed by Markdown instructions
4. **GitHub installation**: Clone repo manually, copy skill directory to appropriate location
5. **Plugin marketplace**: Use /plugin marketplace add and /plugin install for curated skills
6. **Reload**: Use /reload-skills after adding or modifying skills
7. **Auto-discovery**: Claude automatically uses skills when requests match descriptions

## Related Searches

- Claude Code plugin development guide
- Creating custom slash commands in Claude Code
- Claude Code subagent configuration
- Skills security best practices (allowed-tools configuration)
