# Bug Fix: Staging deploy fails - upload-artifact rejects filenames with colons

**Related Diagnosis**: #1773
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: GitHub Actions `upload-artifact@v6` permanently rejects files with colons (`:`) in filenames due to NTFS compatibility. Next.js/Turbopack generates server chunks with `node:` in filenames (e.g., `[externals]_node:child_process_261e8bca._.js`).
- **Fix Approach**: Wrap build artifacts in a tar archive before uploading. Archives preserve internal filenames while presenting a safe external filename.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Deploy to Staging workflow fails at the "Upload artifacts" step because:
1. Next.js/Turbopack generates server chunk files with `node:` in the filename
2. GitHub Actions `upload-artifact@v6` rejects colons due to NTFS filesystem restrictions
3. This is permanent - no configuration can bypass it

For full details, see diagnosis issue #1773.

### Solution Approaches Considered

#### Option 1: Tar Archive Approach ⭐ RECOMMENDED

**Description**: Wrap build artifacts in a tar archive before uploading. The archive itself has a safe filename, while the contents preserve all special characters. After download, extract the archive to restore the original files.

**Pros**:
- Simple one-step wrapper approach
- Preserves all filenames exactly as-is (no sanitization needed)
- Maintains file permissions and timestamps
- Faster for many small files (better compression)
- Works with GitHub Actions without modification
- Reversible - can always extract the tar

**Cons**:
- Adds small storage overhead (~5-10% typically)
- Requires extraction step in download workflows
- Slightly different artifact handling than before

**Risk Assessment**: low - This is a standard archiving approach used by many CI/CD systems. Tar is universally available on Linux runners.

**Complexity**: simple - Just add tar steps before/after upload/download.

#### Option 2: Filename Sanitization

**Description**: Rename files with colons to a safe name before upload (e.g., `node:child_process` → `node_child_process`), then rename back after download.

**Pros**:
- No additional wrapper steps
- Files appear "normal" in artifact storage

**Cons**:
- Fragile - prone to missing files during rename
- Must maintain a mapping file to rename correctly on download
- References to original filenames in `.next/metadata.json` could break
- Complex to implement correctly across all scenarios
- Higher risk of corruption or missing files

**Risk Assessment**: medium - Requires careful tracking and could cause subtle runtime issues if references break.

**Complexity**: moderate - Needs sanitization logic and mapping file.

**Why Not Chosen**: Too risky and complex for a problem that has a simpler solution. Tar archiving is more reliable.

#### Option 3: Exclude Problematic Files

**Description**: Configure paths in upload-artifact to skip files with colons (e.g., `!.next/server/chunks/*:*`).

**Pros**:
- No wrapper needed
- Files upload without issues

**Cons**:
- Deletes required server chunks from deployment
- Application will be broken - NextJS runtime needs these files
- Not viable

**Risk Assessment**: high - Breaks the application.

**Complexity**: simple - But not a viable solution.

**Why Not Chosen**: These files are required for the Next.js runtime. Excluding them breaks deployments.

### Selected Solution: Tar Archive Approach

**Justification**: This is the most robust, simplest, and lowest-risk solution. Tar archiving is a standard approach in CI/CD workflows. It requires minimal code changes, preserves file integrity perfectly, and is reversible. The 5-10% storage overhead is negligible compared to the reliability benefit.

**Technical Approach**:
- Add `tar -cf build-artifacts.tar ...` step before `actions/upload-artifact@v6`
- Upload the tar file instead of individual directories
- In consumers (staging-deploy.yml), add `tar -xf build-artifacts.tar` after download
- No changes needed to build process or artifact validation

**Architecture Changes** (if any):
- **artifact-sharing.yml**: Add archive step before upload, modify upload path
- **staging-deploy.yml** (and other consumers): Add extract step after download
- **reusable-build.yml**: Same as artifact-sharing.yml if it uploads .next

No architectural changes to the build system itself. This is purely a workflow-level wrapper.

