---
name: Sprint Milestone
about: Track sprint execution and delivery for AAFD methodology
title: 'Sprint [NUMBER]: [NAME]'
labels: ['sprint', 'milestone', 'AAFD']
assignees: ''
---

## Sprint Overview

**Sprint Number**: Sprint [NUMBER]
**Sprint Name**: [Descriptive name aligned with business goal]
**Duration**: [Start Date] - [End Date] (2 weeks)
**Sprint Goal**: [One clear, achievable goal statement]

## Capacity Planning

**Total Capacity**: [X] story points
**Buffer**: [Y] points (for bugs/unexpected work)
**Committed**: [Z] points

## Selected Stories

| Story                    | Points   | Priority   | Assignee    | Status         |
| ------------------------ | -------- | ---------- | ----------- | -------------- |
| #[Issue] - [Story Title] | [Points] | [Priority] | [Agent/Dev] | 🔵 Not Started |
| #[Issue] - [Story Title] | [Points] | [Priority] | [Agent/Dev] | 🔵 Not Started |

## Dependencies & Risks

### Dependencies

- [ ] [External dependency or blocker]
- [ ] [Cross-team coordination needed]

### Risks

- **[Risk Name]**: [Description] - Mitigation: [Approach]

## Success Criteria

- [ ] All committed stories meet acceptance criteria
- [ ] Test coverage maintained/improved
- [ ] No critical bugs in production
- [ ] Sprint goal achieved

## Implementation Schedule

### Week 1

- **Focus**: [Primary objectives for week 1]
- **Stories**: [Story IDs planned for week 1]

### Week 2

- **Focus**: [Primary objectives for week 2]
- **Stories**: [Story IDs planned for week 2]

## Context Requirements

### For Claude Code Sessions

- **Primary Role**: [AI Engineer/UI Engineer/Data Engineer]
- **Key Context Files**:
  - `.claude/contexts/sprint-[number]/`
  - Related epic context
- **Testing Focus**: [TDD approach for this sprint]

## Daily Tracking

### Daily Standup Notes

<!-- Update daily during sprint execution -->

#### Day 1 - [Date]

- **Progress**:
- **Blockers**:
- **Next**:

<!-- Continue for each day -->

## Sprint Metrics

<!-- Update at sprint end -->

- **Velocity**: [Completed points] / [Committed points]
- **Stories Completed**: [X] / [Y]
- **Bugs Found**: [Number]
- **Technical Debt**: [Added/Reduced]

## Retrospective Notes

<!-- Complete after sprint -->

### What Went Well

-

### What Could Improve

-

### Action Items

- [ ]

---

## Sprint Metadata

- **Epic**: #[Parent Epic Issue]
- **Project Board**: [Link to GitHub Project]
- **Previous Sprint**: #[Previous Sprint Issue]
- **Next Sprint**: #[Next Sprint Issue]

## Automation Instructions

<!-- For GitHub Projects automation -->

- **Board Movement**: Stories auto-move based on PR status
- **Status Updates**: Update story issues with sprint progress
- **Completion**: Close milestone when all stories done
