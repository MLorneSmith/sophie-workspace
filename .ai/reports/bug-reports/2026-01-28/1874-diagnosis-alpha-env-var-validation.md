# Bug Diagnosis: Alpha Workflow Missing Environment Variable Validation

**ID**: ISSUE-1874
**Created**: 2026-01-28T11:00:00Z
**Reporter**: User
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha autonomous coding workflow (`spec.md`, `feature-decompose.md`, `task-decompose.md`) does not validate proposed environment variables against existing `.env` files. This causes the workflow to specify new variable names (e.g., `CAL_API_KEY`, `NEXT_PUBLIC_CAL_USERNAME`) when similar/correct ones already exist in `.env` (e.g., `CALCOM_API_KEY`, `NEXT_PUBLIC_CALCOM_COACH_USERNAME`). Implementation then fails or requires manual correction when environment variables don't match.

## Environment

- **Application Version**: Dev branch
- **Environment**: Development (Alpha workflow tooling)
- **Node Version**: v20+
- **Affected Workflow**: Alpha autonomous coding process

## Reproduction Steps

1. Run `/alpha:spec` for a feature requiring external service integration (e.g., Cal.com)
2. Run `/alpha:initiative-decompose` to create initiatives
3. Run `/alpha:feature-decompose` - observe that Step 1.6 extracts credentials from research but doesn't check `.env`
4. Run `/alpha:task-decompose` - observe that `required_env_vars` in `tasks.json` uses research-derived names
5. Attempt implementation - environment variables don't match actual `.env` configuration

## Expected Behavior

The Alpha workflow should:
1. Scan existing `.env` files for configured environment variables
2. Match proposed variables against existing ones (fuzzy matching for similar patterns)
3. Use existing variable names when matches are found
4. Only propose new variable names when no similar configuration exists

## Actual Behavior

The workflow:
1. Extracts environment variable names from research files (Step 1.6 in `feature-decompose.md`)
2. Uses those names verbatim in `feature.md` and `tasks.json`
3. Never validates against actual `.env` files
4. Results in mismatched variable names that cause implementation failures

## Diagnostic Data

### Evidence from S1864 Cal.com Integration

**Variables specified in tasks.json (from research):**
```
CAL_API_KEY
CAL_WEBHOOK_SECRET
NEXT_PUBLIC_CAL_USERNAME
NEXT_PUBLIC_CAL_EVENT_SLUG
```

**Actual variables in .env:**
```
CALCOM_API_KEY=cal_live_*****
NEXT_PUBLIC_CALCOM_COACH_USERNAME=slideheroes.com
NEXT_PUBLIC_CALCOM_EVENT_SLUG=60min
```

### Gap Analysis

| Research Says | Existing in .env | Match? |
|---------------|------------------|--------|
| `CAL_API_KEY` | `CALCOM_API_KEY` | No (wrong prefix) |
| `CAL_WEBHOOK_SECRET` | (not present) | N/A |
| `NEXT_PUBLIC_CAL_USERNAME` | `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | No (different name) |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Partial (slightly different) |

## Related Code

- **Affected Files**:
  - `.claude/commands/alpha/spec.md` - No .env validation step
  - `.claude/commands/alpha/feature-decompose.md` - Step 1.6 extracts but doesn't validate
  - `.claude/commands/alpha/task-decompose.md` - No validation before finalizing tasks.json

- **Specific Gaps**:
  - `feature-decompose.md:221-238` - Step 1.6 extracts credentials from research but has no validation
  - `task-decompose.md` - No environment variable validation section exists

## Related Issues & Context

### Direct Predecessors
- #1872 (OPEN): "Bug Diagnosis: S1864 Cal.com Integration Specifies Incorrect Environment Variables" - This is the symptom; current issue is the root cause in the workflow

### Same Component
- All specs created through Alpha workflow are potentially affected if they involve external service integrations

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Alpha workflow's feature decomposition command extracts environment variable names from research files without validating them against the project's actual `.env` configuration.

**Detailed Explanation**:

The workflow gap occurs in three places:

1. **`spec.md`** (Step 4.3): Launches research agents that document environment variables in research files, but never scans existing `.env` files to discover what's already configured.

2. **`feature-decompose.md`** (Step 1.6): Extracts credentials from research files and documents them in `feature.md`, but the step explicitly says "For each variable found" without any instruction to validate against existing configuration.

3. **`task-decompose.md`**: Creates `tasks.json` with `required_env_vars` metadata populated from feature.md, but has no validation step to ensure variable names match reality.

**Supporting Evidence**:
- `feature-decompose.md:221-238` contains Step 1.6 which extracts variables but has no validation logic
- S1864's `tasks.json` files contain incorrect variable names that don't match `.env`
- No `grep` or search command in any Alpha workflow file references `.env` files

### How This Causes the Observed Behavior

1. Research agent documents `CAL_API_KEY` based on Cal.com documentation
2. Feature decomposition copies this to `feature.md` without checking `.env`
3. Task decomposition copies to `tasks.json` metadata
4. Implementation agent uses wrong variable name
5. Code fails at runtime or requires manual correction

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct inspection of workflow files confirms no `.env` validation exists
- S1864 provides concrete evidence of the problem
- The fix locations are clearly identifiable in the workflow commands

## Fix Approach (High-Level)

Add a new Step 1.7 to `feature-decompose.md` after Step 1.6 that:

1. Scans all `.env*` files for existing environment variables
2. Matches proposed variables against existing ones using pattern matching
3. Creates a credential mapping table showing research → existing mappings
4. Updates feature documentation to use existing variable names
5. Adds validation to pre-completion checklist

Additionally, add validation in `task-decompose.md` before finalizing `tasks.json` to:
1. Verify all `required_env_vars` exist in `.env` or are marked as "needs configuration"
2. Alert if similar but non-matching variables are found

## Diagnosis Determination

The root cause is confirmed: The Alpha workflow commands lack environment variable validation steps. The fix requires adding validation logic to `feature-decompose.md` (Step 1.7) and `task-decompose.md` (pre-finalization validation).

## Additional Context

### Proposed Fix Details

**New Step 1.7 for `feature-decompose.md`:**
```markdown
#### Step 1.7: Validate Credentials Against Existing Environment

**CRITICAL**: Before documenting required credentials, check what already exists.

**Scan all .env files for matching patterns:**
```bash
# Search for variables matching the integration
grep -h "^[A-Z_]*=" .env .env.local apps/web/.env* 2>/dev/null | grep -i "<integration-keyword>" | cut -d= -f1 | sort -u
```

**Create a credential mapping table:**

| Research Says | Existing in .env | Action |
|---------------|------------------|--------|
| `CAL_API_KEY` | `CALCOM_API_KEY` | Use existing |
| `NEXT_PUBLIC_CAL_USERNAME` | `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Use existing |

**NEVER invent new variable names when similar ones already exist.**
```

**Pre-Completion Checklist Addition:**
```markdown
### Environment Variables
- [ ] All `required_env_vars` validated against actual `.env` files
- [ ] No duplicate/similar variable names proposed
- [ ] Variable naming follows project convention
```

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, prior conversation context*
