# Bug Diagnosis: S1864 Cal.com Integration Specifies Incorrect Environment Variables and Deprecated Atoms Approach

**ID**: ISSUE-1872
**Created**: 2026-01-28T10:30:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: integration

## Summary

The S1864 (User Dashboard) spec's coaching integration initiative (I4) incorrectly specifies Cal.com @calcom/atoms as deprecated and mandates environment variables that don't match the actual environment configuration. The research file (`context7-calcom.md`) incorrectly stated that `@calcom/atoms` is deprecated, when in fact it is the **Platform OAuth** that was deprecated. This led to tasks.json files specifying incorrect environment variable names and an unnecessarily complex integration approach.

## Environment

- **Application Version**: Dev branch
- **Environment**: Development
- **Node Version**: v20+
- **Spec ID**: S1864
- **Initiative Affected**: S1864.I4 (Coaching Integration)
- **Features Affected**: S1864.I4.F1, S1864.I4.F2, S1864.I4.F3, S1864.I4.F4

## Reproduction Steps

1. Run `/alpha:spec` and create S1864 User Dashboard spec
2. Run `/alpha:initiative-decompose` to decompose into initiatives
3. Run `/alpha:feature-decompose S1864.I4` for coaching integration
4. Run `/alpha:task-decompose S1864.I4` for tasks
5. Observe tasks.json files specify incorrect environment variables

## Expected Behavior

The Alpha workflow should correctly identify:
1. The actual environment variables already configured in `.env`
2. The correct Cal.com integration approach based on current API documentation
3. Accurate information about what is and isn't deprecated

## Actual Behavior

The workflow produced:

**Incorrect environment variables specified in tasks.json:**
- `CAL_API_KEY` (incorrect prefix - actual is `CALCOM_API_KEY`)
- `CAL_WEBHOOK_SECRET` (not currently needed for basic integration)
- `NEXT_PUBLIC_CAL_USERNAME` (incorrect - actual is `NEXT_PUBLIC_CALCOM_COACH_USERNAME`)
- `NEXT_PUBLIC_CAL_EVENT_SLUG` (correct name, exists in .env)

**Actual environment variables in .env:**
- `NEXT_PUBLIC_CALCOM_COACH_USERNAME=slideheroes.com`
- `NEXT_PUBLIC_CALCOM_EVENT_SLUG=60min`
- `CALCOM_API_KEY=cal_live_*****` (note: CALCOM_ prefix not CAL_)

**Incorrect deprecation claim:**
The research file stated `@calcom/atoms is deprecated` which is FALSE. According to:
- Cal.com official V2 API documentation: Platform OAuth is deprecated, not atoms
- npm registry: @calcom/atoms v1.10.0+ is actively maintained with React 19 support
- Weekly downloads: ~9,100 (actively used)

## Diagnostic Data

### Research File Analysis

The research file `.ai/alpha/specs/S1864-Spec-user-dashboard/research-library/context7-calcom.md` contains:

```
#### Option A: Cal.com Atoms (Recommended for React/Next.js)

The `@calcom/atoms` package provides React components for deep integration.
```

Yet the spec.md Decision Log states:
```
| 2026-01-27 | Use Cal.com embed script over @calcom/atoms | @calcom/atoms (Platform) is deprecated
```

This is a conflation of two different things:
1. `@calcom/atoms` - React component library (NOT deprecated)
2. Cal.com Platform OAuth - Managed user authentication (IS deprecated as of Dec 2025)

### Cal.com V2 API Introduction (Fetched)

```
**Platform OAuth (Deprecated):** As of December 15, 2025, no longer accepting
new signups for Platform plans, though enterprise support continues for existing customers.
```

The API key approach (`CALCOM_API_KEY`) is valid for fetching bookings.

### Environment Variable Comparison

