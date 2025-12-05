# Feature: Create Feature-Set Slash Command for Complex Initiative Decomposition

## Feature Description

The `/feature-set` slash command enables developers to break down large, complex multi-feature initiatives into manageable, independently implementable features. This command analyzes high-level work requests, decomposes them into logical feature boundaries, maps dependencies, and creates a coordinated execution plan that integrates seamlessly with the existing `/feature` → `/implement` workflow.

Currently, when faced with complex work that spans multiple system components, developers must manually identify feature boundaries, track dependencies, and sequence implementation. The `/feature-set` command automates this strategic decomposition process, reducing planning time by 40-60% while ensuring no work is missed and dependencies are properly identified.

## User Story

As a **software engineer or project lead**
I want to **submit a complex initiative and receive a decomposed set of features**
So that **I can implement large bodies of work systematically without creating artificial feature boundaries or missing critical dependencies**

## Problem Statement

Complex initiatives (e.g., "build real-time collaboration system", "migrate authentication system", "add advanced reporting") currently require:

1. **Manual decomposition**: Engineers must mentally break down the work into features
2. **Scattered planning**: Multiple feature plans created independently without explicit dependency tracking
3. **Sequencing uncertainty**: Unclear which features can run in parallel vs. must be sequential
4. **Risk of gaps**: Easy to miss work or create misaligned feature boundaries
5. **Coordination overhead**: Each feature plan lacks visibility into the broader initiative context

This leads to:
- Longer planning cycles (multiple iterations to get boundaries right)
- Suboptimal sequencing (sequential work forced into parallel streams)
- Rework when features overlap unexpectedly
- Difficulty explaining the overall initiative structure to stakeholders

## Solution Statement

The `/feature-set` command will:

1. **Analyze the initiative** using interactive discovery to understand scope, constraints, and success criteria
2. **Decompose intelligently** into 3-8 logical features based on system architecture patterns and domain boundaries
3. **Map dependencies** explicitly, identifying which features must complete before others
4. **Create a master plan** document (`.ai/specs/feature-sets/[name]/overview.md`) with:
   - Executive summary of the initiative
   - List of identified features with descriptions
   - Dependency graph (visual or list format)
   - Implementation phases and sequencing
   - Overall success criteria and risk assessment
5. **Generate feature stubs** for each identified feature ready for `/feature` command
6. **Create GitHub issues** linking all features to the master feature set
7. **Enable parallel execution** with explicit coordination points

The workflow becomes:

```
/feature-set "complex initiative"
    ↓ Analysis & Decomposition
Master Plan + Feature Stubs
    ↓ User review & approval
For each feature:
    /feature [feature-name]
    ↓ Creates detailed plan
    /implement [issue-number]
    ↓ Executes plan
```

## Relevant Files

### Existing Files to Reference

- `.claude/commands/feature.md` - Existing feature planning command structure (PRIME framework, GitHub integration)
- `.claude/commands/implement.md` - Implementation command pattern to understand full workflow
- `.old.claude/commands/features/1-discover.md` - Discovery patterns for adaptive research depth
- `.old.claude/commands/features/1-spec.md` - Specification generation patterns
- `.old.claude/commands/features/2-analyze.md` - Parallelization analysis patterns
- `.claude/config/command-profiles.yaml` - Routing configuration format and structure
- `.ai/specs/` - Directory where feature set plans will be stored
- `CLAUDE.md` - Project development standards and patterns

### New Files to Create

- `.claude/commands/feature-set.md` - Main command definition with PRIME framework implementation
- `.claude/config/command-profiles.yaml` - Add `feature-set` profile with keyword routing rules
- `.ai/ai_docs/context-docs/development/feature-set-workflow.md` - Documentation on feature set usage

## Impact Analysis

### Dependencies Affected

- **`.claude/commands/`**: Adding new slash command in this directory
- **`.claude/config/command-profiles.yaml`**: Adding feature-set routing profile
- **`.ai/specs/`**: New subdirectory structure `feature-sets/[name]/`
- **`.ai/ai_docs/context-docs/`**: New documentation for feature-set patterns