**Migration Strategy** (if needed):
- No migration needed - this is a pure fix
- Old artifacts will fail to download (which they already do)
- New artifacts will work correctly

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/artifact-sharing.yml:153-165` - Replace individual artifact upload with tar archive approach
- `.github/workflows/reusable-build.yml:124` - If it uploads .next, apply same pattern
- `.github/workflows/staging-deploy.yml` - Add tar extraction after artifact download
- `.github/workflows/production-deploy.yml` - Add tar extraction after artifact download (if it downloads these artifacts)

### New Files

No new files needed. All changes are in existing workflow files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update artifact-sharing.yml - Archive artifacts before upload

Modify the upload artifacts step to first create a tar archive.

- Add "Archive build artifacts" step before "Upload artifacts" step
- Create tar file containing all artifacts: `tar -cf build-artifacts.tar apps/web/.next apps/web/public apps/payload/dist packages/*/dist build-manifest.json`
- Modify "Upload artifacts" step to upload only the `.tar` file
- Add `include-hidden-files: false` (no longer needed since tar contains the file list)
- Keep `if-no-files-found: warn` to catch archive creation failures

**Why this step first**: The archive creation must be validated to work before consumers rely on it.

#### Step 2: Update staging-deploy.yml - Extract artifacts after download

Add extraction step after downloading artifacts.

- Locate "Download artifacts" step in the validation job
- Add new "Extract artifacts" step immediately after
- Extract with: `tar -xf build-artifacts.tar`
- Verify extraction succeeds before proceeding

**Why this step second**: Ensures consumers can extract the archives correctly.

#### Step 3: Update production-deploy.yml - Extract artifacts after download (if applicable)

Apply same extraction pattern if this workflow also downloads these artifacts.

- Locate "Download artifacts" step
- Add "Extract artifacts" step with `tar -xf build-artifacts.tar`
- Keep existing validation logic

#### Step 4: Check reusable-build.yml

Determine if this workflow also uploads `.next` directory.

- If it does, apply the same archive pattern
- If not, no changes needed

#### Step 5: Validate workflow syntax

Ensure all YAML changes are syntactically correct.

- Use `cat <file> | head -200` to view key sections
- Verify indentation is correct
- Verify `run:` commands are properly formatted
- Verify artifact names are consistent across workflows

#### Step 6: Test locally with dry-run

Verify the workflows are valid without executing them.

- Run: `cat .github/workflows/artifact-sharing.yml | yq . > /dev/null` (if yq available)
- Or manually verify YAML structure is correct
- Check that all step `id:` references are unique and used correctly

#### Step 7: Create test PR and monitor staging deployment

Push the changes and verify the workflow succeeds.

- Commit changes with proper conventional commit format
- Create PR to staging branch
- Monitor Deploy to Staging workflow
- Verify "Archive build artifacts" step succeeds
- Verify "Upload artifacts" step succeeds (uploads tar file)
- Verify "Extract artifacts" step succeeds
- Verify "Validate Build Artifacts" step succeeds
- Verify deployment completes successfully

## Testing Strategy

### Unit Tests

No unit tests applicable - these are workflow YAML changes, not code.

### Integration Tests

Workflow integration testing:
- ✅ Tar archive creation succeeds
- ✅ Tar file is uploaded successfully (no colon errors)
- ✅ Tar file downloads correctly
- ✅ Tar extraction succeeds
- ✅ Extracted files match originals (permissions, timestamps)
- ✅ `.next` directory structure is preserved
- ✅ `apps/payload/dist` directory is preserved
- ✅ `build-manifest.json` is accessible after extraction
- ✅ Validation step finds extracted artifacts
- ✅ Deployment succeeds with extracted artifacts

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger Deploy to Staging workflow manually
- [ ] Monitor "Archive build artifacts" step - should complete quickly
- [ ] Monitor "Upload artifacts" step - should complete without colon errors
- [ ] Verify artifact file in GitHub shows as single `.tar` file
- [ ] Verify artifact size is reasonable (~50-100MB typical)
- [ ] Monitor "Extract artifacts" step - should complete successfully
- [ ] SSH into runner and verify `.next` directory exists after extraction
- [ ] Verify `.next/server/chunks/` contains expected files with colons
- [ ] Verify deployment jobs proceed normally
- [ ] Check that staging environment receives correctly deployed code
- [ ] Verify Next.js application starts without errors
- [ ] Test a few application pages to ensure server-side rendering works

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Tar file gets corrupted**:
   - **Likelihood**: low - tar is extremely reliable
   - **Impact**: medium - Deploy would fail at extraction
   - **Mitigation**: Tar validates on extraction with proper error handling. Existing artifact validation will catch this.

2. **Extraction fails in consumer workflows**:
   - **Likelihood**: low - tar extraction is standard
   - **Impact**: medium - Deploy would fail
   - **Mitigation**: Test in PR first. Extraction step includes error reporting.

3. **File permissions lost**:
   - **Likelihood**: very low - tar preserves permissions by default
   - **Impact**: low - Deployment still works, might have permission issues
   - **Mitigation**: Verify permissions in test (should be fine with standard tar)

4. **Storage quota exceeded**:
   - **Likelihood**: very low - tar archive is actually smaller than individual files
   - **Impact**: low - unlikely to cause quota issues
   - **Mitigation**: Monitor artifact size, should be 20-30% smaller than before

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the workflow files to previous versions
2. This immediately causes uploads to fail (as before) rather than deploy with wrong artifacts
3. No data corruption possible - tar is either valid or invalid, no partial states
4. Deploy team notifies to investigate - same as before the fix
5. Use successful production artifacts from before this change if needed

**Monitoring** (if needed):
- Monitor first 3 Deploy to Staging runs for success/failure
- Check artifact sizes are reasonable (~50-100MB)
- Verify no new error patterns in workflow logs
- After 5 successful runs, consider it stable

## Performance Impact

**Expected Impact**: minimal positive

- **Archive creation**: ~2-5 seconds (faster than uploading 2050 individual files)
- **Upload speed**: Similar or slightly faster (compressed tar)
- **Download speed**: Similar
- **Extraction**: ~2-5 seconds
- **Total**: Approximately same or 10% faster

**Performance Testing**:
- Measure workflow time before/after (should be same or slightly faster)
- Verify tar compression is active (should be ~10-20% smaller)

## Security Considerations

**Security Impact**: none - neutral

- Tar archive format is standard and secure
- No additional security risks introduced
- No sensitive data exposed
- All file permissions preserved

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger staging deployment (will fail)
gh workflow run "Deploy to Staging" --ref staging

# Monitor and observe the colon error
gh run watch <run-id>
```

**Expected Result**: "Upload artifacts" step fails with colon in filename error.

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow files are valid YAML
cat .github/workflows/artifact-sharing.yml | grep -A 10 "Archive build artifacts"

# Trigger staging deployment (should succeed)
gh workflow run "Deploy to Staging" --ref staging

# Monitor the workflow
gh run watch <run-id>

# Verify specific steps
gh run view <run-id> --json jobs --jq '.jobs[] | select(.name | contains("Build or Reuse")) | {name, conclusion}'
gh run view <run-id> --json jobs --jq '.jobs[] | select(.name | contains("Validate")) | {name, conclusion}'

# Download and inspect artifact (should be a tar file)
gh run download <run-id> -n "build-artifacts-staging-*"
ls -lh build-artifacts.tar

# Verify tar file contents (don't extract)
tar -tf build-artifacts.tar | head -20
tar -tf build-artifacts.tar | grep "node:child_process" # Should find colon-containing files

# Verify deployment completes
gh run view <run-id> --json conclusion --jq '.conclusion'
```

**Expected Result**: All commands succeed, tar file is created and uploaded, deployment completes successfully.

### Regression Prevention

```bash
# Run subsequent stagings deployments to verify consistency
for i in {1..3}; do
  gh workflow run "Deploy to Staging" --ref staging
  sleep 60
done

# Monitor all 3 runs
gh run list --workflow "Deploy to Staging" --limit 3 --json conclusion --jq '.[] | .conclusion'

# All should be 'success'
```

## Dependencies

**No new dependencies required**

- `tar` command is built into all Linux runners (standard)
- No additional GitHub Actions or packages needed

## Database Changes

**No database changes required**

This is purely a CI/CD workflow change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- This fix deploys automatically when merged to staging
- The fix IS the deployment improvement
- No manual steps needed
- Existing deployment jobs will handle the tar extraction without issues

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/artifact-sharing.yml` modified with archive step
- [ ] `.github/workflows/staging-deploy.yml` modified with extraction step
- [ ] `.github/workflows/production-deploy.yml` modified if applicable
- [ ] All workflow YAML files are syntactically valid
- [ ] PR created and reviewed
- [ ] Deploy to Staging workflow runs successfully
- [ ] "Archive build artifacts" step creates tar file
- [ ] "Upload artifacts" step succeeds (no colon errors)
- [ ] "Extract artifacts" step succeeds
- [ ] Build artifacts validation step succeeds
- [ ] Deployment to staging completes successfully
- [ ] No regressions in other workflows
- [ ] Next.js application runs correctly on staging

## Notes

**Why tar archive is the right choice**:
- Industry standard for CI/CD artifact wrapping
- Used by many teams facing GitHub Actions limitations
- Zero complexity compared to alternatives
- Perfect reliability - either works completely or fails obviously

**Testing strategy**:
- Test in PR first on staging branch
- Verify one full successful deployment before considering stable
- Monitor for any issues in logs

**Future considerations**:
- If GitHub Actions ever fixes the colon limitation, tar can be removed
- Meanwhile, this is a solid, maintainable solution
- Similar pattern could be applied to other workflows if needed

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1773*
