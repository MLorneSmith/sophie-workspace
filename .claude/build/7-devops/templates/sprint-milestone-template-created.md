# Sprint Milestone Template - Creation Summary

## What Was Created

### 1. Sprint Milestone GitHub Issue Template

**Location**: `.github/ISSUE_TEMPLATE/sprint-milestone.md`

This template provides a comprehensive structure for tracking sprint execution in GitHub Issues, including:

- **Sprint Overview**: Number, name, duration, and clear goal
- **Capacity Planning**: Total capacity, buffer, and committed points
- **Selected Stories**: Table tracking stories, points, priorities, and assignments
- **Dependencies & Risks**: Tracking external dependencies and mitigation strategies
- **Success Criteria**: Clear checklist for sprint completion
- **Implementation Schedule**: Week-by-week breakdown
- **Context Requirements**: Claude Code session preparation
- **Daily Tracking**: Space for daily standup notes
- **Sprint Metrics**: Velocity and completion tracking
- **Retrospective Notes**: What went well, improvements, action items

### 2. Updated Prompts

#### Updated: `create-sprints-prompt.xml`

- Added instructions to create Sprint Milestone issue using the new template
- Included steps to fill in all template sections
- Added linking to parent Epic issue
- Maintained existing GitHub milestone creation for backward compatibility

#### Updated: `execution-tracking-prompt.xml`

- Added step to update Sprint Milestone issue during story completion
- Added new Step 4 for Sprint Milestone Updates:
  - Daily standup notes updates
  - Story status tracking
  - Sprint-end metrics and retrospective

## Integration with AAFD Methodology

The Sprint Milestone Template integrates with the AAFD v2.0 methodology by:

1. **Tracking Sprint Execution**: Provides a central location for all sprint information
2. **Supporting Daily Check-ins**: Includes daily standup notes section
3. **Enabling Retrospectives**: Built-in retrospective notes section
4. **Context Management**: Links to Claude Code context requirements
5. **GitHub Projects Integration**: Works with existing automation and board structure

## Usage Instructions

### Creating a Sprint Milestone

1. Go to Issues → New Issue → Sprint Milestone
2. Fill in the template with:
   - Sprint number and descriptive name
   - 2-week duration with start/end dates
   - Clear, achievable sprint goal
   - Selected stories with points and assignments
   - Dependencies and risks
   - Implementation schedule

### During Sprint Execution

1. Update daily standup notes each day
2. Mark stories as completed in the tracking table
3. Update any blockers or risks as they arise
4. Track progress against success criteria

### Sprint Completion

1. Calculate final velocity metrics
2. Complete retrospective notes section
3. Create action items for next sprint
4. Link to next sprint milestone issue

## Benefits

1. **Centralized Sprint Tracking**: All sprint information in one place
2. **GitHub Projects Integration**: Works with existing automation
3. **Claude Code Friendly**: Clear context requirements section
4. **Metrics Tracking**: Built-in velocity and completion metrics
5. **Continuous Improvement**: Retrospective notes feed into methodology evolution

## Next Steps

1. Test the template with a pilot sprint
2. Gather feedback on template effectiveness
3. Refine based on actual usage
4. Consider automation for metric calculations
5. Integrate with GitHub Projects custom fields

---

_Created: 2025-06-17_
_Template Version: 1.0_
_AAFD Methodology Version: v2.0_
