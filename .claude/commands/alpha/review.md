---
description: Review implemented work after Alpha workflow completion. Validates features against spec, captures screenshots, and creates comprehensive review reports.
argument-hint: <spec-id|S#.I#|S#.I#.F#> [--level=spec|initiative|feature]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, WebFetch, AskUserQuestion]
---

# Alpha Review

Review implemented work from the Alpha autonomous coding workflow. Validates that features match specifications, captures visual evidence, and creates comprehensive review reports.

**Arguments:**
- `<id>` - Required. Spec ID (`1362` or `S1362`), Initiative ID (`S1362.I1`), or Feature ID (`S1362.I1.F1`)
- `--level=<spec|initiative|feature>` - Optional. Review granularity (auto-detected from ID format)
- `--skip-screenshots` - Optional. Skip visual verification (for headless/API-only features)

## Context

You are reviewing work completed by the Alpha Implementation System. Your job is to:
1. Validate implemented features against their specifications
2. Capture visual evidence of working functionality
3. Identify issues and categorize by severity
4. Create comprehensive review reports
5. Update GitHub with review results
6. Track review status in the spec manifest

## Phase 0: Parse Arguments and Determine Scope

**Parse the input ID:**
```typescript
const input = '$ARGUMENTS'.split(' ')[0];
const flags = '$ARGUMENTS'.split(' ').slice(1);

let reviewLevel: 'spec' | 'initiative' | 'feature';
let specId: string;
let initiativeId: string | null = null;
let featureId: string | null = null;

if (input.match(/^S?\d+$/)) {
  // Spec level: "1362" or "S1362"
  reviewLevel = 'spec';
  specId = input.replace(/^S/, '');
} else if (input.match(/^S\d+\.I\d+$/)) {
  // Initiative level: "S1362.I1"
  reviewLevel = 'initiative';
  const match = input.match(/S(\d+)\.I(\d+)/);
  specId = match[1];
  initiativeId = input;
} else if (input.match(/^S\d+\.I\d+\.F\d+$/)) {
  // Feature level: "S1362.I1.F1"
  reviewLevel = 'feature';
  const match = input.match(/S(\d+)\.I(\d+)\.F(\d+)/);
  specId = match[1];
  featureId = input;
}

// Check for --level override
const levelFlag = flags.find(f => f.startsWith('--level='));
if (levelFlag) {
  reviewLevel = levelFlag.split('=')[1];
}

const skipScreenshots = flags.includes('--skip-screenshots');
```

## Phase 1: Load Spec Manifest and Context

1. **Find the spec directory:**
```bash
# Find spec directory by ID
find .ai/alpha/specs -maxdepth 1 -type d -name "*${specId}*Spec*" | head -1
```

2. **Load spec-manifest.json:**
```bash
# Read the manifest
cat .ai/alpha/specs/S${specId}-Spec-*/spec-manifest.json
```

3. **Extract review scope from manifest:**
```typescript
// For spec-level review
const completedFeatures = manifest.feature_queue.filter(f => f.status === 'completed');
const failedFeatures = manifest.feature_queue.filter(f => f.status === 'failed');

// For initiative-level review
const initiativeFeatures = completedFeatures.filter(f => f.initiative_id === initiativeId);

// For feature-level review
const targetFeature = completedFeatures.find(f => f.id === featureId);
```

4. **Read the spec file:**
```bash
# Find and read the original spec
cat .ai/alpha/specs/S${specId}-Spec-*/spec.md
```

5. **Load feature files for completed features:**
```bash
# For each completed feature, read its feature.md
cat .ai/alpha/specs/S${specId}-Spec-*/*-Initiative-*/*-Feature-*/feature.md
```

## Phase 2: Validate Implementation Status

**Pre-review checklist:**
- [ ] Spec manifest exists and is readable
- [ ] At least one feature is completed
- [ ] Git branch matches spec branch (alpha/S${specId})
- [ ] Dev server is accessible (if UI validation needed)

**Validation commands:**
```bash
# Check current branch
git branch --show-current

# Check if branch matches expected
git branch --show-current | grep -E "alpha/(S)?${specId}"

# Get changes since dev branch
git log origin/dev..HEAD --oneline

# Check dev server (if running)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Dev server not running"
```

