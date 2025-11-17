# Task: Update existing-commands-inventory.md

## Task Information

- **ID**: TODO-$(date +%Y%m%d)-001
- **Type**: documentation
- **Priority**: medium
- **Created**: $(date +%Y-%m-%d)
- **Status**: Open

## Description

Update the `.claude/docs/existing-commands-inventory.md` file to remove references to deleted commands and add new CCPM-based feature commands.

## Context

The build-feature command system is being removed and replaced with CCPM-based `/feature/*` commands. The commands inventory needs to be updated to reflect the current state.

## Requirements

1. Remove the reference to `/build-feature` command
2. Add entries for the new `/feature/*` commands:
   - `/feature/spec` - Create feature specification
   - `/feature/plan` - Create implementation plan
   - `/feature/decompose` - Break down into tasks
   - `/feature/sync` - Sync to GitHub
   - `/feature/start` - Start parallel execution
   - `/feature/status` - Check status
   - `/feature/update` - Update feature
   - `/feature/discover` - Discovery phase
3. Consider adding automatic generation mechanism

## Implementation Steps

1. [ ] Review current commands in `.claude/commands/`
2. [ ] Update the inventory file with current commands
3. [ ] Remove references to deleted commands
4. [ ] Add new feature commands with descriptions
5. [ ] Consider organizing by category
6. [ ] Add last-updated timestamp

## Files to Update

- `.claude/docs/existing-commands-inventory.md`

## Acceptance Criteria

- [ ] All active commands are listed
- [ ] No references to deleted commands remain
- [ ] Format is consistent with existing entries
- [ ] Commands are properly categorized
- [ ] Last-updated timestamp is added

## Dependencies

- Build-feature cleanup must be completed first

## Notes

Consider creating a script to automatically generate this inventory from the `.claude/commands/` directory to prevent future staleness.
