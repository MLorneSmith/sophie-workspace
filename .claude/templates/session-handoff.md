# Session Handoff Template

## Quick Context Load

- Story: #{id} - {title}
- Last session: {date}
- Current phase: {Implementation/Testing/Review}

## Current State

- **Active Task**: {What you're working on right now}
- **Files Open**: {Files currently being modified}
- **Test Status**: {X passing, Y failing, Z not written}
- **Uncommitted Changes**: {git status summary}

## Immediate Next Action

- **Task**: {Exact next step}
- **Approach**: {How to do it}
- **Success Criteria**: {How to know it's done}
- **Time Estimate**: {Expected duration}

## Context for Resume

### Files to Read

- Primary: `{most-important-file}`
- Context: `{related-files}`
- Tests: `{test-files}`

### Commands to Run

```bash
# Check current state
git status
pnpm test {specific-test}

# Quick validation
pnpm typecheck
```

### Key Decisions This Session

- **{Decision}**: {Reasoning}
- **{Technical Choice}**: {Why this approach}

## Blockers/Questions

- **{Blocker}**: {Description and current status}
- **{Question}**: {What needs to be researched}

## Session End Checklist

- [ ] Work committed or changes documented
- [ ] Progress file updated
- [ ] Next action clearly defined
- [ ] Tests still passing
- [ ] No console.logs left