## Phase 3: Conduct Review by Level

### Spec-Level Review (Default)

Review the entire spec implementation:

1. **Verify all completed features:**
```
For each completed feature in manifest.feature_queue:
  - Read feature.md to understand requirements
  - Check that expected output files exist
  - Verify key functionality works
  - Note any issues found
```

2. **Test critical user flows:**
```
Based on spec.md, identify 3-5 critical user flows:
  - Navigate to each flow's starting point
  - Verify flow completes successfully
  - Capture screenshots at key points
```

3. **Check cross-feature integration:**
```
Verify that features integrate correctly:
  - Shared state works between features
  - Navigation between feature areas works
  - No console errors on feature transitions
```

### Initiative-Level Review

Review all features in a specific initiative:

```
For each feature in initiative:
  - Validate against feature.md requirements
  - Capture screenshots
  - Note issues
Aggregate into initiative-level report
```

### Feature-Level Review

Review a single feature (similar to existing /review):

```
1. Read feature.md and tasks.json
2. Verify each acceptance criterion is met
3. Test the feature's primary user flow
4. Capture screenshots
5. Generate feature-level report
```

## Phase 4: Visual Verification

**Skip if `--skip-screenshots` flag is set.**

1. **Ensure dev server is running:**
```bash
# Check if dev server is responding
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# If not running and in sandbox, start it
# pnpm dev &
# sleep 30
```

2. **Capture screenshots for each completed feature:**
```bash
# Create validation directory
mkdir -p .ai/alpha/validation/S${specId}/review/

# For each critical route, capture screenshot
# Using agent-browser if available
agent-browser open http://localhost:3000${route}
agent-browser wait 3000
agent-browser screenshot .ai/alpha/validation/S${specId}/review/${featureId}-${screenshotName}.png
```

3. **Screenshot naming convention:**
```
.ai/alpha/validation/S${specId}/review/
├── 01-spec-overview.png          # Main landing/dashboard
├── S1362.I1.F1-feature-main.png  # Feature main view
├── S1362.I1.F2-feature-main.png  # Feature main view
├── 02-user-flow-step1.png        # Critical flow step 1
├── 03-user-flow-step2.png        # Critical flow step 2
└── issues/
    ├── issue-01-button-hidden.png
    └── issue-02-alignment.png
```

4. **Accessibility snapshot for key pages:**
```bash
agent-browser open http://localhost:3000${route}
agent-browser snapshot -i -c > .ai/alpha/validation/S${specId}/review/${route}-a11y.txt
```

## Phase 5: Issue Detection and Categorization

**Identify issues during review:**

```typescript
interface ReviewIssue {
  id: string;                    // e.g., "R-001"
  feature_id: string;            // e.g., "S1362.I1.F1"
  severity: 'blocker' | 'tech_debt' | 'skippable';
  description: string;
  screenshot_path?: string;
  proposed_resolution: string;
  acceptance_criterion?: string; // Which criterion it violates
}
```

**Severity Guidelines:**

| Severity | Definition | Examples |
|----------|------------|----------|
| `blocker` | Prevents release, breaks functionality | Feature doesn't work, data loss, security issue |
| `tech_debt` | Non-blocking but should be addressed | Performance issue, code quality, missing tests |
| `skippable` | Minor, can ship as-is | UI alignment, minor typos, cosmetic issues |

**Issue detection checklist:**
- [ ] All acceptance criteria met?
- [ ] No console errors?
- [ ] No TypeScript errors in codebase?
- [ ] No broken navigation?
- [ ] No visual regressions?
- [ ] Performance acceptable?
- [ ] Accessibility basics pass?

## Phase 6: Generate Review Reports

### Update Spec Manifest

Add review section to `spec-manifest.json`:

```bash
# Read current manifest
MANIFEST=$(cat .ai/alpha/specs/S${specId}-Spec-*/spec-manifest.json)

# Add review section using jq (or manual JSON edit)
# Fields to add:
# - review.status: "passed" | "failed" | "partial"
# - review.started_at: ISO timestamp
# - review.completed_at: ISO timestamp
# - review.summary: Summary text
# - review.issues_found: { blocker: N, tech_debt: N, skippable: N }
# - review.screenshots: Array of paths
# - review.github_comment_url: URL to GitHub comment
```