No changes required to:
- Core application code (`apps/web`, `apps/payload`)
- Existing commands (`/feature`, `/implement`, `/diagnose`, etc.)
- Database or backend infrastructure

### Risk Assessment

**Low Risk**

Reasons:
- Isolated changes to AI workflow system only
- No impact to application code or infrastructure
- Follows established patterns from existing commands (feature.md, diagnose.md)
- Non-breaking enhancement to existing workflow
- Can be tested standalone without affecting other commands
- Graceful degradation: if feature-set fails, users fall back to current manual planning

### Backward Compatibility

**Fully compatible**

- Existing `/feature` and `/implement` commands continue unchanged
- Feature sets are optional; complex work can still be planned with `/feature` directly
- No breaking changes to any existing functionality
- Feature set integration with `/feature` is unidirectional (sets point to features, not vice versa)

### Performance Impact

**Positive impact on workflow**

- Reduces planning time for complex initiatives by 40-60%
- Enables better parallelization (fewer false sequential dependencies)
- Improves feature boundary clarity (clearer scope per feature)
- Reduces rework and mid-implementation adjustments

No negative performance impacts:
- Command execution is local analysis only (no API calls except GitHub)
- Token usage optimized via conditional documentation routing
- Parallel execution of analysis phases

### Security Considerations

- No new authentication requirements (uses existing GitHub CLI authentication)
- No new data access (reads existing project structure and documentation)
- GitHub issue creation uses standard gh CLI with existing permissions
- No exposure of API keys or secrets
- All output remains within project directory structure

## Pre-Feature Checklist

