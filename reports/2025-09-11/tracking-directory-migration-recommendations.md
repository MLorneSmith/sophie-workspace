# Tracking Directory Migration Recommendations

**Date**: 2025-09-11  
**Current State**: 22 directories in `.claude/`

## Directories to Move to `.claude/tracking/`

### ✅ Definitely Move (Project Tracking & State)

1. **`issues/`** → `.claude/tracking/issues/`
   - Contains: Issue tracking files (ISSUE-90.md, ISSUE-154.md)
   - Reason: Core project tracking activity

2. **`sessions/`** → `.claude/tracking/sessions/`
   - Contains: Session tracking files (.review_tracking_*)
   - Reason: Tracks work sessions and progress

3. **`logs/`** → `.claude/tracking/logs/`
   - Contains: Runtime logs, agent logs
   - Reason: Runtime state tracking

4. **`todo/`** → `.claude/tracking/todo/`
   - Contains: Todo lists and task tracking
   - Reason: Project task management

5. **`specs/`** → `.claude/tracking/specs/`
   - Contains: Feature specifications (currently empty)
   - Reason: Feature planning and specs belong with tracking

### ⚠️ Consider Moving (Mixed Purpose)

6. **`data/`** - **Partial Move Recommended**
   - Contains: Mix of inventories and tracking databases
   - Move to tracking:
     - `test-coverage-db.json` → `.claude/tracking/test-data/`
     - `test-dependencies.json` → `.claude/tracking/test-data/`
   - Keep in data:
     - `commands-inventory.json`
     - `context-inventory.json`
     - `docs-inventory.json`
   - Reason: Test tracking separate from system inventories

### ❌ Do NOT Move (Not Tracking)

**Configuration (Claude behavior):**
- `agents/` - AI agent configurations
- `commands/` - Command definitions  
- `context/` - Project knowledge base
- `rules/` - Agent behavior rules
- `hooks/` - Git hooks
- `output-styles/` - Output formatting
- `patterns/` - Code patterns
- `settings/` - Settings
- `statusline/` - Status line config

**Workspace (Temporary):**
- `cache/` - Temporary cache
- `scratch/` - Working files

**Documentation:**
- `docs/` - Project documentation
- `instructions/` - Guides and how-tos (consider moving to docs)

**Tools:**
- `scripts/` - Utility scripts
- `utils/` - Utilities

**Archive:**
- `z.archive/` - Archived files

## Recommended Final Structure

```
.claude/tracking/
├── test-planning/     # ✅ Already moved
├── issues/            # Project issues
├── sessions/          # Work sessions
├── logs/              # Runtime logs
├── todo/              # Todo lists
├── specs/             # Feature specs
└── test-data/         # Test tracking data
    ├── test-coverage-db.json
    └── test-dependencies.json
```

## Migration Commands

```bash
# Move core tracking directories
mv .claude/issues .claude/tracking/
mv .claude/sessions .claude/tracking/
mv .claude/logs .claude/tracking/
mv .claude/todo .claude/tracking/
mv .claude/specs .claude/tracking/

# Move test-related data files
mkdir -p .claude/tracking/test-data
mv .claude/data/test-coverage-db.json .claude/tracking/test-data/
mv .claude/data/test-dependencies.json .claude/tracking/test-data/
```

## Benefits

1. **Consolidated tracking** - All project state in one place
2. **Clear separation** - Tracking vs. configuration vs. workspace
3. **Logical grouping** - Related tracking activities together
4. **Easy backup** - Can backup/sync entire tracking directory
5. **Better discoverability** - Know where to find project state

## Impact Analysis

### Commands/Scripts to Update

1. Any commands referencing:
   - `.claude/issues/`
   - `.claude/sessions/`
   - `.claude/logs/`
   - `.claude/todo/`
   - `.claude/specs/`
   - `.claude/data/test-*.json`

2. Check these files for path references:
   - `.claude/commands/*.md`
   - `.claude/scripts/*.sh`
   - `.claude/hooks/*`

## Additional Recommendation

Consider creating `.claude/instructions/` → `.claude/docs/guides/` migration:
- These are how-to guides and documentation
- Better organized under docs
- Frees up "instructions" name for actual Claude instructions if needed