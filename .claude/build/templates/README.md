# Template Collection

## Overview

This directory contains reusable templates for GitHub issues, context files, and workflow documentation.

## Available Templates

### GitHub Templates (`github/`)

- `feature-epic.yml` - GitHub issue template for feature epics
- `user-story.yml` - GitHub issue template for user stories
- `task.yml` - GitHub issue template for technical tasks
- `bug.yml` - GitHub issue template for bug reports

### Context Templates (`contexts/`)

- `story-context-template.md` - Template for story context files
- `epic-context-template.md` - Template for epic context files
- `progress-template.md` - Template for progress tracking
- `technical-notes-template.md` - Template for technical decisions

## Template Usage

### GitHub Issue Templates

1. Copy templates to `.github/ISSUE_TEMPLATE/`
2. Customize with project-specific fields
3. Test template creation process
4. Configure issue template chooser

### Context Templates

1. Copy template for new story/epic
2. Replace template variables with actual values
3. Save in appropriate context directory
4. Update as development progresses

## Template Variables

Common variables used across templates:

- `{{STORY_ID}}` - Unique story identifier
- `{{STORY_TITLE}}` - Descriptive story title
- `{{USER_TYPE}}` - Type of user (e.g., SlideHeroes user)
- `{{FUNCTIONALITY}}` - Desired functionality
- `{{BENEFIT}}` - User benefit or value
- `{{CONTEXT_FILES}}` - Relevant file paths
- `{{PRIMARY_ROLE}}` - Claude Code role to load

## Best Practices

- Keep templates up-to-date with methodology changes
- Test templates with real use cases
- Document template customization decisions
- Version control template changes
