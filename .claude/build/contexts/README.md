# Context Management System

## Overview

The context management system ensures Claude Code has complete context for productive development sessions. This eliminates the stateless session problem and maintains development continuity.

## Directory Structure

- `session-templates/` - Role-specific session start templates
- `stories/` - Context files for individual user stories
- `epics/` - Context files for feature epics
- `sprints/` - Context files for sprint planning and execution

## Context Types

### Session Templates

Standardized context loading procedures for different development roles:

- `ai-engineer.md` - AI integration and prompt engineering work
- `ui-engineer.md` - Frontend component and UI development
- `data-engineer.md` - Backend and database development

### Story Context

Each story gets a dedicated context directory: `stories/story-{id}/`

- `context.md` - Story requirements and acceptance criteria
- `technical-notes.md` - Implementation decisions and patterns
- `progress.md` - Development progress and next steps
- `dependencies.md` - Cross-cutting concerns and relationships

## Context Loading Protocol

1. **Load Primary Role**: Read appropriate role template
2. **Review Project Standards**: Read `CLAUDE.md`
3. **Load Story Context**: Read story-specific context files
4. **Load Implementation Context**: Read relevant codebase files

## Staleness Management

Context becomes stale when:

- Story inactive for > 7 days
- Related files modified by other work
- Dependencies changed or resolved
- Project standards updated

Use the context refresh checklist to update stale context.

## Best Practices

- Update context files after each development session
- Document technical decisions and reasoning
- Keep file lists current and relevant
- Use automated staleness detection