### Generate JSON Report

Create `.ai/alpha/validation/S${specId}/review-report.json`:

```json
{
  "spec_id": "S1362",
  "review_level": "spec",
  "timestamp": "2026-01-27T12:00:00Z",
  "success": true,
  "summary": "The User Dashboard Home spec has been successfully implemented with 13/13 features completed. All critical user flows work as expected. 2 minor issues identified for future improvement.",
  "scope": {
    "initiatives_reviewed": 4,
    "features_reviewed": 13,
    "features_passed": 13,
    "features_with_issues": 2
  },
  "issues": [
    {
      "id": "R-001",
      "feature_id": "S1362.I1.F2",
      "severity": "skippable",
      "description": "Dashboard grid has minor alignment issue on tablet viewport",
      "screenshot_path": ".ai/alpha/validation/S1362/review/issues/issue-01-alignment.png",
      "proposed_resolution": "Adjust Tailwind grid breakpoints for md: viewport"
    }
  ],
  "screenshots": [
    ".ai/alpha/validation/S1362/review/01-spec-overview.png",
    ".ai/alpha/validation/S1362/review/02-dashboard-loaded.png"
  ],
  "features_reviewed": [
    {
      "id": "S1362.I1.F1",
      "title": "Dashboard Page & Grid Layout",
      "status": "passed",
      "issues": []
    }
  ]
}
```

### Generate Markdown Report

Create `.ai/alpha/validation/S${specId}/REVIEW.md`:

```markdown
# Review Report: S${specId} - ${spec_title}

**Spec:** S${specId}
**Review Date:** ${timestamp}
**Review Level:** ${reviewLevel}
**Status:** ${success ? '✅ PASSED' : '❌ FAILED'}

## Summary

${review_summary}

## Scope

| Metric | Count |
|--------|-------|
| Initiatives Reviewed | ${initiatives_reviewed} |
| Features Reviewed | ${features_reviewed} |
| Features Passed | ${features_passed} |
| Features with Issues | ${features_with_issues} |

## Issues Found

**Total:** ${total_issues} (${blocker_count} blockers, ${tech_debt_count} tech debt, ${skippable_count} skippable)

### Blockers
${blocker_issues_list || 'None'}

### Tech Debt
${tech_debt_issues_list || 'None'}

### Skippable
${skippable_issues_list || 'None'}

## Features Reviewed

${feature_review_table}

## Screenshots

${screenshot_gallery}

## Next Steps

${next_steps_based_on_status}

---
*Generated by Alpha Review*
*Review completed: ${timestamp}*
```

## Phase 7: Update GitHub

### Post Review Comment to Spec Issue

```bash
gh issue comment ${specId} \
  --repo slideheroes/2025slideheroes \
  --body "## 🔍 Alpha Review Complete

**Status:** $([ \"${success}\" = \"true\" ] && echo \"✅ PASSED\" || echo \"❌ FAILED\")
**Review Level:** ${reviewLevel}
**Features Reviewed:** ${features_reviewed}

### Summary
${review_summary}

### Issues Found
- **Blockers:** ${blocker_count}
- **Tech Debt:** ${tech_debt_count}
- **Skippable:** ${skippable_count}

### Screenshots
${screenshot_count} screenshots captured in \`.ai/alpha/validation/S${specId}/review/\`

📋 **Full Report:** \`.ai/alpha/validation/S${specId}/REVIEW.md\`

---
*Alpha Review completed at ${timestamp}*
"
```

### Update Spec Issue Labels

```bash
if [ "${success}" = "true" ]; then
  gh issue edit ${specId} \
    --repo slideheroes/2025slideheroes \
    --add-label "alpha:reviewed" \
    --add-label "alpha:review-passed"
else
  gh issue edit ${specId} \
    --repo slideheroes/2025slideheroes \
    --add-label "alpha:reviewed" \
    --add-label "alpha:review-failed"
fi
```

### Create Follow-up Issue for Blockers (if any)