| tasks.json Specified | Actual in .env | Match? |
|----------------------|----------------|--------|
| `CAL_API_KEY` | `CALCOM_API_KEY` | No (wrong prefix) |
| `CAL_WEBHOOK_SECRET` | (not present) | N/A |
| `NEXT_PUBLIC_CAL_USERNAME` | `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | No (different name) |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Yes |

## Error Stack Traces

N/A - This is a configuration/specification error, not a runtime error.

## Related Code

- **Affected Files**:
  - `.ai/alpha/specs/S1864-Spec-user-dashboard/spec.md` - Decision log claims atoms deprecated
  - `.ai/alpha/specs/S1864-Spec-user-dashboard/S1864.I4-Initiative-coaching-integration/initiative.md` - Scope mentions atoms deprecated
  - `.ai/alpha/specs/S1864-Spec-user-dashboard/S1864.I4-Initiative-coaching-integration/S1864.I4.F1-Feature-calcom-foundation/feature.md` - Wrong env var names
  - `.ai/alpha/specs/S1864-Spec-user-dashboard/S1864.I4-Initiative-coaching-integration/S1864.I4.F1-Feature-calcom-foundation/tasks.json` - Wrong env var names
  - `.ai/alpha/specs/S1864-Spec-user-dashboard/S1864.I4-Initiative-coaching-integration/S1864.I4.F4-Feature-booking-modal/tasks.json` - Wrong env var names
  - `.ai/alpha/specs/S1864-Spec-user-dashboard/research-library/context7-calcom.md` - Contains accurate atoms docs but misleading atoms deprecation note

## Related Issues & Context

### Historical Context

This is a new spec (S1864), so no prior related issues exist. However, the root cause is in the AI's research synthesis phase where it conflated:
- `@calcom/atoms` (React component library - NOT deprecated)
- Cal.com Platform (OAuth managed users - IS deprecated)

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Alpha workflow's research phase incorrectly identified `@calcom/atoms` as deprecated when it was actually the Cal.com Platform OAuth system that was deprecated, leading to incorrect environment variable specifications throughout the S1864.I4 initiative.

**Detailed Explanation**:

1. **Research Conflation**: During Context7 research, the agent retrieved Cal.com documentation that mentioned both:
   - `@calcom/atoms` package for React components
   - Platform OAuth deprecation (Dec 2025)

2. **Misattribution**: The deprecation notice for Platform OAuth was incorrectly attributed to `@calcom/atoms` in the spec's Decision Log, likely because both concepts appeared in the same research session.

3. **Environment Variable Drift**: Because the research file recommended atoms but the spec claimed atoms was deprecated, a different approach was designed requiring new environment variables with the `CAL_` prefix instead of matching the existing `CALCOM_` prefix variables already in `.env`.

4. **No Validation Against .env**: The task decomposition phase did not cross-check the specified `required_env_vars` against the actual `.env` file to validate correctness.

**Supporting Evidence**:
- Cal.com V2 API docs clearly state "Platform OAuth (Deprecated)" not "Atoms deprecated"
- npm @calcom/atoms shows v1.10.0+ with React 19 support and ~9,100 weekly downloads
- The research file `context7-calcom.md` contains accurate atoms documentation
- `.env` file contains `CALCOM_` prefixed variables, not `CAL_` prefixed

### How This Causes the Observed Behavior

1. Research phase → Incorrectly marked atoms as deprecated
2. Spec phase → Decision log encoded the incorrect deprecation claim
3. Initiative phase → Scope explicitly excluded atoms, recommending embed script
4. Feature phase → Designed around embed script approach
5. Task phase → Specified environment variables for embed script approach with wrong naming convention
6. Implementation would fail → Environment variables in tasks.json don't match actual `.env`

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from Cal.com V2 API documentation confirms Platform OAuth deprecation, not atoms
- npm registry confirms @calcom/atoms is actively maintained
- `.env` file inspection confirms variable naming mismatch

## Fix Approach (High-Level)

The fix requires updating S1864.I4 documentation to:

1. **Correct the deprecation claim**: `@calcom/atoms` is NOT deprecated; Cal.com Platform OAuth is deprecated
2. **Update environment variable names** in all tasks.json files to match actual `.env`:
   - `CAL_API_KEY` → `CALCOM_API_KEY`
   - `NEXT_PUBLIC_CAL_USERNAME` → `NEXT_PUBLIC_CALCOM_COACH_USERNAME`
   - Keep `NEXT_PUBLIC_CAL_EVENT_SLUG` as `NEXT_PUBLIC_CALCOM_EVENT_SLUG`
3. **Choose integration approach**: Either:
   - **Option A (Simple)**: Use vanilla embed script + V2 API (current plan, just fix env vars)
   - **Option B (Enhanced)**: Use `@calcom/embed-react` package for React integration
   - **Option C (Full)**: Use `@calcom/atoms` for full component library (more complex, not deprecated)

**Recommended**: Option A (vanilla embed script) is sufficient for the dashboard widget use case, but the environment variable names must be corrected.

## Diagnosis Determination

The root cause is confirmed: The Alpha workflow's spec phase incorrectly identified `@calcom/atoms` as deprecated when researching Cal.com integration, leading to specification of incorrect environment variable names throughout Initiative S1864.I4.

The fix is straightforward: Update the spec, initiative, feature, and tasks documentation to use the correct environment variable names that already exist in the `.env` file.

## Additional Context

### Recommended Environment Variable Updates

Files requiring `required_env_vars` corrections:

1. `S1864.I4.F1-Feature-calcom-foundation/tasks.json`
2. `S1864.I4.F4-Feature-booking-modal/tasks.json`

### Integration Approach Options

The simplest approach for the dashboard coaching widget:

1. **Fetching bookings**: V2 API with `CALCOM_API_KEY` (Bearer auth)
2. **Booking widget**: `@calcom/embed-react` or vanilla embed script
3. **Required env vars**:
   - `CALCOM_API_KEY` (server-only, for fetching bookings)
   - `NEXT_PUBLIC_CALCOM_COACH_USERNAME` (client-safe, for embed URL)
   - `NEXT_PUBLIC_CALCOM_EVENT_SLUG` (client-safe, for embed URL)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, WebFetch, Task (perplexity-expert)*
