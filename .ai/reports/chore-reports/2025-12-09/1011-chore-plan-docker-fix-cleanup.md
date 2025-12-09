# Chore: Add temporary backup container cleanup to docker-fix command

## Chore Description

Update the `/docker-fix` slash command to automatically detect and clean up temporary database backup containers created by the `supabase db dump` command (used by `/supabase-seed-remote`). These backup containers:

1. Use the Supabase postgres image (e.g., `public.ecr.aws/supabase/postgres:17.6.1.037`)
2. Are in `exited` status with exit code 0 (successful completion)
3. Have random Docker-generated names (e.g., `peaceful_ptolemy`) instead of the standard `supabase_db_*` pattern
4. Cause the container health report to show inflated counts (e.g., "17/18 healthy" instead of "17/17 healthy")

The command should:
- Identify these orphaned backup containers during the discovery phase
- Report them separately from unhealthy containers
- Automatically remove them (they have already completed their backup task)
- Update the container count expectations to reflect the actual infrastructure (17 containers, not 16 as currently documented)

## Relevant Files

Use these files to resolve the chore:

- `.claude/commands/docker-fix.md` - The main docker-fix slash command that needs to be updated. This file contains the PRIME framework workflow for container health validation and fix strategies.

- `.claude/commands/supabase-seed-remote.md` - Reference file showing how backup containers are created via `npx supabase db dump --linked -f "$BACKUP_FILE"`. Helps understand the backup container origin.

- `.ai/ai_docs/context-docs/infrastructure/docker-setup.md` - Contains the expected container inventory (currently shows 16 containers, needs update to 17).

- `.ai/ai_docs/context-docs/infrastructure/docker-troubleshooting.md` - May need minor updates to document the backup container cleanup feature.

## Impact Analysis

### Dependencies Affected

- `/docker-fix` command users will see improved health reporting
- No breaking changes - this adds cleanup functionality
- Container inventory documentation will be updated from 16 to 17 expected containers

### Risk Assessment

**Low Risk**:
- Simple container detection and removal of already-exited containers
- Only removes containers matching specific criteria (exited postgres containers with non-standard names)
- Does not affect running containers or the main Supabase database
- Exit code 0 verification ensures only successfully completed backup containers are removed

### Backward Compatibility

- Fully backward compatible
- Existing `/docker-fix` functionality remains unchanged
- New cleanup phase is additive

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/docker-fix-backup-cleanup`
- [ ] Verify current container state with `docker ps -a`
- [ ] Confirm backup container identification logic is correct
- [ ] Test backup container detection on current environment

## Documentation Updates Required

- `.claude/commands/docker-fix.md` - Update container inventory from 16 to 17 containers, add cleanup phase documentation
- `.ai/ai_docs/context-docs/infrastructure/docker-setup.md` - Update expected container count from 16 to 17
- No CHANGELOG entry needed (internal tooling change)

## Rollback Plan

If issues occur:
1. Revert changes to `.claude/commands/docker-fix.md`
2. Manual cleanup: `docker rm $(docker ps -a --filter "status=exited" --filter "ancestor=public.ecr.aws/supabase/postgres" -q)`
3. No database impact - backup containers are ephemeral

## Step by Step Tasks

### Step 1: Update Container Inventory Count

Update the expected container count in docker-fix.md from 16 to 17 to reflect the actual infrastructure:

**Current containers (17 total):**
- 8 Supabase managed containers
- 2 Supabase external monitoring containers (PostgREST, Edge Runtime)
- 2 Supabase additional services (Vector, Analytics)
- 3 Custom test/development containers (slideheroes-app-test, slideheroes-payload-test, slideheroes-stripe-webhook)
- 2 Infrastructure containers (docs-mcp-server, ccmp-dashboard)

Update all references to "16 containers" to "17 containers" throughout the file.

### Step 2: Add Backup Container Detection Logic

Add a new detection step in the Pre-Flight Diagnostics section to identify orphaned backup containers:

```bash
# STEP 2.5: Identify orphaned backup containers (created by supabase db dump)
# These are postgres containers with:
# - status=exited (completed backup)
# - exit code 0 (successful)
# - Random Docker names (not matching supabase_db_* pattern)

BACKUP_CONTAINERS=$(docker ps -a \
  --filter "status=exited" \
  --filter "ancestor=public.ecr.aws/supabase/postgres" \
  --format "{{.Names}}" | grep -v "^supabase_db_")

BACKUP_COUNT=$(echo "$BACKUP_CONTAINERS" | grep -v '^$' | wc -l)

