# Bug Diagnosis: Alpha Orchestrator UI Event Log Shows Misleading Error Icons

**ID**: ISSUE-pending (will be updated after GitHub issue creation)
**Created**: 2026-01-29T15:30:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI displays misleading ❌ (error) icons for `documentation_start` events, making normal operations appear like errors. Additionally, the `review_sandbox_creating` event (using 📦 icon) may also appear confusing to users who expect the event log to only show errors with ❌ icons.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: v22+
- **Last Working**: N/A (cosmetic issue, not regression)

## Reproduction Steps

1. Run the Alpha spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1879`
2. Wait for implementation to complete
3. Observe the UI event log during the completion phase
4. Note the `documentation_start` event shows ❌ icon instead of 📚

## Expected Behavior

- `documentation_start` events should show 📚 (book) icon with blue color
- `review_sandbox_creating` events should show 📦 (package) icon with blue color
- Users should be able to distinguish between errors and normal operations at a glance

## Actual Behavior

- `documentation_start` events show ❌ (error) icon with red color because the event type is not in the `mapWebSocketToOrchestratorEventType` valid types array, causing it to fall back to `"error"` type
- This makes the UI appear as if there's an error when there isn't one

## Diagnostic Data

### Root Cause Analysis

The issue is in `.ai/alpha/scripts/ui/index.tsx` in the `mapWebSocketToOrchestratorEventType` function (lines 141-185):

```typescript
const mapWebSocketToOrchestratorEventType = useCallback(
  (eventType: string): OrchestratorEventType => {
    const validTypes: OrchestratorEventType[] = [
      // ... existing types ...
      "completion_phase_start",
      "sandbox_killing",
      "review_sandbox_creating",
      "review_sandbox_failed",
      "dev_server_starting",
      "dev_server_ready",
      "dev_server_failed",
      // MISSING: documentation event types!
    ];

    if (validTypes.includes(eventType as OrchestratorEventType)) {
      return eventType as OrchestratorEventType;
    }

    // Unknown event types are mapped to 'error' type for graceful handling
    return "error";  // <-- This is why documentation_start shows ❌
  },
  [],
);
```

**The following event types are missing from the `validTypes` array:**
- `"documentation_start"`
- `"documentation_complete"`
- `"documentation_failed"`

These are defined in `types.ts` (lines 241-243) and have proper icons/colors in `EventLog.tsx` (lines 49-51, 93-95), but the WebSocket event mapping function doesn't include them, so they fall back to `"error"` type.

### Screenshots
N/A - cosmetic issue

## Error Stack Traces
N/A - no errors, just incorrect icon mapping

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/ui/index.tsx` (lines 141-185)
  - `.ai/alpha/scripts/ui/components/EventLog.tsx` (lines 49-51, 93-95)
  - `.ai/alpha/scripts/ui/types.ts` (lines 241-243)
- **Recent Changes**: None - this has existed since the documentation event types were added
- **Suspected Functions**: `mapWebSocketToOrchestratorEventType`

## Related Issues & Context

### Direct Predecessors
None found - this is a new cosmetic bug

### Related Infrastructure Issues
- #1883: Added `review_sandbox_failed` event type to the valid types array (same pattern)

### Same Component
- The EventLog.tsx component correctly handles these types
- The types.ts correctly defines these types
- Only the WebSocket event mapping is missing them

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `documentation_start`, `documentation_complete`, and `documentation_failed` event types are missing from the `validTypes` array in the `mapWebSocketToOrchestratorEventType` function.

**Detailed Explanation**:
When a WebSocket event arrives with `event_type: "documentation_start"`, the mapping function checks if it's in the `validTypes` array. Since it's not included, the function returns `"error"` as the fallback type. This causes the EventLog component to render the event with the ❌ icon and red color instead of the intended 📚 icon and blue color.

**Supporting Evidence**:
- Line 227-229 in `index.tsx`: The `getOrchestratorEventMessage` function correctly handles these types
- Line 49-51 in `EventLog.tsx`: The `EVENT_ICONS` object correctly maps these types to icons
- Line 141-185 in `index.tsx`: The `validTypes` array is missing these types

### How This Causes the Observed Behavior

1. Orchestrator emits `documentation_start` event via WebSocket
2. `handleOrchestratorEvent` receives the event
3. `mapWebSocketToOrchestratorEventType("documentation_start")` is called
4. Event type is not in `validTypes`, so function returns `"error"`
5. EventLog renders with ❌ icon and red color from `EVENT_ICONS["error"]`

### Confidence Level

**Confidence**: High

**Reasoning**: The code path is clear and the missing types are obvious when comparing `validTypes` array with `OrchestratorEventType` in types.ts. This is a straightforward omission.

## Fix Approach (High-Level)

Add the missing documentation event types to the `validTypes` array in `mapWebSocketToOrchestratorEventType`:

```typescript
const validTypes: OrchestratorEventType[] = [
  // ... existing types ...
  "dev_server_ready",
  "dev_server_failed",
  // Add missing documentation types:
  "documentation_start",
  "documentation_complete",
  "documentation_failed",
];
```

## Diagnosis Determination

This is a cosmetic bug caused by incomplete event type mapping. The implementation is correct in all other components (types.ts, EventLog.tsx, getOrchestratorEventMessage), but the WebSocket event type validator is missing the documentation event types.

The fix is trivial: add three strings to an array.

## Additional Context

This same pattern was followed when adding `review_sandbox_failed` in Bug fix #1883, suggesting this is a recurring issue when new event types are added. Consider adding a lint rule or test to ensure all `OrchestratorEventType` values are included in the `validTypes` array.

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Task (perplexity-expert)*
