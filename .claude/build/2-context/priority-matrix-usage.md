# Chunk Priority Matrix Usage Guide

## Overview

The Priority Matrix view in GitHub Projects is a critical tool for stakeholder validation and chunk prioritization during the AAFD v2.0 methodology. This view helps visualize and manage the relative priorities of technical chunks within a feature epic.

## Purpose

The Chunk Priority Matrix serves to:

- Visualize all chunks from an epic in a priority-based layout
- Facilitate stakeholder discussions about implementation order
- Track dependencies between chunks
- Support go/no-go decisions for chunk implementation

## Using the Priority Matrix

### During Stakeholder Validation (Phase 3)

1. **Access the Priority Matrix**

   - Navigate to the Feature Development project in GitHub
   - Select the "Priority Matrix" view from the view dropdown
   - Filter by parent epic if needed to focus on specific feature chunks

2. **Evaluate Chunks**

   - Review each chunk's position based on its Priority field
   - Consider the following factors:
     - Technical dependencies (Cross-cutting Dependencies field)
     - Business value and user impact
     - Implementation complexity
     - Resource availability

3. **Update Priorities**

   - Click on a chunk issue to edit
   - Update the Priority field based on stakeholder consensus:
     - **High**: Critical path, must be done first
     - **Medium**: Important but can be parallelized
     - **Low**: Nice-to-have or can be deferred
   - Add comments documenting priority rationale

4. **Identify Dependencies**
   - Review Cross-cutting Dependencies field
   - Ensure high-priority chunks don't depend on lower-priority ones
   - Document any blocking relationships in issue comments

### Priority Matrix Best Practices

1. **Regular Review**

   - Review priorities at the start of each sprint
   - Adjust based on completed work and new insights

2. **Stakeholder Alignment**

   - Use the matrix during stakeholder meetings
   - Screenshot or export the view for documentation

3. **Documentation**

   - Document priority decisions in chunk issue comments
   - Link to stakeholder feedback in validation documents

4. **Integration with Sprints**
   - High-priority chunks should be scheduled first
   - Consider chunk size when planning sprint capacity

## Fields Used in Priority Matrix

- **Priority**: Primary field for matrix positioning (High/Medium/Low)
- **AAFD Stage**: Track validation progress
- **Cross-cutting Dependencies**: Identify blocking relationships
- **Story Points**: Estimate implementation effort
- **Agent Assignment**: Track validation responsibility

## Automation Rules

The Priority Matrix integrates with GitHub Projects automation:

- Chunks inherit initial priority from parent epic
- Priority can be refined during validation
- Changes to priority trigger notifications to watchers
- Completed chunks automatically move to Done column

## Related Documentation

- `.claude/build/1-process/3-stakeholder-validation/stakeholder-validation-prompt.xml`
- `.claude/build/8-devops/methodology-design.md`
- `.claude/build/8-devops/process-summary.md`
