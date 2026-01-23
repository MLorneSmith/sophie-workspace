## ✅ Implementation Complete

### Summary
- Added "Frontend Task Skill Invocation" section to `/alpha:implement` with guidance on detecting frontend tasks and invoking skills
- Added "UI Task Flagging" section to `/alpha:task-decompose` with guidance for adding skill hints during task decomposition  
- Added `ui_task` and `skill_hints` optional fields to `tasks.schema.json`

### Files Changed
```
.ai/alpha/templates/tasks.schema.json              | 21 +++++-
.claude/commands/alpha/implement.md                | 73 ++++++++++++++++++++
.claude/commands/alpha/task-decompose.md           | 77 ++++++++++++++++++++++
3 files changed, 170 insertions(+), 1 deletion(-)
```

### Commits
```
60569c4a9 chore(tooling): add skill guidance to Alpha workflow commands
```

### Validation Results
✅ All validation commands passed successfully:
- ✓ Skill section added to implement.md
- ✓ UI flagging section added to task-decompose.md
- ✓ frontend-design skill referenced
- ✓ react-best-practices skill referenced
- ✓ implement.md is readable
- ✓ task-decompose.md is readable
- ✓ tasks.schema.json is valid JSON
- ✓ skill_hints field added to schema
- ✓ ui_task field added to schema

### Follow-up Items
- None - this is an additive change that is fully backward compatible

---
*Implementation completed by Claude*