Before starting implementation:
- [ ] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/feature-set-slash-command`
- [ ] Review existing similar commands (feature.md, diagnose.md) for patterns
- [ ] Identify all integration points (command-profiles.yaml, GitHub creation)
- [ ] Define success metrics (command works, produces valid output, integrates with /feature)
- [ ] Confirm feature doesn't duplicate existing functionality
- [ ] Verify all required tools are available (Read, Write, Bash, Task, gh)
- [ ] Plan GitHub issue structure for linking features to feature sets

## Documentation Updates Required

- **CLAUDE.md**: Add section on `/feature-set` command, when to use it vs `/feature`
- **`.ai/ai_docs/context-docs/development/feature-set-workflow.md`**: Comprehensive guide on using feature-set command
- **Command inline help**: Include usage examples and output format in command definition
- **`.claude/config/README.md`**: Document feature-set command profile additions

## Rollback Plan

To disable the feature-set command:

1. **Immediate rollback**: Remove `.claude/commands/feature-set.md` file
2. **Config cleanup**: Remove `feature-set` profile from `.claude/config/command-profiles.yaml`
3. **Documentation**: Remove feature-set references from CLAUDE.md
4. **No migration needed**: Feature sets are standalone; removing command has no impact on existing work

Graceful degradation:
- Users simply use `/feature` directly for complex work instead of `/feature-set`
- Existing feature-sets can still be manually managed using their GitHub issue links
- No data loss or state issues

Monitoring:
- Track usage of `/feature-set` command via slash command logs
- Monitor GitHub labels to detect incomplete feature sets
- Watch for feature implementation patterns that suggest decomposition problems

## Implementation Plan

### Phase 1: Foundation & Structure

Establish the command scaffold, configuration, and basic execution framework. This phase creates the skeleton that will be filled in with intelligent analysis logic.

### Phase 2: Core Decomposition Engine

Build the main analysis and decomposition logic. This phase implements the algorithm that breaks complex initiatives into coherent feature boundaries and identifies dependencies.

### Phase 3: Integration & Polish

Integrate with GitHub, existing commands, and workflow. This phase ensures the feature-set command fits seamlessly into the existing planning ecosystem.

## Step by Step Tasks

### Step 1: Set up Feature-Set Command Scaffold

Create the `.claude/commands/feature-set.md` file with PRIME framework structure:

- **Frontmatter**: Define command metadata (model: sonnet, allowed-tools)
- **PURPOSE section**: Define clear objectives for feature set decomposition
- **ROLE section**: Establish AI expertise in feature decomposition and architecture
- **INPUTS section**: Define how to gather initiative context and parse arguments
- **METHOD section**: Outline the decomposition algorithm and analysis process
- **EXPECTATIONS section**: Define output format and validation criteria

**Deliverable**: `.claude/commands/feature-set.md` with complete PRIME framework (boilerplate and structure, logic to be filled in next phase)

**Success criteria**: File exists, is syntactically correct markdown, follows PRIME format of existing commands

### Step 2: Create Decomposition Algorithm

Implement the intelligent feature decomposition logic within the METHOD section:

- **Discovery phase**: Interactive interview to gather initiative context, constraints, success criteria
- **Analysis phase**: Analyze initiative scope and identify natural feature boundaries based on:
  - System architecture layers (database, service, API, UI)
  - Domain boundaries (auth, content, billing, etc.)
  - Component separation patterns from existing codebase
  - Existing feature patterns in the project
- **Dependency mapping**: Create explicit dependency graph showing:
  - Sequential dependencies (must complete before)
  - Parallel opportunities (can run simultaneously)
  - Shared resources and coordination points
- **Sequencing**: Group features into implementation phases
- **Validation**: Ensure decomposition is complete and logical

**Deliverable**: Detailed algorithm logic in METHOD section with step-by-step instructions

**Success criteria**: Algorithm produces 3-8 coherent features per initiative, dependencies are accurate, phases are logically sequenced

### Step 3: Add Command Profile Configuration

Update `.claude/config/command-profiles.yaml`:

- Add `feature-set` profile with description
- Define rules for keyword matching (decomposition, architecture, workflow, integration, system)
- Set appropriate priorities for documentation loading
- Add categories for common initiative types (full-stack, infrastructure, migration, workflow)
- Reference PRIME framework and architecture overview as defaults

**Deliverable**: New `feature-set` profile in command-profiles.yaml following existing patterns

**Success criteria**: Profile is valid YAML, includes high/medium/low priority rules, enables conditional routing

### Step 4: Create Output Plan Format

Define the master feature set plan markdown format in EXPECTATIONS section:

- Frontmatter with metadata (name, description, features_count, created date)
- Executive Summary section
- Problem Statement section
- Feature Breakdown section (each feature with purpose, dependencies, sequence, effort estimate)
- Dependency Graph section (visual or list of explicit dependencies)
- Implementation Strategy section (phases, why that ordering)
- Success Criteria section
- Risk Assessment section
- Next Steps section

Include template example showing expected output structure

**Deliverable**: Complete plan format specification in EXPECTATIONS section

**Success criteria**: Format covers all necessary information, is comprehensive but not excessive, matches existing plan formats in project

### Step 5: Implement GitHub Integration

Add GitHub issue creation logic to EXPECTATIONS section:

- Create master feature set issue with:
  - Title: "Feature Set: [Name]"
  - Body: Full overview from plan
  - Labels: feature-set, strategic-planning, ready-to-implement
- Create individual GitHub issues for each identified feature with:
  - Title: "Feature: [Feature Name]"
  - Body: Feature description from the set
  - Labels: feature, from-feature-set, [priority]
- Add GitHub issue links in master plan for traceability
- Document the GitHub issue creation process

**Deliverable**: GitHub integration logic in EXPECTATIONS section

**Success criteria**: Master and feature issues are created correctly, links are established, labels are applied

### Step 6: Add Interactive Discovery Dialog

Implement the user interview phase in INPUTS section:

Create questions to gather:
- **Initiative summary**: High-level description of what's being built
- **Problem statement**: What problem does this solve
- **Scope and constraints**: Boundaries, technical constraints, external dependencies
- **Success criteria**: How we'll measure if this initiative is successful
- **Integration points**: Which existing systems does this connect to
- **Timeline**: Expected overall timeline
- **Risks and concerns**: Known risks or blockers

Store responses for use in decomposition algorithm

**Deliverable**: Interactive discovery questions and response handling in INPUTS section

**Success criteria**: Interview gathers sufficient context for intelligent decomposition, responses are captured for analysis

### Step 7: Create Feature-Set Workflow Documentation

Create `.ai/ai_docs/context-docs/development/feature-set-workflow.md`:

- Document when to use `/feature-set` vs `/feature` directly
- Provide workflow examples (e.g., real-time collaboration system decomposition)
- Show dependency graph examples
- Explain the master plan structure
- Document integration with `/feature` and `/implement` commands
- Include troubleshooting guide (what to do if decomposition isn't right)

**Deliverable**: Complete documentation file with examples and guidance

**Success criteria**: Documentation is clear, comprehensive, helps users understand and use the feature effectively

### Step 8: Update CLAUDE.md with Feature-Set Guidance

Add section to CLAUDE.md project guide:

- Brief description of `/feature-set` command
- When to use it (complex initiatives, 3+ features, high dependency complexity)
- When to use `/feature` directly instead (simple, well-defined features)
- Decision matrix or guidance
- Link to full documentation

**Deliverable**: New section in CLAUDE.md

**Success criteria**: Guidance is clear, helps developers choose the right tool for their situation

### Step 9: Create Test Feature Sets

Develop test cases to validate the feature-set command:

Test case 1: **Real-time collaboration system**
- Complex initiative spanning database, service, API, UI
- Multiple inter-dependent features
- Expected outcome: 5-6 features with clear dependencies

Test case 2: **Payment system integration**
- Integration feature set with external service
- Security and compliance considerations
- Expected outcome: 3-4 features with sequential requirements

Test case 3: **Search infrastructure upgrade**
- Infrastructure-focused decomposition
- Performance optimization concerns
- Expected outcome: 4-5 features with parallelizable work

For each test case:
- Run `/feature-set` with the initiative description
- Validate output structure and completeness
- Verify GitHub issues are created correctly
- Check that `/feature` can be used on the generated features

**Deliverable**: Test cases with expected outputs, validation reports

**Success criteria**: All test cases produce reasonable decompositions, output is valid, GitHub integration works

### Step 10: Implement Conditional Documentation Routing

Add feature-set routing to conditional documentation system:

- Update command-profiles.yaml routing rules for feature-set command
- Ensure architecture-overview.md is loaded as default
- Configure keyword matching for common initiative types
- Test routing with sample initiatives

**Deliverable**: Feature-set routing configuration in command-profiles.yaml

**Success criteria**: Conditional routing works correctly, relevant documentation is loaded for different initiative types

### Step 11: Add Error Handling and Validation

Implement robust error handling in METHOD section:

- Validate initiative name format (kebab-case, reasonable length)
- Handle edge cases (too-simple initiatives, overly complex, unclear requirements)
- Provide helpful error messages guiding users to provide better context
- Handle GitHub API errors gracefully
- Validate decomposition results (correct number of features, valid dependencies)

Include error recovery procedures:
- Suggestions for better initiative descriptions
- Guidance on decomposition adjustments
- Steps to manually correct feature boundaries if needed

**Deliverable**: Complete error handling in METHOD section

**Success criteria**: Command handles errors gracefully, users get helpful guidance on how to fix issues

### Step 12: Create Comprehensive Help and Examples

Add detailed help section to EXPECTATIONS:

- Usage examples: `/feature-set "real-time collaboration system"`
- Example output showing master plan structure
- Show how to proceed from feature-set to individual features
- Include tips for best decomposition results
- Link to documentation

**Deliverable**: Help section in EXPECTATIONS with examples

**Success criteria**: Users can understand command purpose and usage from help alone

### Step 13: Run Validation Commands

Execute all validation to ensure feature-set command works correctly:

- **Syntax validation**: Ensure command markdown is valid, YAML is correct
- **Routing validation**: Test conditional documentation routing
- **GitHub integration test**: Create test issues and verify correct structure
- **Workflow validation**: Run through complete workflow: `/feature-set` → `/feature` → `/implement`
- **Documentation validation**: Verify all docs are accurate and complete
- **Manual testing**: Run test cases from Step 9, validate outputs

Commands to execute:
```bash
# Validate YAML syntax
yamllint .claude/config/command-profiles.yaml

