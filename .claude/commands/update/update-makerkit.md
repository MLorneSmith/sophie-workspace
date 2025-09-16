---
description: Execute semi-automated Makerkit upstream synchronization with intelligent conflict handling
allowed-tools: [Bash, Read, Write, Edit]
argument-hint: [--force, --no-backup, --dry-run]
---

# Update Makerkit

You will execute the Makerkit upstream synchronization workflow. This command performs automated updates with intelligent conflict resolution.

## Execution Workflow

You must perform these steps in order:

### Step 1: Initialize Update Process

Execute the following checks and setup:

1. **Verify git status** - Check working directory is clean
2. **Create backup branch** - Unless `--no-backup` flag is provided
3. **Fetch upstream** - Get latest Makerkit changes
4. **Analyze changes** - Identify potential conflicts

### Step 2: Perform Selective Merge

You will execute selective file updates based on these rules:

**Always Update (Auto-merge):**
- Package.json dependencies (merge intelligently)
- Documentation files in `/docs/`
- Configuration files (`.eslintrc`, `tsconfig.json`, etc.)
- Build scripts and tooling

**Require Review (Manual merge):**
- Core authentication logic
- Database schemas and migrations
- Custom business logic
- Modified Makerkit components

**Never Update (Skip):**
- Environment files (`.env*`)
- Custom routes and pages
- Project-specific configurations
- User data and uploads

### Step 3: Handle Conflicts

When conflicts occur, you will:

1. **Analyze conflict** - Determine if it's resolvable
2. **Apply resolution strategy**:
   - Auto-resolve configuration conflicts
   - Preserve custom modifications
   - Flag complex conflicts for manual review
3. **Document decisions** - Log all conflict resolutions

### Step 4: Validation and Cleanup

Execute post-update validation:

1. **Run type checking** - `pnpm typecheck`
2. **Run linting** - `pnpm lint`
3. **Test build** - `pnpm build` (if not `--dry-run`)
4. **Generate update report** - Document all changes made

## Argument Handling

Process these flags if provided:

- `--force`: Override safety checks and apply all updates
- `--no-backup`: Skip backup branch creation
- `--dry-run`: Show what would be updated without making changes

## Safety Protocols

You must implement these safety measures:

1. **Pre-flight checks**: Verify clean working directory
2. **Backup creation**: Create `backup/makerkit-update-YYYY-MM-DD` branch
3. **Incremental commits**: Commit changes in logical groups
4. **Rollback capability**: Ensure all changes can be reverted

## Conflict Resolution Logic

Execute this decision tree for conflicts:

```
Conflict Detected
├── Configuration file?
│   ├── Yes → Auto-merge with preference for upstream
│   └── No → Continue to next check
├── Custom business logic?
│   ├── Yes → Preserve local, flag for review
│   └── No → Continue to next check
├── Makerkit core component?
│   ├── Modified locally? → Manual review required
│   └── Unmodified → Auto-update
└── Documentation/tooling → Auto-update
```

## Error Handling

If errors occur during execution:

1. **Log error details** with full context
2. **Attempt automatic recovery** where possible
3. **Provide rollback instructions** if recovery fails
4. **Generate diagnostic report** for manual troubleshooting

## Success Criteria

The update is complete when:

1. All safe updates have been applied
2. No unresolved merge conflicts remain
3. Type checking and linting pass
4. Update report is generated
5. Next steps are documented

## Execution Commands

You will run these specific commands during the workflow:

```bash
# Initial setup
git status --porcelain
git checkout -b backup/makerkit-update-$(date +%Y-%m-%d) 2>/dev/null || true
git remote add makerkit https://github.com/makerkit/next-supabase-saas-kit-turbo.git 2>/dev/null || true
git fetch makerkit

# Analysis phase
git log --oneline HEAD..makerkit/main --max-count=20
git diff --name-only HEAD..makerkit/main

# Selective merge execution
# (Specific merge commands based on analysis results)

# Validation
pnpm typecheck
pnpm lint
```

Start execution immediately when this command is invoked. Do not display this documentation - execute the workflow.