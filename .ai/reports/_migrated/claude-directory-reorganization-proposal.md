# Claude Directory Reorganization Proposal

**Date**: 2025-09-11  
**Current State**: 22 subdirectories in `.claude/`

## Current Problems

1. **Flat structure** - 22+ directories at root level is overwhelming
2. **Mixed concerns** - Claude configuration mixed with project tracking
3. **Unclear purpose** - Hard to distinguish what each directory does
4. **Navigation difficulty** - Too many options at each level

## Proposed Reorganization

### New Structure: `.claude/tracking/`

Create a new parent directory for all project tracking, planning, and state management:

```text
.claude/
├── tracking/              # NEW: All project tracking & planning
│   ├── test-planning/     # Test case planning docs (from test-cases)
│   ├── issues/            # Issue tracking
│   ├── sessions/          # Session data
│   ├── logs/              # Log files
│   ├── specs/             # Feature specifications
│   └── todo/              # Todo lists
├── config/                # NEW: All Claude configuration
│   ├── agents/            # AI agent configurations
│   ├── commands/          # Command definitions
│   ├── context/           # Project context/knowledge
│   ├── rules/             # Agent rules
│   ├── hooks/             # Git hooks
│   ├── output-styles/     # Output formatting
│   ├── patterns/          # Code patterns
│   ├── settings/          # Settings
│   └── statusline/        # Status line config
├── workspace/             # NEW: Working files
│   ├── cache/             # Temporary cache
│   ├── scratch/           # Scratch workspace
│   └── data/              # Data files
├── docs/                  # Keep as-is: Documentation
├── scripts/               # Keep as-is: Utility scripts
├── utils/                 # Keep as-is: Utilities
└── z.archive/             # Keep as-is: Archived files
```

## Alternative: Domain-Based Organization

If you prefer organizing by domain rather than purpose:

```text
.claude/
├── project/               # Project-specific tracking
│   ├── planning/          # All planning docs
│   │   ├── test-cases/    # Test planning
│   │   ├── specs/         # Feature specs
│   │   └── todo/          # Todo tracking
│   ├── tracking/          # Runtime tracking
│   │   ├── issues/        # Issues
│   │   ├── sessions/      # Sessions
│   │   └── logs/          # Logs
│   └── docs/              # Project documentation
├── system/                # Claude system config
│   ├── agents/            # Agent configs
│   ├── commands/          # Commands
│   ├── context/           # Context
│   ├── rules/             # Rules
│   └── settings/          # Settings
├── workspace/             # Temporary/working
│   ├── cache/
│   ├── scratch/
│   └── data/
└── tools/                 # Tools & utilities
    ├── scripts/
    ├── utils/
    └── hooks/
```

## Recommendation: Option 1 (tracking/config/workspace)

**Why this structure:**

1. **Clear separation of concerns**:
   - `tracking/` = Project state & planning (what we're building)
   - `config/` = Claude configuration (how Claude works)
   - `workspace/` = Temporary files (working area)

2. **Logical grouping**:
   - Test planning naturally fits with other tracking (issues, specs, todo)
   - All Claude behavior configuration in one place
   - Temporary files isolated from permanent configuration

3. **Scalability**:
   - Easy to add new tracking types
   - Config can grow without cluttering root
   - Clear where new directories should go

4. **Developer intuition**:
   - `tracking/` clearly indicates project management
   - `config/` is standard for configuration
   - `workspace/` suggests temporary/working files

## Migration Benefits

1. **Reduces root directories** from 22 to 7 (68% reduction)
2. **Groups related content** for easier navigation
3. **Clear purpose** for each top-level directory
4. **Future-proof** structure with room to grow
5. **Maintains all functionality** while improving organization

## Test Planning Location

In this structure, test planning files would live at:
`.claude/tracking/test-planning/`

This makes sense because:

- Test planning is project tracking activity
- Grouped with related tracking (issues, specs, todo)
- Clear separation from Claude configuration
- Easy to find when looking for project status

## Implementation Script

```bash
#!/bin/bash
# Reorganize .claude directory structure

# Create new structure
mkdir -p .claude/tracking
mkdir -p .claude/config
mkdir -p .claude/workspace

# Move tracking-related directories
mv .claude/issues .claude/tracking/ 2>/dev/null || true
mv .claude/sessions .claude/tracking/ 2>/dev/null || true
mv .claude/logs .claude/tracking/ 2>/dev/null || true
mv .claude/specs .claude/tracking/ 2>/dev/null || true
mv .claude/todo .claude/tracking/ 2>/dev/null || true

# Move test-cases to test-planning in tracking
mkdir -p .claude/tracking/test-planning
mv .claude/instructions/testing/test-cases/* .claude/tracking/test-planning/ 2>/dev/null || true

# Move config-related directories
mv .claude/agents .claude/config/ 2>/dev/null || true
mv .claude/commands .claude/config/ 2>/dev/null || true
mv .claude/context .claude/config/ 2>/dev/null || true
mv .claude/rules .claude/config/ 2>/dev/null || true
mv .claude/hooks .claude/config/ 2>/dev/null || true
mv .claude/output-styles .claude/config/ 2>/dev/null || true
mv .claude/patterns .claude/config/ 2>/dev/null || true
mv .claude/settings .claude/config/ 2>/dev/null || true
mv .claude/statusline .claude/config/ 2>/dev/null || true

# Move workspace-related directories
mv .claude/cache .claude/workspace/ 2>/dev/null || true
mv .claude/scratch .claude/workspace/ 2>/dev/null || true
mv .claude/data .claude/workspace/ 2>/dev/null || true

# Clean up empty directories
rmdir .claude/instructions/testing 2>/dev/null || true
rmdir .claude/instructions 2>/dev/null || true
```

## Next Steps

1. **Review and approve** the proposed structure
2. **Run migration script** to reorganize
3. **Update command paths** in all `.md` files
4. **Update any scripts** that reference old paths
5. **Document new structure** in `.claude/README.md`
