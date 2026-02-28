# GitHub Feature Issue Template

_Used by Sophie when creating feature issues from a Rabbit Plan spec. Each feature becomes one GitHub Issue on slideheroes/2025slideheroes._

---

## Template

```markdown
## Problem

[1-2 sentences: what specific pain does this feature solve?]

## User Story

**As a** [persona], **I want** [specific action], **so that** [outcome].

## User Experience

1. [Step 1: what user sees/does]
2. [Step 2: system response]
3. [Step 3: next user action]
4. [Step 4: final state]

## Acceptance Criteria

- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Edge case handling]

## Visual Reference

[For UI features: ASCII mockup, description, or "See parent spec #NNN, Section 6"]
[For backend features: "N/A — backend only"]

## Scope

**In:** [What this feature includes]
**Out:** [What's explicitly excluded from this feature]

## Context

- **Parent Spec:** #[spec-issue-number]
- **Feature:** F[N] of [total] in spec
- **Priority:** [N] (1 = highest)
- **Dependencies:** [#issue-numbers or "None"]
- **Estimated Size:** [3-10] days
```

---

## Labels To Apply

- `type:feature`
- `plan-me` (triggers CodeRabbit auto-planning)

---

## Title Format

```
[Feature] <descriptive name>
```

Examples:
- `[Feature] PPTX export for presentations`
- `[Feature] Template gallery with preview`
- `[Feature] Real-time collaboration cursors`

---

## Notes for Sophie

1. **Write for a newcomer.** The issue should make sense to someone who has never seen the codebase. CodeRabbit will map it to files and patterns.
2. **Include examples when possible.** If there's a specific interaction pattern or behavior, describe it concretely.
3. **Don't specify implementation.** No file paths, no component names, no architecture decisions. That's CodeRabbit's job.
4. **Link dependencies.** If F3 depends on F1, reference the F1 issue number in the Dependencies field.
5. **Copy acceptance criteria** from the parent spec's feature breakdown, then expand with feature-specific details.
