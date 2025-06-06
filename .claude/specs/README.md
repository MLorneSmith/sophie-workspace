# SlideHeroes Feature Specifications

This directory contains feature specifications and design documents for SlideHeroes development.

## Directory Structure

```
.claude/specs/
├── features/
│   ├── template/           # Templates for creating new specs
│   ├── draft/             # Work-in-progress specifications
│   ├── approved/          # Reviewed and approved specifications
│   └── archived/          # Completed or cancelled specifications
└── README.md              # This file
```

## Feature Specification Lifecycle

### 1. Creation
```bash
/write-feature-spec feature-name
```
- Creates new spec in `draft/` folder
- Uses intelligent automation to gather requirements
- Generates comprehensive specification from template

### 2. Review & Approval
- Specs start in `draft/` status
- Team reviews and provides feedback
- Move to `approved/` when ready for implementation

### 3. Implementation
```bash
/build-feature feature-name
```
- Reads spec from `approved/` folder
- Implements feature according to specification
- Tracks progress with TodoWrite integration

### 4. Completion
- Move completed specs to `archived/` folder
- Keep for reference and lessons learned

## File Naming Convention

Use kebab-case for consistent naming:
- ✅ `user-onboarding-flow.md`
- ✅ `ai-presentation-builder.md`
- ✅ `team-collaboration-tools.md`
- ❌ `User_Onboarding_Flow.md`
- ❌ `ai-presentation_builder.md`

## Spec Status Management

### Moving Between Folders

**Draft → Approved:**
```bash
mv .claude/specs/features/draft/feature-name.md .claude/specs/features/approved/
```

**Approved → Archived:**
```bash
mv .claude/specs/features/approved/feature-name.md .claude/specs/features/archived/
```

### Status Tracking in Spec Files

Update the document metadata status field:
```markdown
| **Status** | `Draft/Review/Approved/In Development/Complete/Archived` |
```

## Integration with Development Workflow

### Feature Development Process
1. **Ideation** → Create draft spec with `/write-feature-spec`
2. **Planning** → Review and refine draft spec
3. **Approval** → Move to `approved/` folder
4. **Implementation** → Use `/build-feature` command
5. **Completion** → Move to `archived/` folder

### Quality Gates
- **Draft**: Basic requirements captured
- **Approved**: Technical architecture validated, security reviewed
- **Archived**: Feature implemented and deployed

## Best Practices

### For Spec Authors
- Use the automation features in `/write-feature-spec` to reduce manual work
- Include specific, testable acceptance criteria
- Consider security and performance requirements upfront
- Define measurable success metrics

### For Reviewers
- Validate business value and user impact
- Review technical architecture for scalability
- Ensure security requirements are comprehensive
- Verify implementation plan is realistic

### For Implementers
- Follow the spec closely but suggest improvements
- Update spec if requirements change during implementation
- Document any deviations or lessons learned

## Templates Available

### Feature Specifications
- **Location**: `template/feature-spec-template.md`
- **Use Case**: New product features and enhancements
- **Command**: `/write-feature-spec [name]`

### Design Specifications (Future)
- **Location**: `templates/design-spec-template.md`
- **Use Case**: UI/UX design requirements
- **Command**: `/write-design-spec [name]` (planned)

## Quick Reference

### Common Commands
```bash
# Create new feature spec
/write-feature-spec user-dashboard-redesign

# Build approved feature
/build-feature user-dashboard-redesign

# List all specs by status
ls .claude/specs/features/draft/
ls .claude/specs/features/approved/
ls .claude/specs/features/archived/
```

### Useful Searches
```bash
# Find specs containing specific terms
grep -r "authentication" .claude/specs/features/

# Find specs by author
grep -r "Author.*John" .claude/specs/features/

# Find specs by status
grep -r "Status.*Approved" .claude/specs/features/
```

## Maintenance

### Regular Cleanup
- Review old draft specs monthly
- Archive completed implementations
- Update template based on lessons learned

### Continuous Improvement
- Gather feedback on spec quality and usefulness
- Refine automation in `/write-feature-spec` command
- Update templates with new best practices