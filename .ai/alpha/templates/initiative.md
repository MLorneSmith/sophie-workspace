```markdown
# Initiative: [Initiative Name]

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S[spec-#] |
| **Initiative ID** | S[spec-#].I[priority] |
| **Status** | Draft |
| **Estimated Weeks** | [X-Y] |
| **Priority** | [1-N] |

---

## Description
[2-3 sentences describing what this initiative delivers]

## Business Value
[Why this matters - what user/business outcome does it enable?]

---

## Scope

### In Scope
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]
- [ ] [Deliverable 3]

### Out of Scope
- [ ] [Explicitly excluded item 1]
- [ ] [Explicitly excluded item 2]

---

## Dependencies

### Blocks
- None / [S#.I# IDs this blocks]

### Blocked By
- None / [S#.I# IDs that must complete first]

### Parallel With
- [S#.I# IDs that can run simultaneously]

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low/Med/High | [Rationale] |
| External dependencies | Low/Med/High | [APIs, services] |
| Unknowns | Low/Med/High | [What we don't know] |
| Reuse potential | Low/Med/High | [Existing code to leverage] |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **[Feature Name]**: [Brief description]
2. **[Feature Name]**: [Brief description]
3. **[Feature Name]**: [Brief description]

### Suggested Order
[Priority sequence based on dependencies and value]

---

## Validation Commands
```bash
# Commands to verify initiative is complete
[validation command 1]
[validation command 2]
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
```