# Validate command markdown structure
grep -E "^##|^---" .claude/commands/feature-set.md

# Test conditional routing
# (Manual test by running conditional_docs with feature-set)

# Test GitHub integration
# (Create test issue to verify correct format)

# Syntax check on documentation
# (Verify all .md files have correct formatting)
```

**Deliverable**: Test results showing all validations pass

**Success criteria**: No syntax errors, all functionality works as expected, documentation is accurate

## Testing Strategy

### Unit Tests

While slash commands aren't traditional units, we validate:

- **Decomposition algorithm**: Test with various initiative descriptions
  - Complex initiatives produce 3-8 features
  - Dependencies are correctly identified
  - Phase sequencing is logical

- **GitHub integration**: Test issue creation
  - Issues are created with correct format
  - Labels are applied correctly
  - Links between master and feature issues work

- **Output generation**: Test plan format
  - All required sections present
  - No placeholder content
  - Markdown is valid

### Integration Tests

- **Full workflow**: `/feature-set` → create issues → use `/feature` on generated features → run `/implement`
- **GitHub integration**: Issues created correctly, labels applied, links functional
- **Conditional routing**: Feature-set routing loads appropriate documentation
- **Error handling**: Command gracefully handles edge cases and provides guidance

### E2E Tests

- **Real initiative**: Run `/feature-set` on actual complex initiative from backlog
- **User workflow**: Developer uses command start-to-finish, implements resulting features
- **Feedback loop**: Users verify decomposition quality and adjust if needed

### Edge Cases

- Very simple initiatives (should suggest using `/feature` instead)
- Overly complex initiatives (should break into logical phases)
- Unclear problem statements (should prompt for clarification)
- Initiatives with many external dependencies
- Single-feature initiatives that shouldn't be feature sets
- Circular dependency detection (invalid decomposition)

## Acceptance Criteria

1. **Command works**: `/feature-set "[initiative]"` executes without errors
2. **Produces master plan**: Creates `.ai/specs/feature-sets/[name]/overview.md` with all required sections
3. **Identifies features**: Decomposes into 3-8 coherent features with clear descriptions
4. **Maps dependencies**: Explicit dependency graph showing sequential and parallel work
5. **Creates GitHub issues**: Master feature-set issue + individual feature issues with correct labels and links
6. **Integrates with workflow**: Features created are ready for `/feature` command to expand into detailed plans
7. **Documentation complete**: CLAUDE.md and feature-set-workflow.md are comprehensive and clear
8. **Error handling**: Command handles edge cases gracefully with helpful guidance
9. **Test cases pass**: All three test initiatives decompose reasonably
10. **No regressions**: Existing commands (`/feature`, `/implement`, etc.) continue to work unchanged

## Validation Commands

Execute these commands to validate feature-set implementation with zero regressions:

```bash
# 1. Validate YAML syntax for command profiles
yamllint .claude/config/command-profiles.yaml || echo "YAML validation failed"

