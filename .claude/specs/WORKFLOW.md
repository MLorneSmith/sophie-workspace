# SlideHeroes Feature Development Workflow

Complete workflow for feature development using Claude Code commands and intelligent specification management.

## Overview

The SlideHeroes feature development process uses a **specification-driven approach** with intelligent automation to ensure consistent, high-quality features that align with business goals and technical standards.

## Complete Workflow

### 1. Feature Specification Creation

```bash
/write-feature-spec [feature-name]
```

**What happens:**

- 🤖 **Smart Interview**: Targeted questions based on feature type
- 🔍 **Automated Analysis**: Scans codebase for patterns and architecture
- 🌐 **External Research**: Gathers best practices and security considerations
- 🧠 **Intelligent Synthesis**: Generates technical architecture and data models
- 📝 **Spec Generation**: Creates comprehensive specification in `draft/` folder

**Output:** Complete feature specification saved to `.claude/specs/features/draft/[name].md`

### 2. Specification Review & Management

```bash
# Check status and review
/manage-specs status [feature-name]

# List all draft specs
/manage-specs list draft

# Approve when ready
/manage-specs approve [feature-name]
```

**Review Checklist:**

- ✅ Business value clearly defined
- ✅ User stories have acceptance criteria
- ✅ Technical architecture is sound
- ✅ Security requirements comprehensive
- ✅ Implementation plan realistic

### 3. Feature Implementation

```bash
/build-feature [feature-name]
```

**What happens:**

- 📖 **Reads approved spec** from `.claude/specs/features/approved/`
- 🎯 **Creates implementation plan** with TodoWrite tracking
- 🏗️ **Implements in phases**: Foundation → Core → Security → Testing → Documentation
- ✅ **Validates completion** against acceptance criteria
- 📊 **Reports progress** and completion status

### 4. Completion & Archival

```bash
# Archive completed feature
/manage-specs archive [feature-name]
```

## Directory Structure

```
.claude/specs/features/
├── template/
│   └── feature-spec-template.md    # Template for new specs
├── draft/
│   ├── user-onboarding.md          # Work in progress
│   └── ai-chat-integration.md      # Under review
├── approved/
│   ├── team-dashboard.md           # Ready for implementation
│   └── billing-system.md           # Being implemented
└── archived/
    ├── user-authentication.md      # Completed features
    └── course-system.md             # Historical reference
```

## Status Lifecycle

```
Draft → Approved → Archived
  ↑         ↓
  ← Rollback ←
```

### Status Definitions

- **Draft**: Specification in development, not ready for implementation
- **Approved**: Reviewed and validated, ready for development
- **Archived**: Implementation complete, kept for reference

## Command Reference

### Primary Commands

| Command                        | Purpose                  | Input Required |
| ------------------------------ | ------------------------ | -------------- |
| `/write-feature-spec [name]`   | Create new specification | Feature name   |
| `/manage-specs approve [name]` | Move draft to approved   | Spec name      |
| `/build-feature [name]`        | Implement approved spec  | Spec name      |
| `/manage-specs archive [name]` | Archive completed spec   | Spec name      |

### Management Commands

| Command                       | Purpose                          | Input Required                    |
| ----------------------------- | -------------------------------- | --------------------------------- |
| `/manage-specs list [status]` | List specs by status             | Optional: draft/approved/archived |
| `/manage-specs status [name]` | Check spec location and metadata | Optional: spec name               |
| `/manage-specs draft [name]`  | Rollback approved to draft       | Spec name                         |

## Automation Features

### Intelligent Spec Generation

- **Pattern Detection**: Finds similar features in codebase
- **Architecture Suggestions**: Based on existing patterns + feature type
- **Security Templates**: Generates RLS policies and validation schemas
- **Risk Assessment**: Tailored to feature complexity
- **Implementation Planning**: Phased approach with realistic timelines

### Quality Assurance

- **Template Validation**: Ensures all required sections completed
- **Standards Compliance**: Follows SlideHeroes development patterns
- **Security Review**: RLS policies and input validation required
- **Testing Strategy**: Unit, integration, and E2E test plans

### Progress Tracking

- **TodoWrite Integration**: Real-time implementation progress
- **Status Updates**: Automatic metadata updates
- **Completion Validation**: Verification against acceptance criteria

## Best Practices

### For Product Managers

1. **Clear Problem Definition**: Start with specific user problems
2. **Measurable Success**: Define quantifiable success metrics
3. **User-Centered**: Focus on user value over technical features
4. **Iterative Approach**: Use draft → approved → implemented cycle

### For Engineers

1. **Follow the Spec**: Implement according to approved specifications
2. **Update as Needed**: Document any deviations or improvements
3. **Security First**: Implement all security requirements from spec
4. **Test Comprehensively**: Follow testing strategy in specification

### For Teams

1. **Regular Reviews**: Weekly review of draft and approved specs
2. **Clear Ownership**: Assign reviewers and implementers
3. **Feedback Loop**: Update templates based on lessons learned
4. **Documentation**: Keep specs current as implementation evolves

## Quality Gates

### Draft → Approved

- [ ] Business value clearly articulated
- [ ] User stories with testable acceptance criteria
- [ ] Technical architecture reviewed and approved
- [ ] Security requirements comprehensive
- [ ] Implementation plan realistic and phased
- [ ] Success metrics defined and measurable

### Approved → Implementation

- [ ] All stakeholders have reviewed and approved
- [ ] Dependencies identified and available
- [ ] Technical environment ready
- [ ] Team capacity allocated

### Implementation → Archived

- [ ] All acceptance criteria met
- [ ] Security requirements implemented
- [ ] Testing strategy executed
- [ ] Documentation updated
- [ ] Success metrics can be measured

## Troubleshooting

### Common Issues

**Spec not found during build:**

```bash
# Check location
/manage-specs status [name]

# Move from draft if needed
/manage-specs approve [name]
```

**Incomplete specification:**

```bash
# Review requirements
/manage-specs status [name]

# Edit the spec file directly or regenerate
/write-feature-spec [name] --interactive=true
```

**Implementation blockers:**

```bash
# Check dependencies in spec
/manage-specs status [name]

# Review technical requirements section
# Update spec if requirements changed
```

## Continuous Improvement

### Regular Maintenance

- **Monthly spec review**: Clean up old drafts, archive completed features
- **Template updates**: Enhance based on implementation feedback
- **Automation improvements**: Refine suggestion algorithms
- **Process optimization**: Streamline based on team feedback

### Metrics to Track

- **Spec-to-implementation accuracy**: How well specs predict actual implementation
- **Time savings**: Reduction in specification creation time
- **Quality improvements**: Fewer implementation issues with good specs
- **Team satisfaction**: Developer experience with specification quality

---

This workflow ensures consistent, well-planned feature development while leveraging automation to reduce manual effort and improve quality.
