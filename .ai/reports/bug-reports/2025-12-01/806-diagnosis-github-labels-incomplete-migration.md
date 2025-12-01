# Bug Diagnosis: GitHub Labels Migration Incomplete

**ID**: ISSUE-pending
**Created**: 2025-12-01T12:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The GitHub label migration from 93 unorganized labels to 35 hierarchical labels was started but not completed. New hierarchical labels exist alongside all old labels, creating confusion. Additionally, some slash commands still use old label formats, and the AI model occasionally ignores the hierarchical label instructions.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development/production (GitHub)
- **GitHub CLI**: gh version
- **Repository**: MLorneSmith/2025slideheroes

## Reproduction Steps

1. Run `gh label list --repo MLorneSmith/2025slideheroes --limit 200`
2. Observe both old (`bug`, `high`, `tooling`) and new (`type:bug`, `priority:high`, `area:infra`) labels exist
3. Check issue #801 - has mix of old (`tooling`, `technical-debt`, `low`) and new (`status:planning`) labels
4. Run `/diagnose` command and observe labels applied

## Expected Behavior

- Only 35 hierarchical labels should exist on GitHub
- All issues should use hierarchical labels (`type:*`, `priority:*`, `status:*`, `area:*`)
- Slash commands should create issues with correct hierarchical labels

## Actual Behavior

- 170+ labels exist (both old and new)
- Issue #801 created by `/diagnose` has old labels: `tooling`, `technical-debt`, `low`
- Some slash commands (`/review`) still reference old label names
- AI model sometimes ignores label format instructions

## Diagnostic Data

### Current Label Count
```
Total labels: ~170+
New hierarchical labels: 35
Old labels not deleted: ~135+
```

### Issue #801 Labels
```
tooling           (OLD - should be area:infra)
technical-debt    (OLD - should be type:chore)
low               (OLD - should be priority:low)
status:planning   (NEW - correct)
```

### Slash Command Label Usage
```
/diagnose (lines 379-382):   type:bug, status:triage, priority:*, area:*  ✓ CORRECT
/feature (lines 231-234):    type:feature, status:ready, priority:*, area:* ✓ CORRECT
/bug-plan (lines 501-504):   type:bug, status:ready, priority:*, complexity:* ✓ CORRECT
/chore (lines 158-161):      type:chore, status:ready, priority:*, area:*  ✓ CORRECT
/review (lines 338-341):     review-issues, blocker, needs-fix, <issueType> ✗ OLD FORMAT
```

### Migration Script Status
```bash
# Script: scripts/migrate-github-labels.sh
# Status: Partially executed
# --create-only: YES (new labels created)
# --delete-old: NOT RUN (old labels remain)
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three separate issues contribute to the incomplete label migration.

**Detailed Explanation**:

1. **Migration Script Not Fully Executed**: The `migrate-github-labels.sh` script was run with `--create-only` to create new hierarchical labels, but the `--delete-old` flag was never executed. This leaves all 135+ old labels in the repository alongside the 35 new ones.

2. **AI Model Ignoring Instructions**: When the `/diagnose` command was used to create issue #801, the AI model did not follow the label instructions in the template (lines 379-382). Instead of using `type:bug`, `status:triage`, `priority:low`, it used old flat labels `tooling`, `technical-debt`, `low`. This suggests the AI may have looked at existing issue labels for context rather than following the explicit instructions.

3. **Review Command Not Updated**: The `/review` slash command at `.claude/commands/review.md:338-341` still uses old flat labels: `review-issues`, `blocker`, `needs-fix`. This file was not updated during the migration planning.

**Supporting Evidence**:
- `gh label list` shows 170+ labels (old + new coexisting)
- Issue #801 JSON shows: `labels: [{name: "tooling"}, {name: "technical-debt"}, {name: "low"}, {name: "status:planning"}]`
- `scripts/migrate-github-labels.sh` exists with `--delete-old` flag never executed
- `.claude/commands/review.md:338-341` shows old label names

### How This Causes the Observed Behavior

1. Old labels remain available in GitHub → AI can see and use them
2. AI model sees existing issues with old labels → copies pattern instead of following instructions
3. `/review` command explicitly uses old labels → creates issues with wrong format
4. No automated label validation → inconsistent labeling goes unnoticed

### Confidence Level

**Confidence**: High

**Reasoning**: Direct evidence from:
- Label list shows both old and new labels exist
- Migration script code shows `--delete-old` path exists but wasn't run
- Issue #801 labels directly visible via GitHub API
- `/review` command source code shows old labels

## Fix Approach (High-Level)

1. **Run migration cleanup**: Execute `./scripts/migrate-github-labels.sh --delete-old` to remove all old labels from GitHub
2. **Update /review command**: Edit `.claude/commands/review.md` to use hierarchical labels (`type:bug`, `status:blocked`, `priority:*`)
3. **Add label validation**: Consider adding a pre-commit hook or GitHub Action to validate labels on issue creation
4. **Run issue migration**: Execute `./scripts/migrate-issue-labels.sh` to update remaining issues with old labels

## Diagnosis Determination

The incomplete migration has three root causes:
1. Migration script phase 2 (`--delete-old`) was not executed
2. `/review` slash command was not updated
3. AI model occasionally ignores explicit label instructions (likely due to seeing old labels in context)

The fix requires completing the migration script execution, updating the review command, and optionally adding label validation to prevent future inconsistencies.

## Related Code

- **Affected Files**:
  - `scripts/migrate-github-labels.sh` (needs `--delete-old` execution)
  - `scripts/migrate-issue-labels.sh` (may need re-run)
  - `.claude/commands/review.md` (needs label updates)
- **Recent Changes**: Research completed 2025-11-28, migration started but not completed
- **Suspected Functions**: None - configuration/process issue

## Additional Context

The research in `.ai/reports/research-reports/2025-11-28/perplexity-github-labeling-best-practices.md` recommended 35 hierarchical labels. New labels were created correctly, but cleanup was never performed.

Issues without hierarchical labels:
- #804: Bug Diagnosis (recent, no labels)
- #785, #784, #783, #782, #781: Automated weekly reports (not using standard labels)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh label list, gh issue view, Read, Grep*