# 2. Verify feature-set command file exists and has required sections
grep -q "^# Feature-Set" .claude/commands/feature-set.md && echo "✓ Command file structure valid"

# 3. Verify command frontmatter is correct
grep -A5 "^---" .claude/commands/feature-set.md | grep -q "description:" && echo "✓ Frontmatter valid"

# 4. Check that feature-set profile exists in command profiles
grep -q "feature-set:" .claude/config/command-profiles.yaml && echo "✓ Command profile configured"

# 5. Verify documentation files exist
[ -f ".ai/ai_docs/context-docs/development/feature-set-workflow.md" ] && echo "✓ Documentation exists"

# 6. Verify CLAUDE.md has been updated
grep -q "feature-set" CLAUDE.md && echo "✓ CLAUDE.md updated"

# 7. Test command structure by parsing markdown
if grep -E "^## (PURPOSE|ROLE|INPUTS|METHOD|EXPECTATIONS)" .claude/commands/feature-set.md | wc -l | grep -q "5"; then
  echo "✓ All PRIME sections present"
fi

# 8. Verify output directory structure will be created correctly
[ -d ".ai/specs" ] && echo "✓ Specs directory exists for output"

# 9. Run existing tests to ensure no regressions
pnpm test:unit 2>/dev/null && echo "✓ Unit tests pass"
pnpm test:e2e 2>/dev/null && echo "✓ E2E tests pass"

