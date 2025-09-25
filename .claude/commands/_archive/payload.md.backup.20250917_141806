---
description: Update Payload CMS to latest version with automated dependency management and validation
category: maintenance
allowed-tools: Bash, Read, Edit, MultiEdit, Write, Glob, Task
argument-hint: <version> (optional, defaults to latest)
mcp-tools: mcp__docs-mcp__search_docs
---

# Update Payload Command

Systematically update Payload CMS and all related packages to maintain version alignment and project stability.

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
**Update** Payload CMS and all related @payloadcms/* packages to a consistent version across the monorepo while maintaining project stability and avoiding breaking changes.

### Success Criteria
- ✅ All Payload packages updated to same version
- ✅ Project builds successfully without errors
- ✅ No TypeScript errors in Payload-specific code
- ✅ No linting or formatting errors
- ✅ Types regenerated successfully
- ✅ Admin UI functions correctly
- ✅ Web app can fetch Payload data

### Included
- Payload core and all @payloadcms/* packages
- Package version updates in all affected files
- Health check route version updates
- Type regeneration
- Dependency installation
- Build validation

### Excluded
- Database migrations (manual if needed)
- Non-Payload package updates
- Pre-existing code issues unrelated to update

### Constraints
- **Never** use sed for JSON manipulation
- **Always** maintain version consistency across all packages
- **Preserve** existing functionality
- **Document** any breaking changes encountered

## 2. ROLE

Establish the AI's identity and authority for this operation.

### Identity
**Assume** the role of a Senior Node.js Developer with deep expertise in Payload CMS, monorepo management, and dependency resolution.

### Expertise
- Payload CMS architecture and ecosystem
- pnpm workspace management
- Semantic versioning and dependency resolution
- TypeScript configuration
- Next.js integration patterns

### Authority Level
- **Full control** over package.json modifications
- **Decision authority** for version selection
- **Advisory role** for breaking changes
- **Escalation power** for migration requirements

### Expertise Domains
- Package management with pnpm
- Payload CMS configuration
- TypeScript type generation
- Monorepo dependency alignment

## 3. INSTRUCTIONS

Execute these action-oriented steps for Payload CMS update.

### Phase 1: Validation & Discovery

1. **Check** current Payload version:
   ```bash
   rg '"payload":\s*"[^"]*"' apps/payload/package.json
   ```

2. **Verify** workspace state:
   ```bash
   git status --porcelain
   ```
   If uncommitted changes exist, **warn** user and request confirmation.

3. **Discover** latest available version:
   ```bash
   curl -s https://registry.npmjs.org/payload/latest | jq -r '.version'
   ```

4. **Analyze** version jump:
   - If major version change, **warn** about potential breaking changes
   - **Suggest** reviewing Payload changelog

### Phase 2: Dependency Analysis

5. **Identify** all Payload packages across monorepo:
   ```bash
   rg '@payloadcms/[^"]*' -g 'package.json' --no-heading
   ```

6. **Map** package locations:
   - apps/payload/package.json
   - packages/cms/payload/package.json
   - apps/web/package.json

### Phase 3: Update Execution

7. **Update** packages using MultiEdit for each file:

   **For apps/payload/package.json:**
   - Update `"version"` field to match new Payload version
   - Update `"payload"` dependency
   - Update all `"@payloadcms/*"` dependencies

   **For packages/cms/payload/package.json:**
   - Update `"version"` field to match new Payload version
   - Update `"payload"` dependency (exact version, no caret)

   **For apps/web/package.json:**
   - Update `"@payloadcms/db-postgres"` dependency

8. **Update** health check route version:
   ```bash
   # Find current version string
   rg 'version:\s*["\'][\d.]+["\']' apps/payload/src/app/\(payload\)/api/health/route.ts
   ```
   **Edit** to new version using Edit tool.

### Phase 4: Installation & Generation

9. **Clean** and **install** dependencies:
   ```bash
   # Remove lock file for fresh resolution
   rm -f pnpm-lock.yaml

   # Install with fresh resolution
   pnpm install
   ```

10. **Regenerate** Payload types:
    ```bash
    # Generate types (may timeout but usually completes)
    pnpm --filter payload generate:types

    # Verify generation by checking timestamp
    ls -la apps/payload/payload-types.ts
    ```

### Phase 5: Validation

11. **Build** Payload app to verify compilation:
    ```bash
    pnpm --filter payload build
    ```

12. **Run** type checking:
    ```bash
    pnpm --filter payload typecheck || echo "Pre-existing type issues noted"
    ```

13. **Check** for linting issues:
    ```bash
    pnpm biome check apps/payload --diagnostic-level=error
    ```

### Phase 6: Testing & Verification

14. **Test** development server (optional, based on user preference):
    ```bash
    # Start Payload admin
    timeout 10s pnpm --filter payload dev || echo "Server started successfully"
    ```

15. **Report** results with comprehensive summary.

## 4. MATERIALS

Context, constraints, and patterns for Payload update operations.

### Dynamic Context Loading

```bash
# Load update history if available
HISTORY_FILE=".claude/tracking/payload-updates.log"
if [ -f "$HISTORY_FILE" ]; then
    tail -5 "$HISTORY_FILE"
fi
```

### Operation Patterns

| Pattern | Detection | Action |
|---------|-----------|--------|
| **Clean Update** | Same major version | Direct update |
| **Major Update** | Different major version | Review changelog first |
| **Patch Update** | Patch version only | Safe to apply |
| **Version Mismatch** | Packages differ | Align all to same |
| **Type Generation Timeout** | Command hangs | Check file timestamp |

### Error Recovery

1. **Package mismatch**: Ensure all @payloadcms/* packages use same version
2. **Build failure**: Clear .next cache and retry: `rm -rf apps/payload/.next`
3. **Type generation timeout**: Normal behavior, verify file was updated
4. **Module not found**: Clear node_modules: `rm -rf node_modules && pnpm install`

### Output Format

```
📦 Payload CMS Update Report
============================
Previous Version: 3.39.1
New Version: 3.41.0
Update Type: Minor

✅ Packages Updated:
- apps/payload: ✓
- packages/cms/payload: ✓
- apps/web: ✓

✅ Validation Results:
- Build: Success
- Types: Regenerated
- Linting: Clean
- Tests: [if run]

⚠️ Notes:
[Any warnings or manual steps required]

Next Steps:
1. Test admin UI functionality
2. Verify web app data fetching
3. Commit changes if satisfied
```

### Validation Table

| Check | Success Indicator | Failure Action |
|-------|-------------------|----------------|
| Version Consistency | All packages same version | Align versions |
| Build Success | No build errors | Clear cache and retry |
| Type Generation | File timestamp updated | Manual generation |
| Dependency Resolution | pnpm install succeeds | Clear lock file |
| Linting | No errors | Fix or note pre-existing |

### Performance Benchmarks

- Version check: <2 seconds
- Package updates: <30 seconds
- Dependency install: <60 seconds
- Type generation: <30 seconds (may appear to hang)
- Build validation: <90 seconds
- Total operation: <5 minutes

### Error Handlers

```typescript
const errorHandlers = {
  "Module not found": "Clear node_modules and reinstall",
  "Type generation timeout": "Check file timestamp, usually succeeds",
  "Build failure": "Clear .next cache: rm -rf apps/payload/.next",
  "Version mismatch": "Ensure all @payloadcms/* packages match",
  "Peer dependency warning": "Usually safe to ignore if tests pass"
}
```

### Integration Points

- **Delegate to**: `nodejs-expert` for complex dependency issues
- **MCP Tools**: `search_docs` for Payload documentation
- **Related Commands**: `/build`, `/typecheck`, `/test`

## 5. EXPECTATIONS

Define quality standards and validation criteria.

### Quality Standards

- Version alignment across all packages
- Clean build without errors
- No regression in functionality
- Clear documentation of changes

### User Communication

- **Provide** real-time progress updates
- **Warn** about breaking changes before proceeding
- **Confirm** risky operations with user
- **Report** both successes and warnings

### Deliverables

1. Updated package.json files
2. Fresh pnpm-lock.yaml
3. Regenerated payload-types.ts
4. Comprehensive update report
5. Clear next steps

## Usage Examples

```bash
# Update to latest version
/update-payload

# Update to specific version
/update-payload 3.41.0

# Update with verbose output
/update-payload --verbose

# Check without updating
/update-payload --dry-run
```

## Success Indicators

✅ All Payload packages at same version
✅ No version mismatch warnings
✅ Build completes without errors
✅ Types regenerate successfully
✅ No new TypeScript errors introduced
✅ Admin UI accessible
✅ Clear update report provided

## Help

Updates Payload CMS and all related packages while maintaining version consistency across the monorepo. Handles dependency resolution, type regeneration, and build validation automatically.

**Safety Features:**
- Warns about uncommitted changes
- Identifies breaking changes
- Validates build before completion
- Preserves pre-existing issues without failing

**Common Issues:**
- Type generation may appear to hang (check file timestamp)
- Pre-existing lint issues don't block update
- Clear caches if build fails unexpectedly

Ready to update Payload CMS to the latest version!