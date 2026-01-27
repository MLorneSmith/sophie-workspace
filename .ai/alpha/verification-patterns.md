# Alpha Workflow Behavioral Verification Patterns

This document provides a comprehensive guide to behavioral verification patterns used in the Alpha autonomous coding workflow to validate functional completeness of implemented code.

## Overview

Behavioral verification addresses a critical gap in traditional code validation: **TypeScript compiles** and **grep finds patterns**, but neither validates that code actually **works as intended**. This was exposed by the S1823 implementation where buttons rendered but had no click handlers.

### The Problem

Traditional verification commands only check syntax and presence:
- `pnpm typecheck` - Validates TypeScript compiles
- `grep -q 'pattern'` - Validates string exists in file

Neither validates:
- Buttons have working onClick handlers
- Forms have proper onSubmit handlers
- Environment variables degrade gracefully
- Links navigate to correct destinations

### The Solution

Behavioral verification patterns add a layer of functional validation that checks:
1. Interactive elements have handlers (not just presence)
2. Handlers are non-empty (not just defined)
3. Error handling follows graceful patterns
4. Navigation elements have proper targets

## Pattern Types

### 1. Button Handler Pattern (`button_handler`)

**Purpose**: Verify that Button components have non-empty onClick handlers.

**Detection Criteria**:
- Task creates or modifies Button components
- Button has user-facing action (Join, Submit, Save, Cancel, etc.)
- Button is not purely decorative

**Validation Regex**:
```regex
Button[^>]*onClick=\{[^}]+\}
```

**Verification Command**:
```bash
grep -Pzo 'Button[^<]*onClick=\{[^}]+\}' path/to/component.tsx
```

**Example - Correct**:
```tsx
<Button onClick={() => router.push(session.meetingUrl)}>
  <Video className="mr-1 h-4 w-4" />
  Join
</Button>
```

**Example - Incorrect** (will fail verification):
```tsx
<Button>
  <Video className="mr-1 h-4 w-4" />
  Join  {/* No onClick handler! */}
</Button>
```

**Task Definition**:
```json
{
  "id": "T6",
  "name": "Wire Join button to meeting URL",
  "action": { "verb": "Wire", "target": "Join button" },
  "behavioral_verification": {
    "patterns": [
      {
        "type": "button_handler",
        "target": "Join",
        "expected_action": "navigate to meeting URL",
        "file_path": "apps/web/...widget.tsx"
      }
    ]
  }
}
```

### 2. Environment Variable Graceful Pattern (`env_var_graceful`)

**Purpose**: Verify that optional environment variables use graceful degradation (warn/silent) instead of error logging.

**Detection Criteria**:
- Task involves external service integration
- Environment variable is checked at runtime
- Feature can function (degraded) without the variable

**Validation Regex** (positive - should match):
```regex
console\.warn|return null|return \[\]|return undefined
```

**Anti-Pattern Regex** (negative - should NOT match):
```regex
console\.error.*[A-Z_]+.*not set|throw.*[A-Z_]+.*missing
```

**Verification Commands**:
```bash
# Check for graceful handling (should pass)
grep -E 'console\.(warn|info)|return (null|\[\]|undefined)' path/to/loader.ts

# Check for non-graceful handling (should fail = no match)
! grep -E 'console\.error.*API_KEY|throw.*missing.*KEY' path/to/loader.ts
```

**Example - Correct**:
```typescript
export async function loadCoachingSessions(accountId: string) {
  if (!process.env.CALCOM_API_KEY) {
    console.warn('CALCOM_API_KEY not configured - coaching sessions disabled');
    return [];
  }
  // ... fetch sessions
}
```

**Example - Incorrect** (will fail verification):
```typescript
export async function loadCoachingSessions(accountId: string) {
  if (!process.env.CALCOM_API_KEY) {
    console.error('CALCOM_API_KEY is not set!');  // Uses error, not warn
    throw new Error('Missing required CALCOM_API_KEY');  // Throws instead of degrading
  }
  // ... fetch sessions
}
```

**Task Definition**:
```json
{
  "id": "T4",
  "name": "Create coaching sessions loader with graceful degradation",
  "action": { "verb": "Create", "target": "coaching loader" },
  "behavioral_verification": {
    "patterns": [
      {
        "type": "env_var_graceful",
        "target": "CALCOM_API_KEY",
        "file_path": "apps/web/...calcom.loader.ts"
      }
    ]
  }
}
```

### 3. Form Submission Pattern (`form_submission`)

**Purpose**: Verify that form components have proper onSubmit handlers.

**Detection Criteria**:
- Task creates or modifies form elements
- Form has user input that needs processing
- Form requires validation and submission logic

**Validation Regex**:
```regex
form[^>]*onSubmit=\{[^}]+\}|handleSubmit\(
```

**Verification Command**:
```bash
grep -E 'onSubmit=\{|handleSubmit\(' path/to/form.tsx
```

**Example - Correct**:
```tsx
<form onSubmit={handleSubmit(onSubmitBooking)}>
  <Input {...register('email')} />
  <Button type="submit">Book Session</Button>
</form>
```