# 10. Validate no syntax errors in markdown
find .claude/commands -name "*.md" -exec grep -l "^---" {} \; | wc -l | grep -q "[0-9]" && echo "✓ Command markdown files valid"

echo "✓ All validation commands complete"
```

## Notes

### Implementation Philosophy

The `/feature-set` command follows the established patterns in the project:

1. **Uses PRIME framework** like other planning commands (`/feature`, `/diagnose`, `/bug-plan`)
2. **Integrates with conditional documentation routing** for context-aware help
3. **Creates GitHub issues** like `/feature` for tracking and workflow integration
4. **Produces step-by-step plans** ready for `/implement` command execution
5. **Follows naming conventions** and configuration patterns from existing commands

### Future Enhancements

Potential improvements after initial implementation:

1. **AI-powered decomposition**: Use Claude's reasoning to suggest alternative decompositions
2. **Effort estimation**: Integrate time estimates for each feature and overall initiative
3. **Resource allocation**: Suggest team member assignments based on feature types
4. **Risk-based sequencing**: Order features by risk mitigation strategy
5. **Stakeholder templates**: Pre-built decomposition patterns for common initiative types
6. **Iteration support**: Allow refinement of decomposition after initial analysis
7. **Metrics tracking**: Track how decompositions affect actual implementation timelines
8. **Cross-project patterns**: Learn from how other initiatives were decomposed

### Related Commands

- **`/feature`**: Use after `/feature-set` to create detailed plans for individual features
- **`/implement`**: Use after `/feature` to execute the feature implementations
- **`/diagnose`**: Use if issues arise during implementation to investigate root causes
- **`/conditional_docs`**: Called automatically by `/feature-set` to load relevant documentation

### Decision Points for Developers

When implementing, key decisions include:

1. **Decomposition algorithm**: How sophisticated should the feature boundary analysis be?
2. **Interview depth**: How many questions in discovery phase vs. just analyzing the initiative description?
3. **Dependency detection**: Should dependencies be inferred from patterns or explicitly asked?
4. **Phase optimization**: Should phases be auto-determined or suggested for user approval?
5. **Master issue size**: Single master issue vs. separate epic-like issue + feature issues?

Current recommendation: Start simple (good decomposition with pattern-based dependency detection), enhance based on user feedback.

### Success Metrics for Launch

Track these metrics to measure feature-set success:

1. **Adoption**: How many complex initiatives use `/feature-set` vs. manual planning?
2. **Planning time**: Does feature-set reduce planning time by 40-60% as estimated?
3. **Decomposition quality**: Do developers rate the decompositions as accurate and useful?
4. **Workflow completion**: What % of feature-sets lead to completed implementations?
5. **Rework rate**: Do feature-set-guided initiatives have fewer mid-implementation adjustments?
6. **User satisfaction**: Would developers recommend the command to others?

### Known Limitations

Current implementation scope:

- Works best for initiatives with clear architectural boundaries
- Requires some technical familiarity from the user providing initiative description
- Decomposition is analytical, not predictive of actual effort
- No automatic adjustment if decomposition proves incorrect mid-implementation
- Assumes standard project architecture (may need customization for non-standard projects)

These limitations are acceptable for v1; future enhancements can address them.
