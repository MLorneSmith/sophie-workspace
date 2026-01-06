# Feature: [Feature Name]

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #{{INITIATIVE_NUM}} |
| **Feature ID** | {{INITIATIVE_NUM}}-F{{FEATURE_NUM}} |
| **Status** | Draft |
| **Estimated Days** | {{EST_DAYS}} |
| **Priority** | {{PRIORITY}} |

## Description
{{DESCRIPTION}}

## User Story
**As a** {{PERSONA}}
**I want to** {{ACTION}}
**So that** {{BENEFIT}}

## Acceptance Criteria

### Must Have
- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

### Nice to Have
- [ ] {{ENHANCEMENT_1}}

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | {{UI_COMPONENT}} | New / Existing / N/A |
| **Logic** | {{LOGIC_COMPONENT}} | New / Existing / N/A |
| **Data** | {{DATA_COMPONENT}} | New / Existing / N/A |
| **Database** | {{DB_COMPONENT}} | New / Existing / N/A |

## Architecture Decision

**Approach**: {{APPROACH}}
**Rationale**: {{RATIONALE}}

### Key Architectural Choices
1. {{CHOICE_1}}
2. {{CHOICE_2}}

### Trade-offs Accepted
- {{TRADEOFF_1}}

## Dependencies

### Blocks
- {{BLOCKS}}

### Blocked By
- {{BLOCKED_BY}}

### Parallel With
- {{PARALLEL_WITH}}

## Files to Create/Modify

### New Files
- `{{NEW_FILE_1}}` - {{PURPOSE_1}}

### Modified Files
- `{{MOD_FILE_1}}` - {{CHANGES_1}}

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **{{TASK_1}}**: {{TASK_DESC_1}}
2. **{{TASK_2}}**: {{TASK_DESC_2}}

### Suggested Order
{{TASK_ORDER}}

## Validation Commands
```bash
{{VALIDATION_COMMANDS}}
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