**Example - Incorrect**:
```tsx
<form>  {/* No onSubmit handler! */}
  <Input name="email" />
  <Button type="submit">Book Session</Button>
</form>
```

### 4. Link Navigation Pattern (`link_navigation`)

**Purpose**: Verify that navigation elements have proper href or onClick navigation.

**Detection Criteria**:
- Task creates navigation links
- Links should navigate to different pages/routes
- Navigation is user-triggered

**Validation Regex**:
```regex
Link[^>]*href=|onClick=.*navigate|router\.push
```

**Verification Command**:
```bash
grep -E 'href="|onClick=.*navigate|router\.push' path/to/nav.tsx
```

### 5. Modal Trigger Pattern (`modal_trigger`)

**Purpose**: Verify that modal trigger elements have proper open state handlers.

**Detection Criteria**:
- Task creates modal/dialog components
- Trigger button should open the modal
- Modal state needs to be managed

**Validation Regex**:
```regex
onClick=.*setOpen|onClick=.*setIsOpen|DialogTrigger
```

**Verification Command**:
```bash
grep -E 'onClick=.*setOpen|onClick=.*setIsOpen|DialogTrigger' path/to/modal.tsx
```

## Task Decomposition Integration

### The Interactive Element Rule

When decomposing tasks with interactive elements, ALWAYS split into:

1. **Render Task** - Creates the visual element
2. **Wire Task** - Connects the element to its action

**Before (Problematic)**:
```json
{
  "id": "T5",
  "name": "Create session card with join and reschedule buttons",
  "verification_command": "grep -q 'upcomingSessions.map' file.tsx"
}
```
❌ Verification only checks mapping exists, not that buttons work!

**After (Correct)**:
```json
{
  "id": "T5",
  "name": "Create coaching session card layout",
  "verification_command": "grep -q 'CoachingSessionCard' file.tsx"
},
{
  "id": "T6",
  "name": "Wire Join button to meeting URL",
  "behavioral_verification": {
    "patterns": [{ "type": "button_handler", "target": "Join" }]
  },
  "dependencies": { "blocked_by": ["T5"] }
},
{
  "id": "T7",
  "name": "Wire Reschedule button to reschedule page",
  "behavioral_verification": {
    "patterns": [{ "type": "button_handler", "target": "Reschedule" }]
  },
  "dependencies": { "blocked_by": ["T5"] }
}
```
✅ Each interactive element has its own task with behavioral verification!

## Verification Execution

### When to Run

Behavioral verification runs:
1. After standard `verification_command` passes
2. Before marking task as completed
3. As part of the Alpha implement workflow

### Execution Order

```
1. Visual Verification (if requires_ui)
   └── Element exists and is visible

2. Behavioral Verification (if behavioral_verification defined)
   └── Element has functional handler

3. Standard Verification Command
   └── Typecheck and grep checks pass

4. Mark Task Complete
```

### Failure Handling

| Pattern Fails | Action | Retry? |
|---------------|--------|--------|
| button_handler | FAIL task | Yes (3 attempts) |
| form_submission | FAIL task | Yes (3 attempts) |
| env_var_graceful | FAIL task | Yes (3 attempts) |
| link_navigation | FAIL task | Yes (3 attempts) |
| modal_trigger | FAIL task | Yes (3 attempts) |

## Best Practices

### 1. Always Use Wire Tasks for Interactive Elements

Don't combine rendering and wiring in a single task.

### 2. Be Specific with Pattern Targets

```json
// ✅ Good - specific button text
{ "type": "button_handler", "target": "Join" }

// ❌ Bad - too generic
{ "type": "button_handler", "target": "button" }
```

### 3. Include File Paths

Always specify the file path to check:

```json
{
  "type": "button_handler",
  "target": "Join",
  "file_path": "apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx"
}
```

### 4. Combine with Visual Verification

For UI tasks, use both visual and behavioral verification:

```json
{
  "requires_ui": true,
  "visual_verification": {
    "route": "/home",
    "checks": [{ "command": "is visible", "target": "Join" }]
  },
  "behavioral_verification": {
    "patterns": [{ "type": "button_handler", "target": "Join" }]
  }
}
```

### 5. Document Expected Actions

Include `expected_action` for clarity:

```json
{
  "type": "button_handler",
  "target": "Join",
  "expected_action": "navigate to external meeting URL in new tab"
}
```

## Troubleshooting

### Pattern Not Matching

1. Check regex syntax (use `grep -P` for Perl regex)
2. Verify file path is correct
3. Check for multiline patterns (use `-z` flag)
4. Verify component naming matches target

### False Positives

If patterns match incorrect code:
1. Make target more specific
2. Add surrounding context to pattern
3. Use custom validation_command

### False Negatives

If patterns don't match correct code:
1. Check for alternative patterns (e.g., arrow functions vs function declarations)
2. Expand regex to cover variations
3. Add multiple patterns for same check

## Related Files

- `.ai/alpha/templates/tasks.schema.json` - Schema definitions for patterns
- `.claude/agents/alpha/task-decomposer.md` - Decomposition rules
- `.claude/commands/alpha/implement.md` - Execution workflow

---

*This documentation addresses the verification gap exposed by S1823 implementation and provides patterns to prevent similar issues in future Alpha workflow executions.*
