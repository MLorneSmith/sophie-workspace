# Implementation Report: Alpha Workflow Missing Environment Variable Validation

**Issue**: #1875
**Type**: bug-fix
**Date**: 2026-01-28

## Summary

Added environment variable validation steps to the Alpha workflow command files to prevent misnamed variables from being specified during feature decomposition.

## Changes Made

### 1. feature-decompose.md

**Step 1.7: Validate Credentials Against Existing Environment Files**
- Added new step after Step 1.6 to validate proposed environment variables against actual .env files
- Includes bash grep command to scan all .env files for integration-specific variables
- Provides template for credential mapping table (proposed vs actual variable names)
- Added guidelines for using actual variable names vs proposing new ones

**Pre-Completion Checklist - Environment Variables**
- Added 6 checklist items to verify environment variable validation is complete
- Ensures credential mapping table is created
- Verifies no duplicate/conflicting variable names

### 2. task-decompose.md

**Pre-Finalization: Validate Environment Variables in tasks.json**
- Added validation step before finalizing tasks.json
- Includes bash command to extract variables from tasks.json
- Provides checklist for cross-referencing against feature-decompose research

**Pre-Completion Checklist**
- Added new section with environment variables, database tasks, and git commit checklists
- Ensures implementation agents receive correct variable names

## Files Changed

| File | Changes |
|------|---------|
| `.claude/commands/alpha/feature-decompose.md` | +39 lines (Step 1.7 + checklist) |
| `.claude/commands/alpha/task-decompose.md` | +44 lines (validation step + checklist) |

## Validation Results

All validation commands passed:
- Step 1.7 correctly identified in feature-decompose.md
- Environment variables checklist verified in feature-decompose.md
- Pre-finalization validation step verified in task-decompose.md
- Pre-completion checklist verified in task-decompose.md
- Bash grep command tested with `calcom` - correctly identifies:
  - `CALCOM_API_KEY`
  - `NEXT_PUBLIC_CALCOM_COACH_USERNAME`
  - `NEXT_PUBLIC_CALCOM_EVENT_SLUG`

## Commit

```
fix(tooling): add environment variable validation to Alpha workflow

Commit: 2f645b50c
```

## Follow-up Items

None required. The fix is complete and works as expected.

---
*Implementation completed by Claude*
*Based on bug plan: #1875*