# Report backup containers found
if [[ "$BACKUP_COUNT" -gt 0 ]]; then
  echo "=== ORPHANED BACKUP CONTAINERS DETECTED ==="
  echo "Found $BACKUP_COUNT temporary backup container(s) from supabase db dump:"
  echo "$BACKUP_CONTAINERS"
  echo "These will be cleaned up automatically."
fi
```

### Step 3: Add Cleanup Phase to Method Section

Add a new cleanup step between the discovery phase and the fix strategies phase:

```bash
#### 1.5 **Cleanup** Orphaned Backup Containers

**Remove** temporary backup containers that have completed their task:

IF backup containers detected:
  → **Verify** exit code is 0 (successful completion)
  → **Remove** containers: docker rm <container_name>
  → **Report** cleanup results
  → **Update** container inventory count

**Execute** cleanup (AUTONOMOUS - these are completed ephemeral containers):

for container in $BACKUP_CONTAINERS; do
  # Verify exit code is 0 before removal
  EXIT_CODE=$(docker inspect --format '{{.State.ExitCode}}' "$container" 2>/dev/null)
  if [[ "$EXIT_CODE" == "0" ]]; then
    echo "Removing completed backup container: $container"
    docker rm "$container"
    ((CLEANUP_COUNT++))
  else
    echo "Skipping $container (exit code: $EXIT_CODE)"
  fi
done

echo "Cleaned up $CLEANUP_COUNT backup container(s)"
```

### Step 4: Update Progress Tracking

Update the TodoWrite progress tracking to include the cleanup phase:

```javascript
TodoWrite([
  {content: "Discover container health status", status: "in_progress", activeForm: "Discovering health status"},
  {content: "Cleanup orphaned backup containers", status: "pending", activeForm: "Cleaning up backup containers"},
  {content: "Diagnose unhealthy containers", status: "pending", activeForm: "Diagnosing issues"},
  {content: "Apply aggressive fix strategies", status: "pending", activeForm: "Applying fixes"},
  {content: "Validate restoration success", status: "pending", activeForm: "Validating fixes"}
])
```

### Step 5: Update Success Reporting

Update the final success report to include backup container cleanup metrics:

```
**Fix Summary:**
- Containers Processed: X total (17 expected)
- Backup Containers Cleaned: Y
- Stopped Container Fixes: A successful
- Restart Fixes: B successful
- Recreate Fixes: C successful
- Success Rate: XX%
- Total Duration: N minutes

**Container Health (17 Total):**
- Supabase Managed (8): X/8 healthy
- Supabase External (2): X/2 healthy
- Supabase Additional (2): X/2 healthy
- Test/Dev Containers (3): X/3 healthy
- Infrastructure (2): X/2 healthy
- Orphaned Backup Containers: Y cleaned up
```

### Step 6: Update Context Documentation

Update `.ai/ai_docs/context-docs/infrastructure/docker-setup.md`:

- Change "Expected Healthy Setup" section from 16 to 17 containers
- Update container inventory to include all current containers
- Add note about backup container cleanup in docker-fix

### Step 7: Run Validation Commands

Execute all validation commands to confirm the chore is complete with zero regressions.

## Validation Commands

```bash
# 1. Verify docker-fix.md syntax (no markdown errors)
cat .claude/commands/docker-fix.md | head -50

# 2. Verify container count is updated (should show 17 throughout)
grep -c "17" .claude/commands/docker-fix.md
grep "16 containers" .claude/commands/docker-fix.md  # Should return nothing

# 3. Check current container state
docker ps -a --format "table {{.Names}}\t{{.Status}}" | head -20

# 4. Verify backup container detection works
docker ps -a --filter "status=exited" --filter "ancestor=public.ecr.aws/supabase/postgres" --format "{{.Names}}" | grep -v "^supabase_db_"

# 5. Test the updated docker-fix command
/docker-fix --auto

# 6. Verify no backup containers remain after cleanup
docker ps -a --filter "status=exited" --filter "ancestor=public.ecr.aws/supabase/postgres" --format "{{.Names}}" | grep -v "^supabase_db_" | wc -l  # Should be 0

# 7. Verify final container count is correct
docker ps --format "{{.Names}}" | wc -l  # Should be 17

# 8. Run linting on modified files
pnpm lint:fix

# 9. Run type checking
pnpm typecheck
```

## Notes

- The backup containers are created by `supabase db dump` which is called by `/supabase-seed-remote` during Phase 1 backup creation
- These containers use the same postgres image as the main Supabase database but have random Docker-generated names
- Only containers with exit code 0 should be removed (indicating successful backup completion)
- The cleanup is autonomous since these are ephemeral containers that have already completed their task
- Container count was updated from 16 to 17 based on current infrastructure audit showing: 8 Supabase managed + 2 external + 2 additional (vector, analytics) + 3 test/dev + 2 infrastructure = 17 total
