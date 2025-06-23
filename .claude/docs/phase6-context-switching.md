# Phase 6 Context Switching Guide

## Overview

This guide provides procedures for efficient context switching between stories during Phase 6 (Sprint Execution) of the AAFD methodology.

## Context Switching Procedures

### Before Switching Stories

1. **Save Current State**

   ```bash
   # Create checkpoint commit
   git add . && git commit -m "WIP: checkpoint before context switch"
   ```

2. **Update Session Handoff**

   - Edit `.claude/build/4-output/contexts/stories/story-{current-id}/session-handoff.md`
   - Use template from `.claude/templates/session-handoff.md`
   - Document exact current state and next action

3. **Update Sprint Coordination**

   - Edit `.claude/build/4-output/contexts/dependencies/sprint-{number}-coordination.md`
   - Note any shared component changes or file conflicts

4. **Mental Context Clear**
   - Take a 2-minute break
   - Clear working memory of current implementation details

### Loading New Story Context

1. **Load Story Context Files**

   ```bash
   # Read story context
   /read .claude/build/4-output/contexts/stories/story-{new-id}/context.md
   /read .claude/build/4-output/contexts/stories/story-{new-id}/progress.md
   /read .claude/build/4-output/contexts/stories/story-{new-id}/session-handoff.md
   ```

2. **Check Coordination Status**

   ```bash
   # Check sprint coordination
   /read .claude/build/4-output/contexts/dependencies/sprint-{number}-coordination.md
   ```

3. **Validate Environment**

   ```bash
   # Check git status
   git status

   # Run story-specific tests
   pnpm test {story-specific-tests}

   # Check TypeScript compilation
   pnpm typecheck
   ```

4. **Confirm Readiness**
   - Review acceptance criteria
   - Identify immediate next task
   - Understand technical approach
   - Check for coordination requirements

### Validation Checklist

Before starting work on a new story:

- [ ] Do I understand the current implementation state?
- [ ] Do I know what was completed last session?
- [ ] Can I identify the next immediate task?
- [ ] Are there any coordination requirements with other stories?
- [ ] Are the tests passing in the current state?
- [ ] Do I understand the technical approach?

## File Management

### Session Handoff Files

**Location**: `.claude/build/4-output/contexts/stories/story-{id}/session-handoff.md`

**Purpose**: Document exact current state for resuming work

**Template**: Use `.claude/templates/session-handoff.md`

**Update Frequency**: Before every context switch and at end of each session

### Sprint Coordination Files

**Location**: `.claude/build/4-output/contexts/dependencies/sprint-{number}-coordination.md`

**Purpose**: Track multi-story coordination and file conflicts

**Template**: Use `.claude/templates/sprint-coordination.md`

**Update Frequency**: When story status changes or shared components are modified

### Story Completion Handoff

**Location**: `.claude/build/4-output/contexts/stories/story-{id}/completion-handoff.md`

**Purpose**: Document completed story for future reference and other stories

**Template**: Use `.claude/templates/story-completion-handoff.md`

**When to Create**: After story implementation is complete, before PR creation

## Common Patterns

### High-Risk Context Switches

When switching between stories that:

- Modify the same files
- Share components
- Have database dependencies
- Integrate with each other

**Extra Steps**:

1. Document file-level changes in sprint coordination
2. Check for breaking changes
3. Coordinate interface stability
4. Plan integration testing

### Safe Context Switches

When switching between stories that:

- Work on different parts of the codebase
- Have no shared dependencies
- Use different components/services

**Simplified Process**:

1. Quick handoff documentation
2. Standard context load
3. Normal validation

## Troubleshooting

### Context Load Failures

**Problem**: Cannot understand story state after context switch

**Solutions**:

1. Check if handoff file exists and is current
2. Review git history for recent changes
3. Run tests to validate current state
4. Check for merge conflicts or file changes

### Coordination Conflicts

**Problem**: Multiple stories modifying same files

**Solutions**:

1. Update sprint coordination file with conflict details
2. Establish file ownership temporarily
3. Coordinate changes through shared interfaces
4. Plan merge sequence

### Stale Context

**Problem**: Context files are outdated

**Solutions**:

1. Check last modified dates on context files
2. Review recent git commits for changes
3. Update context files with current state
4. Re-validate environment setup

## Integration with Prompts

The Phase 6 prompts have been updated to include context switching support:

- **execution-tracking-prompt.xml**: Steps 5-6 for context switching and coordination
- **implementation-prompt.xml**: Phase for session handoff preparation
- **master-execution-prompt.xml**: Enhanced story completion with coordination updates

Use these prompts to ensure consistent context switching procedures across all Phase 6 work.