```bash
if [ "${blocker_count}" -gt 0 ]; then
  REVIEW_ISSUE=$(gh issue create \
    --repo slideheroes/2025slideheroes \
    --title "Review Issues: S${specId} - ${spec_title}" \
    --body "## Blocking Issues from Alpha Review

**Spec:** #${specId}
**Review Report:** \`.ai/alpha/validation/S${specId}/REVIEW.md\`

## Blocking Issues

${formatted_blocker_list}

## Required Actions

1. Fix all blocking issues listed above
2. Re-run \`/alpha:review ${specId}\`
3. Verify all issues resolved

---
*Generated by Alpha Review*
" \
    --label "alpha:review-blocker" \
    --label "priority:critical")

  echo "Created review issue: ${REVIEW_ISSUE}"

  # Link back to spec issue
  gh issue comment ${specId} \
    --repo slideheroes/2025slideheroes \
    --body "⚠️ **Blocking issues found:** See ${REVIEW_ISSUE} for required fixes."
fi
```

## Phase 8: Report Results

### Console Output

```
══════════════════════════════════════════════════════════════════════
   ALPHA REVIEW COMPLETE
══════════════════════════════════════════════════════════════════════

📋 Spec: S${specId} - ${spec_title}
📊 Level: ${reviewLevel}
✅ Status: ${success ? 'PASSED' : 'FAILED'}

📈 Results:
   Features Reviewed: ${features_reviewed}
   Features Passed: ${features_passed}
   Issues Found: ${total_issues} (${blocker_count} blockers)

📸 Screenshots: ${screenshot_count} captured
   Location: .ai/alpha/validation/S${specId}/review/

📄 Reports:
   JSON: .ai/alpha/validation/S${specId}/review-report.json
   Markdown: .ai/alpha/validation/S${specId}/REVIEW.md

🔗 GitHub:
   Spec Issue: #${specId} (updated with review comment)
   ${blocker_count > 0 ? `Review Issue: #${review_issue_number} (blocking issues)` : ''}

══════════════════════════════════════════════════════════════════════

${success ? '✅ Ready to merge!' : '❌ Fix blocking issues before merge.'}
```

### JSON Output (for automation)

Return valid JSON that can be parsed:

```json
{
  "success": true,
  "spec_id": "S1362",
  "review_level": "spec",
  "summary": "Review summary here...",
  "issues": {
    "blocker": 0,
    "tech_debt": 2,
    "skippable": 1,
    "total": 3
  },
  "reports": {
    "json": ".ai/alpha/validation/S1362/review-report.json",
    "markdown": ".ai/alpha/validation/S1362/REVIEW.md"
  },
  "github": {
    "spec_issue_updated": true,
    "review_issue_created": false
  }
}
```

## Review Success Criteria

**A review PASSES when:**
- No blocker-severity issues found
- All completed features meet their acceptance criteria
- Critical user flows work end-to-end
- No console errors on key pages

**A review FAILS when:**
- One or more blocker-severity issues found
- Critical functionality is broken
- Data loss or security issues detected

**Note:** Tech debt and skippable issues do NOT fail the review.

## Integration with Alpha Workflow

This command fits into the Alpha workflow after implementation:

```
Spec → Decompose → Implement → Review → (Refine if needed) → Merge
                      ↓           ↓
              /alpha:implement  /alpha:review
                                     ↓
                              /alpha:refine (if blockers found)
```

### Running Review After Orchestrator

```bash
# After orchestrator completes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Run review in the review sandbox (or locally)
/alpha:review 1362
```

### Future: Orchestrator Integration

The orchestrator can be extended to run review automatically:
```bash
tsx spec-orchestrator.ts 1362 --review
```

## Error Handling

**If spec manifest not found:**
- Error: "Spec manifest not found for S${specId}"
- Action: Ensure spec exists and has been decomposed

**If no completed features:**
- Error: "No completed features to review"
- Action: Run /alpha:implement first

**If dev server not accessible:**
- Warning: "Dev server not accessible, skipping visual verification"
- Action: Continue with code review only, or use --skip-screenshots

**If screenshot capture fails:**
- Warning: "Failed to capture screenshot: ${error}"
- Action: Continue, note in report that screenshots may be incomplete

## Arguments

Spec/Initiative/Feature ID: $ARGUMENTS
